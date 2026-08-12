/**
 * Silent persistence for finished seniority sessions (ticket 017 §6).
 *
 * Each completed session (transcript + report JSON, tagged with an id and timestamp) is written to
 * `localStorage` as one flat JSON-serialized array — mirroring the shape ticket 010 fixed for the
 * behavioral mode's attempt history: single machine/browser, no backend, keep-forever, one global
 * list tagged by the seeding key (`seedId` here, the analogue of the behavioral `questionId`).
 *
 * This ticket only PRESERVES the data so the map's "compare reports over time" fog stays buildable.
 * It ships no history/reopen/comparison UI — nothing reads these records back yet.
 */

import type { SeniorityReport, TranscriptTurn } from './report';

/** localStorage key holding the JSON-serialized `StoredSenioritySession[]`. */
export const SENIORITY_SESSIONS_KEY = 'starling.seniority.sessions';

/**
 * One finished seniority session. Unlike the behavioral `Attempt` (feedback only — no transcript
 * existed there), the seniority mode transcribes both sides for free (ticket 013), so the transcript
 * is stored alongside the report to keep 015's re-runnable-over-stored-transcript design buildable.
 */
export interface StoredSenioritySession {
  /** Stable unique id, e.g. crypto.randomUUID(). */
  id: string;
  /** Which opening seeded the session (ticket 016) — the analogue of the behavioral `questionId`. */
  seedId: string;
  /** ISO 8601 timestamp of when the report was reached. */
  timestamp: string;
  transcript: TranscriptTurn[];
  report: SeniorityReport;
}

/**
 * Read all persisted sessions. Defensive: a missing key, malformed JSON, or an unavailable
 * `localStorage` (private mode, disabled storage) yields an empty list rather than throwing — a
 * corrupt or absent store must never break the app.
 */
export function loadSenioritySessions(): StoredSenioritySession[] {
  try {
    const raw = localStorage.getItem(SENIORITY_SESSIONS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredSenioritySession[]) : [];
  } catch (err) {
    console.warn('Could not read persisted seniority sessions; treating as empty.', err);
    return [];
  }
}

/**
 * Append one finished session to the stored list (keep-forever, no auto-cap — ticket 010's
 * retention rule). Failures (quota exceeded, storage unavailable) are non-fatal: they're logged and
 * swallowed so the report still renders, since persistence is a background side-effect of reaching
 * the report, not a gate on showing it.
 */
export function saveSenioritySession(session: StoredSenioritySession): void {
  try {
    const existing = loadSenioritySessions();
    existing.push(session);
    localStorage.setItem(SENIORITY_SESSIONS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Could not persist the finished seniority session.', err);
  }
}
