import { useCallback, useEffect, useRef, useState } from 'react';
import { requestFeedback, type Feedback } from '../api';
import { toMono16kWavBase64 } from '../audio/wav';
import { useRecorder } from '../audio/useRecorder';
import { QUESTION_BANK } from '../questions';

/**
 * PROTOTYPE (wayfinder ticket 005) — shared state/logic behind all three practice-screen
 * variants. This is the part that ISN'T under question (recording, submission, question
 * nav); only how it's rendered differs per variant. No persistence — history lives in memory
 * for the current tab only, same as the real app today (cross-session persistence is 010).
 */

export type Phase = 'ready' | 'recording' | 'reviewing' | 'analyzing';

export interface Attempt {
  attemptNumber: number;
  feedback: Feedback;
  /** Object URL for that attempt's own recording, so past attempts stay replayable. */
  audioUrl: string;
}

export function usePracticeSession() {
  const recorder = useRecorder();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    reviewUrlRef.current = reviewUrl;
  }, [reviewUrl]);

  // Revoke whichever review URL was live when the component unmounts.
  useEffect(() => {
    return () => {
      if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
    };
  }, []);

  const question = QUESTION_BANK[questionIndex];
  const latest = history.at(-1) ?? null;
  const canNavigate = phase === 'ready' || phase === 'reviewing';

  function clearReview() {
    setReviewBlob(null);
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(null);
  }

  function goToQuestion(index: number) {
    setQuestionIndex(index);
    clearReview();
    setHistory([]);
    setError(null);
    setPhase('ready');
  }

  const previous = useCallback(
    () => goToQuestion(Math.max(questionIndex - 1, 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questionIndex, reviewUrl],
  );
  const next = useCallback(
    () => goToQuestion(Math.min(questionIndex + 1, QUESTION_BANK.length - 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questionIndex, reviewUrl],
  );

  const start = useCallback(async () => {
    setError(null);
    clearReview();
    try {
      await recorder.start();
      setPhase('recording');
    } catch (cause) {
      setPhase('ready');
      setError(
        cause instanceof DOMException && cause.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser to record an answer.'
          : describe(cause),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder, reviewUrl]);

  const stopToReview = useCallback(async () => {
    try {
      const blob = await recorder.stop();
      setReviewBlob(blob);
      setReviewUrl(URL.createObjectURL(blob));
      setPhase('reviewing');
    } catch (cause) {
      setError(describe(cause));
      setPhase('ready');
    }
  }, [recorder]);

  const reRecord = useCallback(() => {
    void start();
  }, [start]);

  const submit = useCallback(async () => {
    if (!reviewBlob) return;
    setPhase('analyzing');
    setError(null);
    try {
      const wavBase64 = await toMono16kWavBase64(reviewBlob);
      const feedback = await requestFeedback(question.prompt, wavBase64);
      setHistory((existing) => [
        ...existing,
        { attemptNumber: existing.length + 1, feedback, audioUrl: reviewUrl! },
      ]);
      setReviewBlob(null);
      setReviewUrl(null); // ownership moves to the history entry; don't revoke it here
      setPhase('ready');
    } catch (cause) {
      setError(describe(cause));
      setPhase('reviewing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewBlob, reviewUrl, question]);

  return {
    question,
    questionIndex,
    questionCount: QUESTION_BANK.length,
    phase,
    reviewUrl,
    history,
    latest,
    error,
    canNavigate,
    elapsedSeconds: recorder.elapsedSeconds,
    start,
    stopToReview,
    reRecord,
    submit,
    previous,
    next,
  };
}

export function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
