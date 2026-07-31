import { FeedbackPanel } from './FeedbackPanel';
import { usePracticeSession, formatDuration } from './usePracticeSession';
import './App.css';

export default function App() {
  const session = usePracticeSession();
  const { question, questionIndex, questionCount, phase, reviewUrl, feedback, error, attempt, canNavigate } =
    session;

  return (
    <main>
      <nav className="question-nav">
        <button
          type="button"
          onClick={session.previous}
          disabled={!canNavigate || questionIndex === 0}
        >
          ← Previous
        </button>
        <span className="eyebrow">
          Question {questionIndex + 1} of {questionCount}
          {attempt > 0 && ` · attempt ${attempt + 1}`}
        </span>
        <button
          type="button"
          onClick={session.next}
          disabled={!canNavigate || questionIndex === questionCount - 1}
        >
          Next →
        </button>
      </nav>

      <h1>{question.prompt}</h1>

      <section className="step">
        {phase === 'ready' && !feedback && (
          <button type="button" className="cta record" onClick={session.start}>
            Start recording
          </button>
        )}

        {phase === 'ready' && feedback && (
          <div className="step-inner">
            <p className="hint">Ready when you are.</p>
            <button type="button" className="cta record" onClick={session.start}>
              Try again
            </button>
          </div>
        )}

        {phase === 'recording' && (
          <div className="step-inner">
            <span className="mic" aria-hidden />
            <p className="timer">{formatDuration(session.elapsedSeconds)}</p>
            <button type="button" className="cta stop" onClick={session.stopToReview}>
              Stop
            </button>
          </div>
        )}

        {phase === 'reviewing' && reviewUrl && (
          <div className="step-inner">
            <p className="hint">Listen back before you send it.</p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio className="player" src={reviewUrl} controls />
            <div className="review-actions">
              <button type="button" className="cta secondary" onClick={session.reRecord}>
                Re-record
              </button>
              <button type="button" className="cta record" onClick={session.submit}>
                Submit for feedback
              </button>
            </div>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="step-inner">
            <span className="spinner" aria-hidden />
            <p className="hint" aria-live="polite">
              Listening to your answer…
            </p>
          </div>
        )}
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {feedback && phase !== 'analyzing' && <FeedbackPanel feedback={feedback} />}
    </main>
  );
}
