import type { usePracticeSession } from './usePracticeSession';
import { formatDuration } from './usePracticeSession';

/**
 * PROTOTYPE — Variant B: "Session log". Controls stay compact and always visible; every
 * attempt (recording + feedback) appends as a card below, most recent first, so past
 * attempts on this question stay visible and replayable instead of being thrown away.
 */
export function VariantTimeline({ session }: { session: ReturnType<typeof usePracticeSession> }) {
  const { question, questionIndex, questionCount, phase, reviewUrl, history, error, canNavigate } =
    session;

  return (
    <main className="timeline">
      <header className="timeline-header">
        <nav className="timeline-nav">
          <button
            type="button"
            onClick={session.previous}
            disabled={!canNavigate || questionIndex === 0}
          >
            ←
          </button>
          <span className="timeline-progress">
            {questionIndex + 1} / {questionCount}
          </span>
          <button
            type="button"
            onClick={session.next}
            disabled={!canNavigate || questionIndex === questionCount - 1}
          >
            →
          </button>
        </nav>
        <h1 className="timeline-question">{question.prompt}</h1>

        <div className="timeline-controls">
          {phase === 'ready' && (
            <button type="button" className="timeline-record" onClick={session.start}>
              {history.length > 0 ? 'Record another attempt' : 'Start recording'}
            </button>
          )}
          {phase === 'recording' && (
            <>
              <span className="pulse" />
              <span className="timeline-timer">{formatDuration(session.elapsedSeconds)}</span>
              <button type="button" className="timeline-stop" onClick={session.stopToReview}>
                Stop
              </button>
            </>
          )}
          {phase === 'reviewing' && reviewUrl && (
            <div className="timeline-review">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio src={reviewUrl} controls />
              <button type="button" className="timeline-secondary" onClick={session.reRecord}>
                Re-record
              </button>
              <button type="button" className="timeline-record" onClick={session.submit}>
                Submit
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </header>

      <ol className="timeline-log">
        {phase === 'analyzing' && (
          <li className="timeline-card timeline-card-pending">
            <span className="timeline-shimmer" aria-hidden />
            <p aria-live="polite">Listening to your answer…</p>
          </li>
        )}

        {[...history].reverse().map((attempt) => (
          <li key={attempt.attemptNumber} className="timeline-card">
            <div className="timeline-card-head">
              <span>Attempt {attempt.attemptNumber}</span>
              <span className={attempt.feedback.interviewReady ? 'chip chip-ready' : 'chip'}>
                {attempt.feedback.interviewReady ? 'Ready' : 'Needs another pass'}
              </span>
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={attempt.audioUrl} controls className="timeline-card-audio" />
            <p className="summary">{attempt.feedback.overallSummary}</p>
            <div className="timeline-scores">
              {attempt.feedback.dimensions.map((dimension) => (
                <span key={dimension.name} className="score-chip" title={dimension.note}>
                  {dimension.name} {dimension.score}/5
                </span>
              ))}
            </div>
            <ul className="timeline-fixits">
              {attempt.feedback.fixIts.map((fix) => (
                <li key={fix}>{fix}</li>
              ))}
            </ul>
          </li>
        ))}

        {history.length === 0 && phase !== 'analyzing' && (
          <li className="timeline-empty">No attempts yet on this question.</li>
        )}
      </ol>
    </main>
  );
}
