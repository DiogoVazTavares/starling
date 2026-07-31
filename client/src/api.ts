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

/** Goes to the Hono server (Vite proxies `/api`), which holds the Gemini key. */
export async function requestFeedback(question: string, audioBase64: string): Promise<Feedback> {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, audioBase64 }),
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
