import type { usePracticeSession } from './usePracticeSession';
import { formatDuration } from './usePracticeSession';

/**
 * PROTOTYPE — Variant C: "Cockpit". A persistent left pane (question, nav, recorder, review
 * player) never changes shape; the right pane is dedicated to feedback and shows an
 * empty-state, a shaped skeleton while waiting, or the scorecard once it arrives.
 */
export function VariantSplit({ session }: { session: ReturnType<typeof usePracticeSession> }) {
  const { question, questionIndex, questionCount, phase, reviewUrl, latest, error, canNavigate } =
    session;

  return (
    <main className="split">
      <section className="split-pane split-controls">
        <nav className="split-nav">
          <button
            type="button"
            onClick={session.previous}
            disabled={!canNavigate || questionIndex === 0}
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={session.next}
            disabled={!canNavigate || questionIndex === questionCount - 1}
          >
            Next →
          </button>
        </nav>
        <p className="eyebrow">
          Question {questionIndex + 1} of {questionCount}
        </p>
        <h1 className="split-question">{question.prompt}</h1>

        <div className="split-recorder">
          {phase === 'ready' && (
            <button type="button" className="record" onClick={session.start}>
              {latest ? 'Try again' : 'Start recording'}
            </button>
          )}
          {phase === 'recording' && (
            <>
              <span className="status" aria-live="polite">
                <span className="pulse" /> Recording · {formatDuration(session.elapsedSeconds)}
              </span>
              <button type="button" className="stop" onClick={session.stopToReview}>
                Stop
              </button>
            </>
          )}
          {(phase === 'reviewing' || phase === 'analyzing') && reviewUrl && (
            <div className="split-review">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio src={reviewUrl} controls />
              <div className="split-review-actions">
                <button type="button" onClick={session.reRecord} disabled={phase === 'analyzing'}>
                  Re-record
                </button>
                <button type="button" className="record" onClick={session.submit} disabled={phase === 'analyzing'}>
                  {phase === 'analyzing' ? 'Sending…' : 'Submit for feedback'}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="split-pane split-feedback">
        {!latest && phase !== 'analyzing' && (
          <p className="split-placeholder">Your feedback will appear here once you submit an answer.</p>
        )}

        {phase === 'analyzing' && (
          <div className="split-skeleton" aria-hidden>
            <div className="skeleton-line skeleton-summary" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        )}

        {latest && phase !== 'analyzing' && (
          <>
            <p className={`readiness-banner ${latest.feedback.interviewReady ? 'ready' : 'not-ready'}`}>
              {latest.feedback.interviewReady
                ? 'This would land well in a real interview.'
                : 'This one needs another pass.'}
            </p>
            <p className="summary">{latest.feedback.overallSummary}</p>
            <div className="scorecard-grid">
              {latest.feedback.dimensions.map((dimension) => (
                <div key={dimension.name} className="scorecard-cell">
                  <div className="scorecard-cell-head">
                    <span>{dimension.name}</span>
                    <span className="score">{dimension.score}/5</span>
                  </div>
                  <p className="note">{dimension.note}</p>
                </div>
              ))}
            </div>
            <div className="fix-its">
              <h2>Next time</h2>
              <ul className="fixit-checklist">
                {latest.feedback.fixIts.map((fix) => (
                  <li key={fix}>{fix}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
