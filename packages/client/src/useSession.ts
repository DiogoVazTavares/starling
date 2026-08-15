import { QUESTION_BANK, type Question, type QuestionTree } from '@starling/bank';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Feedback, requestFeedback, requestPickFollowUp } from './api';
import { useRecorder } from './audio/useRecorder';
import { toMono16kWavBase64 } from './audio/wav';
import {
  localDoneWhenEmpty,
  remainingFollowUpCandidates,
  resolveQuestionById,
} from './followUpPool';
import {
  assembleSessionTrees,
  assessProfileFill,
  INTERVIEW_PROFILES,
  type InterviewProfile,
} from './profiles';
import {
  formatProgressChrome,
  nextPhaseAfterPick,
  nextPhaseAfterStop,
  phaseAfterEndSession,
  type ReviewStance,
  type SessionPhase,
} from './sessionPhases';
import {
  advanceToQuestion,
  initialTreeCursor,
  recordAnswered,
  type TreeCursor,
} from './treeCursor';

export type { ReviewStance, SessionPhase };

/** Client soft timeout sits above the server 25 s coerce so hung fetches leave picking. */
const CLIENT_PICK_TIMEOUT_MS = 30_000;

export interface ProfileOption {
  profile: InterviewProfile;
  fillable: boolean;
  reason?: string;
}

/**
 * Session machine (020) for the single-entry shell.
 * After each submit, the session waits on picking (021); empty pools finish locally.
 */
export function useSession() {
  const recorder = useRecorder();
  const [phase, setPhase] = useState<SessionPhase>('start');
  const [profileId, setProfileId] = useState('behavioral-drill');
  const [stance, setStance] = useState<ReviewStance>('practice');
  const [pickedTreeId, setPickedTreeId] = useState<string | 'random'>('random');
  const [sessionTrees, setSessionTrees] = useState<QuestionTree[]>([]);
  const [treeIndex, setTreeIndex] = useState(0);
  const [cursor, setCursor] = useState<TreeCursor | null>(null);
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

  const resetTreeCursor = useCallback((tree: QuestionTree) => {
    setCursor(initialTreeCursor(tree));
    setTreeDone(false);
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
    setCursor(null);
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
      resetTreeCursor(trees[0]);
      setFeedback(null);
      setError(null);
      clearReview();
      setPhase('ready');
    } catch (cause) {
      setError(describe(cause));
    }
  }, [selectedProfile, stance, pickedTreeId, clearReview, resetTreeCursor]);

  const tree = sessionTrees[treeIndex] ?? null;
  const question: Question | null =
    tree && cursor ? resolveQuestionById(tree, cursor.questionId) : null;

  const progressChrome =
    tree && cursor && sessionTrees.length > 0
      ? formatProgressChrome({
          treeIndex,
          treeCount: sessionTrees.length,
          category: tree.category,
          questionIndex: cursor.questionIndex,
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

  const finishTreeOrSession = useCallback(
    (profile: InterviewProfile, trees: QuestionTree[], currentTreeIndex: number) => {
      const nextTree = currentTreeIndex + 1;
      if (nextTree < trees.length) {
        setTreeIndex(nextTree);
        resetTreeCursor(trees[nextTree]);
        setFeedback(null);
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
    [resetTreeCursor],
  );

  const applyPickResult = useCallback(
    (
      profile: InterviewProfile,
      trees: QuestionTree[],
      currentTree: QuestionTree,
      currentTreeIndex: number,
      answered: Question,
      prior: TreeCursor,
      next: string,
      candidates: Question[],
    ) => {
      if (nextPhaseAfterPick(next) === 'treeDone') {
        setCursor(recordAnswered(prior, answered));
        finishTreeOrSession(profile, trees, currentTreeIndex);
        return;
      }

      const nextQuestion =
        resolveQuestionById(currentTree, next) ??
        resolveQuestionById(currentTree, firstCandidateId(candidates) ?? '') ??
        null;

      if (!nextQuestion) {
        setCursor(recordAnswered(prior, answered));
        finishTreeOrSession(profile, trees, currentTreeIndex);
        return;
      }

      setCursor(advanceToQuestion(prior, answered, nextQuestion));
      setFeedback(null);
      setTreeDone(false);
      setPhase('ready');
    },
    [finishTreeOrSession],
  );

  const submitBlob = useCallback(
    async (blob: Blob) => {
      if (!tree || !question || !activeProfile || !cursor) return;

      setPhase('submitting');
      setError(null);
      cancelInFlight();
      const controller = new AbortController();
      abortRef.current = controller;
      const pickSignal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(CLIENT_PICK_TIMEOUT_MS),
      ]);

      const prior = cursor;

      try {
        const wavBase64 = await toMono16kWavBase64(blob);

        if (activeProfile.reportMode === 'perAttempt') {
          const result = await requestFeedback(question.text, wavBase64, controller.signal);
          setFeedback(result);
        }

        setPhase('picking');

        const candidates = remainingFollowUpCandidates(tree, [...prior.askedIds, question.id]);
        const localDone = localDoneWhenEmpty(candidates);
        const followUpsAsked = [...prior.askedIds, question.id].filter(
          (id) => id !== tree.main.id,
        ).length;

        const pick =
          localDone ??
          (await requestPickFollowUp(
            {
              treeId: tree.id,
              answeredQuestionId: question.id,
              answeredQuestionText: question.text,
              audioBase64: wavBase64,
              candidates,
              history: prior.history,
              followUpsAsked,
            },
            pickSignal,
          ));

        if (controller.signal.aborted) return;

        clearReview();
        applyPickResult(
          activeProfile,
          sessionTrees,
          tree,
          treeIndex,
          question,
          prior,
          pick.next,
          candidates,
        );
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(describe(cause));
        // Keep review audio so Practice can re-submit after a pick/network failure (021).
        setPhase(activeStance === 'practice' && reviewUrl ? 'reviewing' : 'ready');
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
      cursor,
      reviewUrl,
      cancelInFlight,
      clearReview,
      applyPickResult,
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
    if (!tree) return;
    setFeedback(null);
    setError(null);
    resetTreeCursor(tree);
    clearReview();
    setPhase('ready');
  }, [clearReview, resetTreeCursor, tree]);

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

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function firstCandidateId(candidates: readonly Question[]): string | undefined {
  if (candidates.length === 0) return undefined;
  return [...candidates].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0]?.id;
}
