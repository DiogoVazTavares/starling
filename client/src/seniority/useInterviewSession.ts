import { useCallback, useRef, useState } from 'react';
import { requestSeniorityReport } from './api';
import { LiveSession } from './liveSession';
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

  const generateReport = useCallback(async (transcript: TranscriptTurn[]) => {
    setPhase('generating');
    try {
      const result = await requestSeniorityReport(transcript);
      setReport(result);
      setPhase('report');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, []);

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
  }, []);

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
    const transcript = sessionRef.current?.end() ?? [];
    sessionRef.current = null;
    if (transcript.length === 0) {
      setError('The interview ended before anything was said.');
      setPhase('error');
      return;
    }
    void generateReport(transcript);
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
