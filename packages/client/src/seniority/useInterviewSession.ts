import { useCallback, useRef, useState } from 'react';
import { requestSeniorityReport } from './api';
import { LiveSession } from './liveSession';
import { saveSenioritySession } from './persistence';
import type { SeniorityReport, TranscriptTurn } from './report';

/**
 * The seniority-mode session state machine (ticket 017's screen flow):
 *
 *   idle → connecting → interviewing → generating → report
 *                                    ↘ error
 *
 * The live back-and-forth is driven by a Gemini Live session (ticket 013): `LiveSession` opens the
 * WebSocket, plays the interviewer's native audio, captures the held-to-record answer, and hands
 * back a per-turn transcript of both sides — which this hook feeds to the batch report call (015).
 * Mid-interview reconnection is invisible on purpose: a silent reconnect never leaves `interviewing`.
 */
export type InterviewPhase =
  | 'idle'
  | 'connecting'
  | 'interviewing'
  | 'generating'
  | 'report'
  | 'error';

export function useInterviewSession() {
  const [phase, setPhase] = useState<InterviewPhase>('idle');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [answering, setAnswering] = useState(false);
  const [level, setLevel] = useState(0);
  const [report, setReport] = useState<SeniorityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);

  // `seedId` comes back from the live session (server-side seeding, ticket 016), so it's passed in
  // rather than read from state — the persisted record is tagged with the scenario that actually ran.
  const generateReport = useCallback(
    async (transcript: TranscriptTurn[], seedId: string | undefined) => {
      setPhase('generating');
      try {
        const result = await requestSeniorityReport(transcript);
        setReport(result);
        setPhase('report');
        // Silent persistence (ticket 017 §6): the finished session survives a reload. Non-fatal —
        // the report is already rendering; a failed write is logged inside saveSenioritySession.
        saveSenioritySession({
          id: crypto.randomUUID(),
          seedId: seedId ?? 'unknown',
          timestamp: new Date().toISOString(),
          transcript,
          report: result,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    },
    [],
  );

  const start = useCallback(async () => {
    setError(null);
    setReport(null);
    setCurrentPrompt('');
    setAnswering(false);
    setLevel(0);
    setPhase('connecting');

    const session = new LiveSession({
      onInterviewerTurn: setCurrentPrompt,
      onLevel: setLevel,
      // The first connect flips us into the interview; later reconnects also report `true`, which is
      // a harmless no-op here — we never drop back to `connecting`, so resumption stays invisible.
      onConnectedChange: (connected) => {
        if (connected) setPhase('interviewing');
      },
      // A reconnect cut a held answer short; leave the recording UI so it isn't stuck (ticket 013).
      onAnsweringInterrupted: () => {
        setAnswering(false);
        setLevel(0);
      },
      // The interviewer closed the interview itself (ticket 014) — go straight to the report.
      onEnded: (transcript, seedId) => {
        sessionRef.current = null;
        void generateReport(transcript, seedId);
      },
      onError: (message) => {
        setError(message);
        setPhase('error');
      },
    });
    sessionRef.current = session;

    try {
      await session.start();
    } catch (err) {
      // A mic denial or a failed token mint lands here, before any turn.
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, [generateReport]);

  const beginAnswer = useCallback(() => {
    sessionRef.current?.beginAnswer();
    setAnswering(true);
  }, []);

  const endAnswer = useCallback(() => {
    sessionRef.current?.endAnswer();
    setAnswering(false);
    setLevel(0);
  }, []);

  const replay = useCallback(() => {
    sessionRef.current?.replay();
  }, []);

  /** The candidate ends the screen once the interviewer has wrapped up; hand the transcript to 015. */
  const endInterview = useCallback(() => {
    const session = sessionRef.current;
    const transcript = session?.end() ?? [];
    const seedId = session?.getSeedId();
    sessionRef.current = null;
    if (transcript.length === 0) {
      setError('The interview ended before anything was said.');
      setPhase('error');
      return;
    }
    void generateReport(transcript, seedId);
  }, [generateReport]);

  const reset = useCallback(() => {
    sessionRef.current?.end();
    sessionRef.current = null;
    setPhase('idle');
    setCurrentPrompt('');
    setAnswering(false);
    setLevel(0);
    setReport(null);
    setError(null);
  }, []);

  return {
    phase,
    currentPrompt,
    answering,
    level,
    report,
    error,
    start,
    beginAnswer,
    endAnswer,
    replay,
    endInterview,
    reset,
  };
}
