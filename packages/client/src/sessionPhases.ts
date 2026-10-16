import type { InterviewCategory } from '@starling/bank';

/** Session dial the user picks before start — not stored on the profile (019). */
export type ReviewStance = 'practice' | 'simulation';

/**
 * Guided session phases for the unified shell (020).
 * End-report analyzing lands with ticket 022.
 */
export type SessionPhase =
  | 'start'
  | 'ready'
  | 'recording'
  | 'reviewing'
  | 'submitting'
  | 'picking'
  | 'attemptFeedback'
  | 'finishing';

/** After `/api/pick-follow-up`: next Question, or the tree is done. */
export type PickOutcomePhase = 'ready' | 'treeDone';

const CATEGORY_CHROME: Record<InterviewCategory, string> = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  seniority: 'Seniority',
};

/** Practice listens back; Simulation submits as soon as recording stops. */
export function nextPhaseAfterStop(stance: ReviewStance): 'reviewing' | 'submitting' {
  return stance === 'practice' ? 'reviewing' : 'submitting';
}

/** Map a picker response to the next guided phase. */
export function nextPhaseAfterPick(next: string): PickOutcomePhase {
  return next === 'done' ? 'treeDone' : 'ready';
}

/** Progress line shown on Question screens for both stances. */
export function formatProgressChrome(parts: {
  treeIndex: number;
  treeCount: number;
  category: InterviewCategory;
  questionIndex: number;
}): string {
  return `Tree ${parts.treeIndex + 1} of ${parts.treeCount} · ${CATEGORY_CHROME[parts.category]} · Question ${parts.questionIndex + 1}`;
}

/** End session (confirm + discard) always returns to the start screen. */
export function phaseAfterEndSession(): 'start' {
  return 'start';
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
