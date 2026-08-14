/**
 * Client calls for the seniority mode. Both go to the Hono server (Vite proxies `/api`), which
 * holds the Gemini key — the browser never sees it (ticket 004).
 */

import type { SeniorityReport, TranscriptTurn } from './report';

export interface LiveToken {
  /** The ephemeral token the browser authenticates the Live WebSocket with. */
  token: string;
  /** The model the token is locked to — passed straight back to `live.connect`. */
  model: string;
  /** The chosen scenario seed; hand it back on reconnection to resume the same interview. */
  seedId: string;
  expiresAt: string;
}

/**
 * Mint a short-lived ephemeral token so the browser can open the Gemini Live WebSocket directly
 * (ticket 013 — the backend stays thin, no audio relay). The whole interviewer config is locked
 * into the token server-side, so the browser never sees the persona/protocol prompt.
 *
 * Pass the `seedId` from a prior mint to resume the same scenario after a dropped connection;
 * omit it to start a fresh random session.
 */
export async function mintLiveToken(seedId?: string): Promise<LiveToken> {
  const response = await fetch('/api/live-token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(seedId ? { seedId } : {}),
  });
  if (!response.ok) {
    const reported = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => undefined);
    throw new Error(reported ?? `Could not start a session (server returned ${response.status}).`);
  }
  return response.json() as Promise<LiveToken>;
}

/**
 * Generate the end-of-session report from the full transcript — a batch call over text on the
 * behavioral mode's proven stack, NOT the Live session (ticket 015).
 */
export async function requestSeniorityReport(
  transcript: TranscriptTurn[],
): Promise<SeniorityReport> {
  const response = await fetch('/api/seniority-report', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    const reported = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => undefined);
    throw new Error(reported ?? `The server returned ${response.status}.`);
  }

  return response.json() as Promise<SeniorityReport>;
}
