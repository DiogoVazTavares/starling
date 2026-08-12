import { useCallback, useEffect, useRef, useState } from 'react';
import { requestSeniorityReport } from './api';
import { saveSenioritySession } from './persistence';
import type { SeniorityReport, TranscriptTurn } from './report';
import { pickRandomSeed, type Seed } from './seeds';

/**
 * The seniority-mode session state machine (ticket 017's screen flow):
 *
 *   idle → connecting → interviewing → generating → report
 *                                    ↘ error
 *
 * SCAFFOLD: the interviewer's turns are driven by a hardcoded MOCK_SCRIPT below, and the report
 * is fetched from /api/seniority-report (which currently returns mock data). The real build
 * replaces the script with the Gemini Live session.
 *
 * TODO(013): replace MOCK_SCRIPT + advanceTurn with a real Live API connection —
 *   mintLiveToken() → open the BidiGenerateContent WebSocket → stream 16 kHz PCM up, play native
 *   audio down, take input/output transcription for free. Reconnection must stay invisible.
 * TODO(014): the interviewer's behaviour (probing, frames, floor-bounded ending) lives in the
 *   Live systemInstruction, seeded by the chosen `seed.opening`.
 */
export type InterviewPhase =
  | 'idle'
  | 'connecting'
  | 'interviewing'
  | 'generating'
  | 'report'
  | 'error';

// A throwaway stand-in for a real conversation, just so the UI can be exercised end to end.
const MOCK_SCRIPT: string[] = [
  'Thanks for making the time. To start — walk me through a project you were proud of. What was your part in it?',
  'Got it. And who actually decided that was worth a whole quarter of the team?',
  'So it sounds like you were mostly the pair of hands executing what the leads set — solid quarter either way, right?',
  "That's helpful. Last thing before we wrap — was there a version of the plan you argued against?",
  "Great — that's everything I wanted to cover. Good talking with you.",
];

export function useInterviewSession() {
  const [phase, setPhase] = useState<InterviewPhase>('idle');
  const [seed, setSeed] = useState<Seed | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [report, setReport] = useState<SeniorityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcript = useRef<TranscriptTurn[]>([]);
  const turnIndex = useRef(0);

  // Mirror `seed` into a ref so `generateReport` (stable, no deps) can tag the persisted session
  // with the seed it actually ran, without re-creating the callback on every seed change. Synced
  // from state via effect (the same ref-mirror pattern as usePracticeSession's reviewUrlRef) so it
  // can never drift from `seed`, whoever sets it.
  const seedRef = useRef<Seed | null>(null);
  useEffect(() => {
    seedRef.current = seed;
  }, [seed]);

  const generateReport = useCallback(async () => {
    setPhase('generating');
    try {
      // TODO(015): the transcript ref is fed to the batch report call. With the real Live session
      // it carries the auto-transcribed candidate answers too; the mock only records interviewer turns.
      const result = await requestSeniorityReport(transcript.current);
      setReport(result);
      setPhase('report');
      // Silent persistence (ticket 017 §6): the finished session survives a reload. Non-fatal —
      // the report is already rendering; a failed write is logged inside saveSenioritySession.
      saveSenioritySession({
        id: crypto.randomUUID(),
        seedId: seedRef.current?.id ?? 'unknown',
        timestamp: new Date().toISOString(),
        transcript: transcript.current,
        report: result,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, []);

  const start = useCallback(() => {
    const chosen = pickRandomSeed();
    setSeed(chosen);
    setError(null);
    setReport(null);
    transcript.current = [];
    turnIndex.current = 0;

    // TODO(013): this is where mintLiveToken() + the WebSocket handshake go. For now, jump straight
    // to the first scripted interviewer turn.
    setPhase('connecting');
    const first = MOCK_SCRIPT[0];
    setCurrentPrompt(first);
    transcript.current.push({ speaker: 'interviewer', text: first });
    setPhase('interviewing');
  }, []);

  /**
   * Called when the candidate finishes speaking a turn. In the scaffold we don't capture audio;
   * we just record a placeholder candidate turn and advance the script.
   *
   * TODO(013): replace `spokenText` placeholder with the Live API's input transcription.
   */
  const submitAnswer = useCallback(
    (spokenText = '[candidate audio — transcribed by the Live API in the real build]') => {
      transcript.current.push({ speaker: 'candidate', text: spokenText });
      const next = turnIndex.current + 1;

      if (next >= MOCK_SCRIPT.length) {
        void generateReport();
        return;
      }

      turnIndex.current = next;
      const prompt = MOCK_SCRIPT[next];
      setCurrentPrompt(prompt);
      transcript.current.push({ speaker: 'interviewer', text: prompt });
    },
    [generateReport],
  );

  const reset = useCallback(() => {
    setPhase('idle');
    setSeed(null);
    setCurrentPrompt('');
    setReport(null);
    setError(null);
    transcript.current = [];
    turnIndex.current = 0;
  }, []);

  return { phase, seed, currentPrompt, report, error, start, submitAnswer, reset };
}
