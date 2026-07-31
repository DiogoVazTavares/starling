import type { usePracticeSession } from './usePracticeSession';
import { formatDuration } from './usePracticeSession';

/**
 * PROTOTYPE — Variant A: "Guided steps". One phase fills the screen at a time — record,
 * then review, then wait, then feedback — so there's never more than one decision on screen.
 */
export function VariantWizard({ session }: { session: ReturnType<typeof usePracticeSession> }) {
  const { question, questionIndex, questionCount, phase, reviewUrl, latest, error, canNavigate } =
    session;

  return (
    <main className="wizard">
      <nav className="wizard-nav">
        <button type="button" onClick={session.previous} disabled={!canNavigate || questionIndex === 0}>
          ← Previous
        </button>
        <span className="wizard-progress">
          Question {questionIndex + 1} of {questionCount}
        </span>
        <button
          type="button"
          onClick={session.next}
          disabled={!canNavigate || questionIndex === questionCount - 1}
        >
          Next →
        </button>
      </nav>

      <h1 className="wizard-question">{question.prompt}</h1>

      <section className="wizard-step">
        {phase === 'ready' && !latest && (
          <button type="button" className="wizard-cta record" onClick={session.start}>
            Start recording
          </button>
        )}

        {phase === 'ready' && latest && (
          <div className="wizard-step-inner">
            <p className="wizard-hint">Ready when you are.</p>
            <button type="button" className="wizard-cta record" onClick={session.start}>
              Try again
            </button>
          </div>
        )}

        {phase === 'recording' && (
          <div className="wizard-step-inner">
            <span className="wizard-mic" aria-hidden />
            <p className="wizard-timer">{formatDuration(session.elapsedSeconds)}</p>
            <button type="button" className="wizard-cta stop" onClick={session.stopToReview}>
              Stop
            </button>
          </div>
        )}

        {phase === 'reviewing' && reviewUrl && (
          <div className="wizard-step-inner">
            <p className="wizard-hint">Listen back before you send it.</p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio className="wizard-player" src={reviewUrl} controls />
            <div className="wizard-review-actions">
              <button type="button" className="wizard-cta secondary" onClick={session.reRecord}>
                Re-record
              </button>
              <button type="button" className="wizard-cta record" onClick={session.submit}>
                Submit for feedback
              </button>
            </div>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="wizard-step-inner">
            <span className="wizard-spinner" aria-hidden />
            <p className="wizard-hint" aria-live="polite">
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

      {latest && phase !== 'analyzing' && (
        <section className="wizard-feedback">
          <p className="summary">{latest.feedback.overallSummary}</p>
          <ul className="dimensions">
            {latest.feedback.dimensions.map((dimension) => (
              <li key={dimension.name}>
                <div className="dimension-head">
                  <span className="dimension-name">{dimension.name}</span>
                  <span className="score">{dimension.score}/5</span>
                </div>
                <div className="meter" role="presentation">
                  <span style={{ width: `${(dimension.score / 5) * 100}%` }} />
                </div>
                <p className="note">{dimension.note}</p>
              </li>
            ))}
          </ul>
          <div className="fix-its">
            <h2>Next time</h2>
            <ol>
              {latest.feedback.fixIts.map((fix) => (
                <li key={fix}>{fix}</li>
              ))}
            </ol>
          </div>
          <p className={`readiness ${latest.feedback.interviewReady ? 'ready' : 'not-ready'}`}>
            {latest.feedback.interviewReady
              ? 'This would land well in a real interview.'
              : 'This one needs another pass.'}
            <span className="readiness-caveat">Guidance, not a verdict — you decide when to move on.</span>
          </p>
        </section>
      )}
    </main>
  );
}
