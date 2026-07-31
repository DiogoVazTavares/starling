import { useState } from 'react';
import { FeedbackPanel } from './FeedbackPanel';
import { requestFeedback, type Feedback } from './api';
import { toMono16kWavBase64 } from './audio/wav';
import { useRecorder } from './audio/useRecorder';
import { QUESTION_BANK } from './questions';
import './App.css';

type Phase = 'ready' | 'recording' | 'analyzing';

export default function App() {
  const recorder = useRecorder();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const question = QUESTION_BANK[questionIndex];
  // Not a pass/lock gate (ticket 002 rules that out) — just guards against switching
  // questions mid-recording or mid-request, which would orphan the recorder or attribute
  // an in-flight response to the wrong question.
  const canNavigate = phase === 'ready';

  function goToQuestion(index: number) {
    setQuestionIndex(index);
    setFeedback(null);
    setError(null);
    setAttempt(0);
  }

  function handlePrevious() {
    goToQuestion(Math.max(questionIndex - 1, 0));
  }

  function handleNext() {
    goToQuestion(Math.min(questionIndex + 1, QUESTION_BANK.length - 1));
  }

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
      setFeedback(await requestFeedback(question.prompt, wavBase64));
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
        <p className="eyebrow">
          Question {questionIndex + 1} of {QUESTION_BANK.length}
          {attempt > 0 && ` · attempt ${attempt + 1}`}
        </p>
        <h1>{question.prompt}</h1>
      </header>

      <nav className="question-nav">
        <button type="button" onClick={handlePrevious} disabled={!canNavigate || questionIndex === 0}>
          ← Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNavigate || questionIndex === QUESTION_BANK.length - 1}
        >
          Next →
        </button>
      </nav>

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
