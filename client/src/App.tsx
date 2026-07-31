import { useState } from 'react';
import { FeedbackPanel } from './FeedbackPanel';
import { requestFeedback, type Feedback } from './api';
import { toMono16kWavBase64 } from './audio/wav';
import { useRecorder } from './audio/useRecorder';
import './App.css';

/** One hardcoded question — the question bank is ticket 003, deliberately out of this slice. */
const QUESTION = 'Tell me about a time you had to give difficult feedback to a colleague.';

type Phase = 'ready' | 'recording' | 'analyzing';

export default function App() {
  const recorder = useRecorder();
  const [phase, setPhase] = useState<Phase>('ready');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  async function handleStart() {
    setError(null);
    setFeedback(null);
    try {
      await recorder.start();
      setPhase('recording');
    } catch (cause) {
      setPhase('ready');
      setError(
        cause instanceof DOMException && cause.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser to record an answer.'
          : describe(cause),
      );
    }
  }

  async function handleStop() {
    setPhase('analyzing');
    try {
      const recorded = await recorder.stop();
      const wavBase64 = await toMono16kWavBase64(recorded);
      setFeedback(await requestFeedback(QUESTION, wavBase64));
      setAttempt((count) => count + 1);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setPhase('ready');
    }
  }

  const isAnalyzing = phase === 'analyzing';

  return (
    <main>
      <header>
        <p className="eyebrow">Behavioral practice{attempt > 0 && ` · attempt ${attempt + 1}`}</p>
        <h1>{QUESTION}</h1>
      </header>

      <div className="controls">
        {phase === 'recording' ? (
          <button type="button" className="stop" onClick={handleStop}>
            Stop &amp; get feedback
          </button>
        ) : (
          <button type="button" className="record" onClick={handleStart} disabled={isAnalyzing}>
            {feedback ? 'Try again' : 'Start recording'}
          </button>
        )}

        <span className="status" aria-live="polite">
          {phase === 'recording' && (
            <>
              <span className="pulse" /> Recording · {formatDuration(recorder.elapsedSeconds)}
            </>
          )}
          {isAnalyzing && 'Listening to your answer…'}
        </span>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {feedback && <FeedbackPanel feedback={feedback} />}
    </main>
  );
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
