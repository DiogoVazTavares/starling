/**
 * The feedback contract, mirrored from wayfinder/tickets/002-feedback-rubric.md — the same
 * shape the server pins as Gemini's `response_format` schema.
 */

export interface Dimension {
  name: string;
  score: number;
  note: string;
}

export interface Feedback {
  dimensions: Dimension[];
  fixIts: string[];
  overallSummary: string;
  /** Advisory only — it never gates. The user decides when an answer is good enough. */
  interviewReady: boolean;
}

export interface PickerHistoryEntry {
  questionId: string;
  questionText: string;
  coverageNote?: string;
}

export interface PickFollowUpCandidate {
  id: string;
  text: string;
  tags?: string[];
  required?: boolean;
}

export interface PickFollowUpRequest {
  treeId: string;
  answeredQuestionId: string;
  answeredQuestionText: string;
  audioBase64: string;
  candidates: PickFollowUpCandidate[];
  history: PickerHistoryEntry[];
  followUpsAsked: number;
}

export type PickFollowUpResponse = { next: 'done' } | { next: string; reason?: string };

/** Goes to the Hono server (Vite proxies `/api`), which holds the Gemini key. */
export async function requestFeedback(
  question: string,
  audioBase64: string,
  signal?: AbortSignal,
): Promise<Feedback> {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, audioBase64 }),
    signal,
  });

  if (!response.ok) {
    const reported = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => undefined);
    throw new Error(reported ?? `The server returned ${response.status}.`);
  }

  return response.json() as Promise<Feedback>;
}

/** Mid-session follow-up pick (ticket 021). */
export async function requestPickFollowUp(
  body: PickFollowUpRequest,
  signal?: AbortSignal,
): Promise<PickFollowUpResponse> {
  const response = await fetch('/api/pick-follow-up', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const reported = await response
      .json()
      .then((payload: { error?: string }) => payload.error)
      .catch(() => undefined);
    throw new Error(reported ?? `The server returned ${response.status}.`);
  }

  return response.json() as Promise<PickFollowUpResponse>;
}
