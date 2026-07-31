import { useCallback, useEffect, useRef, useState } from 'react';
import { requestFeedback, type Feedback } from './api';
import { toMono16kWavBase64 } from './audio/wav';
import { useRecorder } from './audio/useRecorder';
import { QUESTION_BANK } from './questions';

/**
 * Practice-screen state machine, per wayfinder ticket 005: record -> review (listen back,
 * re-record if needed) -> submit -> feedback. Free navigation throughout (ticket 002) —
 * there's no pass/lock gate, `canNavigate` just guards against orphaning an in-flight
 * recording or request.
 */
export type Phase = 'ready' | 'recording' | 'reviewing' | 'analyzing';

export function usePracticeSession() {
  const recorder = useRecorder();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
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
  const canNavigate = phase === 'ready' || phase === 'reviewing';

  function clearReview() {
    setReviewBlob(null);
    setReviewUrl((existing) => {
      if (existing) URL.revokeObjectURL(existing);
      return null;
    });
  }

  function goToQuestion(index: number) {
    setQuestionIndex(index);
    clearReview();
    setFeedback(null);
    setError(null);
    setAttempt(0);
    setPhase('ready');
  }

  const previous = useCallback(() => goToQuestion(Math.max(questionIndex - 1, 0)), [questionIndex]);
  const next = useCallback(
    () => goToQuestion(Math.min(questionIndex + 1, QUESTION_BANK.length - 1)),
    [questionIndex],
  );

  const start = useCallback(async () => {
    setError(null);
    setFeedback(null);
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
  }, [recorder]);

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
      setFeedback(await requestFeedback(question.prompt, wavBase64));
      setAttempt((count) => count + 1);
      clearReview();
      setPhase('ready');
    } catch (cause) {
      setError(describe(cause));
      setPhase('reviewing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewBlob, question]);

  return {
    question,
    questionIndex,
    questionCount: QUESTION_BANK.length,
    phase,
    reviewUrl,
    feedback,
    error,
    attempt,
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

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
