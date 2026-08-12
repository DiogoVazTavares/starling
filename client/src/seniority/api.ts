/**
 * Client calls for the seniority mode. Both go to the Hono server (Vite proxies `/api`), which
 * holds the Gemini key — the browser never sees it (ticket 004).
 */

import type { SeniorityReport, TranscriptTurn } from './report';

export interface LiveToken {
  token: string;
  expiresAt: string;
}

/**
 * Mint a short-lived ephemeral token so the browser can open the Gemini Live WebSocket directly
 * (ticket 013 — the backend stays thin, no audio relay).
 *
 * TODO(013): server returns 501 until the token-minting endpoint is implemented.
 */
export async function mintLiveToken(): Promise<LiveToken> {
  const response = await fetch('/api/live-token', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Could not start a session (server returned ${response.status}).`);
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
