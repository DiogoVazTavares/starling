/**
 * Follow-up picker policy (ticket 021).
 * Hard rules live here; Gemini only chooses among remaining candidates when this module
 * returns null from `resolveBeforeModel`.
 */

export const DEFAULT_MAX_FOLLOW_UPS = 2;

/** Soft timeout for the mid-session wait (~10 s target UX; 25 s then fallback). */
export const PICKER_SOFT_TIMEOUT_MS = 25_000;

export interface PickerCandidate {
  id: string;
  text: string;
  tags?: string[];
  required?: boolean;
}

export interface PickerHistoryEntry {
  questionId: string;
  questionText: string;
  coverageNote?: string;
}

export interface PickFollowUpRequest {
  treeId: string;
  answeredQuestionId: string;
  /** Written prompt for the Question just answered — used in the picker prompt. */
  answeredQuestionText: string;
  audioBase64: string;
  candidates: PickerCandidate[];
  history: PickerHistoryEntry[];
  followUpsAsked: number;
}

export type PickFollowUpResult =
  | { next: 'done' }
  | { next: string; reason?: string };

export const PICKER_SYSTEM_INSTRUCTION = `You are an interview conductor. You pick the next follow-up from a pre-authored pool, or end the tree with "done".

You never invent questions, paraphrase new ones, or return an id that is not in the candidate list. Prefer probing weak or missing angles; skip topics the candidate already covered well. Prefer required candidates before finishing. Use tags only as soft hints.`;

/** Build Gemini `response_format.schema` with a dynamic next enum. */
export function buildPickerSchema(candidateIds: string[]) {
  return {
    type: 'object',
    properties: {
      next: {
        type: 'string',
        enum: [...candidateIds, 'done'],
        description:
          'Id of the next follow-up from the remaining pool, or "done" if no further question is needed.',
      },
      reason: {
        type: 'string',
        description: 'One short sentence explaining the choice.',
      },
    },
    required: ['next'],
  } as const;
}

export function buildPickerPrompt(input: {
  treeId: string;
  answeredQuestionId: string;
  answeredQuestionText: string;
  candidates: PickerCandidate[];
  history: PickerHistoryEntry[];
  followUpsAsked: number;
  maxFollowUps?: number;
}): string {
  const maxFollowUps = input.maxFollowUps ?? DEFAULT_MAX_FOLLOW_UPS;
  const historyLines =
    input.history.length === 0
      ? '(none yet — this was the first answer in the tree)'
      : input.history
          .map((entry) => {
            const note = entry.coverageNote ? ` — ${entry.coverageNote}` : '';
            return `- ${entry.questionId}: "${entry.questionText}"${note}`;
          })
          .join('\n');

  const candidateLines = input.candidates
    .map((c) => {
      const tags = c.tags?.length ? ` tags=[${c.tags.join(', ')}]` : '';
      const required = c.required ? ' required=true' : '';
      return `- ${c.id}${required}${tags}: "${c.text}"`;
    })
    .join('\n');

  return `Tree: ${input.treeId}
Just answered (${input.answeredQuestionId}): "${input.answeredQuestionText}"
Follow-ups already asked after the main: ${input.followUpsAsked} (cap ${maxFollowUps}; required may still override)

Prior questions in this tree:
${historyLines}

Remaining candidates (pick one id, or "done"):
${candidateLines}

Listen to the just-submitted audio answer. Choose the next follow-up id from the list, or "done" if the tree should end.`;
}

/** Extract `next` from model JSON; returns undefined when unusable. */
export function parseModelNext(text: string): string | undefined {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const next = (value as Record<string, unknown>).next;
  return typeof next === 'string' ? next : undefined;
}

/**
 * Local short-circuits before any Gemini call.
 * Returns a result to send as-is, or `null` when the model should choose.
 */
export function resolveBeforeModel(
  candidates: PickerCandidate[],
  followUpsAsked: number,
  maxFollowUps = DEFAULT_MAX_FOLLOW_UPS,
): PickFollowUpResult | null {
  if (candidates.length === 0) {
    return { next: 'done' };
  }

  if (followUpsAsked >= maxFollowUps) {
    const required = sortById(candidates.filter((c) => c.required === true));
    if (required.length === 0) {
      return { next: 'done' };
    }
    return { next: required[0].id, reason: 'required-under-cap' };
  }

  return null;
}

/** Re-validate / coerce the model choice against the remaining pool. */
export function applyModelChoice(
  candidates: PickerCandidate[],
  followUpsAsked: number,
  modelNext: string | undefined,
  maxFollowUps = DEFAULT_MAX_FOLLOW_UPS,
): PickFollowUpResult {
  if (modelNext === 'done') {
    const required = sortById(candidates.filter((c) => c.required === true));
    if (required.length > 0) {
      return { next: required[0].id, reason: 'required-override' };
    }
    return { next: 'done' };
  }

  if (typeof modelNext === 'string' && modelNext !== '' && candidates.some((c) => c.id === modelNext)) {
    return { next: modelNext };
  }

  return deterministicFallback(candidates, followUpsAsked, maxFollowUps);
}

/**
 * Deterministic fallback when Gemini fails or returns garbage:
 * (1) first remaining required by id, (2) first optional under cap, (3) done.
 */
export function deterministicFallback(
  candidates: PickerCandidate[],
  followUpsAsked: number,
  maxFollowUps = DEFAULT_MAX_FOLLOW_UPS,
): PickFollowUpResult {
  const required = sortById(candidates.filter((c) => c.required === true));
  if (required.length > 0) {
    return { next: required[0].id, reason: 'fallback' };
  }

  if (followUpsAsked < maxFollowUps) {
    const optional = sortById(candidates.filter((c) => c.required !== true));
    if (optional.length > 0) {
      return { next: optional[0].id, reason: 'fallback' };
    }
  }

  return { next: 'done' };
}

function sortById(candidates: PickerCandidate[]): PickerCandidate[] {
  return [...candidates].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
