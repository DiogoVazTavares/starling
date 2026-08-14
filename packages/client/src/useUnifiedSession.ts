import { QUESTION_BANK, type Question, type QuestionTree } from '@starling/bank';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Feedback, requestFeedback } from './api';
import { useRecorder } from './audio/useRecorder';
import { toMono16kWavBase64 } from './audio/wav';
import {
  assembleSessionTrees,
  assessProfileFill,
  INTERVIEW_PROFILES,
  type InterviewProfile,
} from './profiles';
import {
  formatProgressChrome,
  nextPhaseAfterStop,
  phaseAfterEndSession,
  type ReviewStance,
  type SessionPhase,
} from './sessionPhases';

export type { ReviewStance, SessionPhase };

export interface ProfileOption {
  profile: InterviewProfile;
  fillable: boolean;
  reason?: string;
}

/**
 * Unified session machine (020) for the single-entry shell.
 * Behavioral drill (`perAttempt`) is the full path; `endReport` profiles run tree mains
 * then finish without an end-report screen (that lands with ticket 022).
 */
export function useUnifiedSession() {
  const recorder = useRecorder();
  const [phase, setPhase] = useState<SessionPhase>('start');
  const [profileId, setProfileId] = useState('behavioral-drill');
  const [stance, setStance] = useState<ReviewStance>('practice');
  const [pickedTreeId, setPickedTreeId] = useState<string | 'random'>('random');
  const [sessionTrees, setSessionTrees] = useState<QuestionTree[]>([]);
  const [treeIndex, setTreeIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activeProfile, setActiveProfile] = useState<InterviewProfile | null>(null);
  const [activeStance, setActiveStance] = useState<ReviewStance>('practice');
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [treeDone, setTreeDone] = useState(false);
  const reviewUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    reviewUrlRef.current = reviewUrl;
  }, [reviewUrl]);

  useEffect(() => {
    return () => {
      if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const profileOptions: ProfileOption[] = INTERVIEW_PROFILES.map((profile) => {
    const fill = assessProfileFill(profile, QUESTION_BANK);
    return fill.fillable
      ? { profile, fillable: true }
      : { profile, fillable: false, reason: fill.reason };
  });

  const selectedProfile =
    INTERVIEW_PROFILES.find((profile) => profile.id === profileId) ?? INTERVIEW_PROFILES[0];

  const clearReview = useCallback(() => {
    setReviewBlob(null);
    setReviewUrl((existing) => {
      if (existing) URL.revokeObjectURL(existing);
      return null;
    });
  }, []);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const resetToStart = useCallback(() => {
    cancelInFlight();
    if (recorder.status === 'recording') {
      void recorder.stop().catch(() => {
        /* discard in-progress take */
      });
    }
    clearReview();
    setFeedback(null);
    setError(null);
    setSessionTrees([]);
    setTreeIndex(0);
    setQuestionIndex(0);
    setActiveProfile(null);
    setTreeDone(false);
    setPhase(phaseAfterEndSession());
  }, [cancelInFlight, clearReview, recorder]);

  const startSession = useCallback(() => {
    const fill = assessProfileFill(selectedProfile, QUESTION_BANK);
    if (!fill.fillable) {
      setError(fill.reason);
      return;
    }

    try {
      const trees = assembleSessionTrees(selectedProfile, QUESTION_BANK, {
        treeId:
          selectedProfile.treePick === 'userOptional' && pickedTreeId !== 'random'
            ? pickedTreeId
            : undefined,
      });
      setActiveProfile(selectedProfile);
      setActiveStance(stance);
      setSessionTrees(trees);
      setTreeIndex(0);
      setQuestionIndex(0);
      setFeedback(null);
      setError(null);
      setTreeDone(false);
      clearReview();
      setPhase('ready');
    } catch (cause) {
      setError(describe(cause));
    }
  }, [selectedProfile, stance, pickedTreeId, clearReview]);

  const tree = sessionTrees[treeIndex] ?? null;
  const question: Question | null = tree ? questionAt(tree, questionIndex) : null;

  const progressChrome =
    tree && sessionTrees.length > 0
      ? formatProgressChrome({
          treeIndex,
          treeCount: sessionTrees.length,
          category: tree.category,
          questionIndex,
        })
      : null;

  const startRecording = useCallback(async () => {
    setError(null);
    setFeedback(null);
    clearReview();
    setTreeDone(false);
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

  const advanceAfterAnswer = useCallback(
    (profile: InterviewProfile, trees: QuestionTree[], currentTreeIndex: number) => {
      // Follow-up picker (021) is not wired yet — each tree is one Question (the main).
      const nextTree = currentTreeIndex + 1;
      if (nextTree < trees.length) {
        setTreeIndex(nextTree);
        setQuestionIndex(0);
        setFeedback(null);
        setTreeDone(false);
        setPhase('ready');
        return;
      }

      if (profile.reportMode === 'perAttempt') {
        setTreeDone(true);
        setPhase('attemptFeedback');
        return;
      }

      setPhase('finishing');
    },
    [],
  );

  const submitBlob = useCallback(
    async (blob: Blob) => {
      if (!tree || !question || !activeProfile) return;

      setPhase('submitting');
      setError(null);
      cancelInFlight();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (activeProfile.reportMode === 'perAttempt') {
          const wavBase64 = await toMono16kWavBase64(blob);
          const result = await requestFeedback(question.text, wavBase64, controller.signal);
          setFeedback(result);
          clearReview();
          // Empty follow-up pools → tree done after the main (picker lands later).
          setTreeDone(true);
          setPhase('attemptFeedback');
        } else {
          // endReport: record answers only; end-report UI lands with 022.
          clearReview();
          advanceAfterAnswer(activeProfile, sessionTrees, treeIndex);
        }
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(describe(cause));
        setPhase(activeStance === 'practice' ? 'reviewing' : 'ready');
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [
      tree,
      question,
      activeProfile,
      activeStance,
      sessionTrees,
      treeIndex,
      cancelInFlight,
      clearReview,
      advanceAfterAnswer,
    ],
  );

  const stopRecording = useCallback(async () => {
    try {
      const blob = await recorder.stop();
      const next = nextPhaseAfterStop(activeStance);
      if (next === 'reviewing') {
        setReviewBlob(blob);
        setReviewUrl(URL.createObjectURL(blob));
        setPhase('reviewing');
        return;
      }
      setReviewBlob(blob);
      await submitBlob(blob);
    } catch (cause) {
      setError(describe(cause));
      setPhase('ready');
    }
  }, [recorder, activeStance, submitBlob]);

  const reRecord = useCallback(() => {
    void startRecording();
  }, [startRecording]);

  const submitReview = useCallback(async () => {
    if (!reviewBlob) return;
    await submitBlob(reviewBlob);
  }, [reviewBlob, submitBlob]);

  const tryAgain = useCallback(() => {
    setFeedback(null);
    setError(null);
    setTreeDone(false);
    setQuestionIndex(0);
    clearReview();
    setPhase('ready');
  }, [clearReview]);

  const endSession = useCallback(() => {
    resetToStart();
  }, [resetToStart]);

  return {
    phase,
    profileOptions,
    profileId,
    setProfileId,
    stance,
    setStance,
    pickedTreeId,
    setPickedTreeId,
    selectedProfile,
    tree,
    question,
    progressChrome,
    reviewUrl,
    feedback,
    error,
    treeDone,
    elapsedSeconds: recorder.elapsedSeconds,
    activeProfile,
    startSession,
    startRecording,
    stopRecording,
    reRecord,
    submitReview,
    tryAgain,
    backToStart: resetToStart,
    endSession,
  };
}

function questionAt(tree: QuestionTree, questionIndex: number): Question {
  if (questionIndex <= 0) return tree.main;
  const followUp = tree.followUps[questionIndex - 1];
  return followUp ?? tree.main;
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
