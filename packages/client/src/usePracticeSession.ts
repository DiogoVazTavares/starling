import { QUESTION_BANK, type QuestionTree } from '@starling/bank';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Feedback, requestFeedback } from './api';
import { useRecorder } from './audio/useRecorder';
import { toMono16kWavBase64 } from './audio/wav';

/** Practice loop stays on behavioral trees until the unified session shell lands. */
const DRILL_TREES: QuestionTree[] = QUESTION_BANK.filter((tree) => tree.category === 'behavioral');

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

  const tree = DRILL_TREES[questionIndex];
  const canNavigate = phase === 'ready' || phase === 'reviewing';

  // Memoized so the callbacks below can list them as dependencies honestly. Both close over
  // nothing but setState functions, which React keeps stable, so their identity never changes.
  const clearReview = useCallback(() => {
    setReviewBlob(null);
    setReviewUrl((existing) => {
      if (existing) URL.revokeObjectURL(existing);
      return null;
    });
  }, []);

  const goToQuestion = useCallback(
    (index: number) => {
      setQuestionIndex(index);
      clearReview();
      setFeedback(null);
      setError(null);
      setAttempt(0);
      setPhase('ready');
    },
    [clearReview],
  );

  const previous = useCallback(
    () => goToQuestion(Math.max(questionIndex - 1, 0)),
    [questionIndex, goToQuestion],
  );
  const next = useCallback(
    () => goToQuestion(Math.min(questionIndex + 1, DRILL_TREES.length - 1)),
    [questionIndex, goToQuestion],
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
  }, [recorder, clearReview]);

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
      setFeedback(await requestFeedback(tree.main.text, wavBase64));
      setAttempt((count) => count + 1);
      clearReview();
      setPhase('ready');
    } catch (cause) {
      setError(describe(cause));
      setPhase('reviewing');
    }
  }, [reviewBlob, tree, clearReview]);

  return {
    tree,
    questionIndex,
    questionCount: DRILL_TREES.length,
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
