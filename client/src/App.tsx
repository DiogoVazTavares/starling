import styles from './App.module.css';
import { FeedbackPanel } from './FeedbackPanel';
import { formatDuration, usePracticeSession } from './usePracticeSession';

// A BEM modifier never stands alone, so each CTA carries its element class too.
const CTA_RECORD = `${styles.practice__cta} ${styles['practice__cta--record']}`;
const CTA_STOP = `${styles.practice__cta} ${styles['practice__cta--stop']}`;
const CTA_SECONDARY = `${styles.practice__cta} ${styles['practice__cta--secondary']}`;

export default function App() {
  const session = usePracticeSession();
  const {
    question,
    questionIndex,
    questionCount,
    phase,
    reviewUrl,
    feedback,
    error,
    attempt,
    canNavigate,
  } = session;

  return (
    <main className={styles.practice}>
      <nav className={styles.practice__nav}>
        <button
          type="button"
          className={styles['practice__nav-button']}
          onClick={session.previous}
          disabled={!canNavigate || questionIndex === 0}
        >
          ← Previous
        </button>
        <span className={styles.practice__eyebrow}>
          Question {questionIndex + 1} of {questionCount}
          {attempt > 0 && ` · attempt ${attempt + 1}`}
        </span>
        <button
          type="button"
          className={styles['practice__nav-button']}
          onClick={session.next}
          disabled={!canNavigate || questionIndex === questionCount - 1}
        >
          Next →
        </button>
      </nav>

      <h1 className={styles.practice__question}>{question.prompt}</h1>

      <section className={styles.practice__step}>
        {phase === 'ready' && !feedback && (
          <button type="button" className={CTA_RECORD} onClick={session.start}>
            Start recording
          </button>
        )}

        {phase === 'ready' && feedback && (
          <div className={styles['practice__step-inner']}>
            <p className={styles.practice__hint}>Ready when you are.</p>
            <button type="button" className={CTA_RECORD} onClick={session.start}>
              Try again
            </button>
          </div>
        )}

        {phase === 'recording' && (
          <div className={styles['practice__step-inner']}>
            <span className={styles.practice__mic} aria-hidden />
            <p className={styles.practice__timer}>{formatDuration(session.elapsedSeconds)}</p>
            <button type="button" className={CTA_STOP} onClick={session.stopToReview}>
              Stop
            </button>
          </div>
        )}

        {phase === 'reviewing' && reviewUrl && (
          <div className={styles['practice__step-inner']}>
            <p className={styles.practice__hint}>Listen back before you send it.</p>
            {/* biome-ignore lint/a11y/useMediaCaption: it's the user's own recording played back — there is no caption track to offer. */}
            <audio className={styles.practice__player} src={reviewUrl} controls />
            <div className={styles['practice__review-actions']}>
              <button type="button" className={CTA_SECONDARY} onClick={session.reRecord}>
                Re-record
              </button>
              <button type="button" className={CTA_RECORD} onClick={session.submit}>
                Submit for feedback
              </button>
            </div>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className={styles['practice__step-inner']}>
            <span className={styles.practice__spinner} aria-hidden />
            <p className={styles.practice__hint} aria-live="polite">
              Listening to your answer…
            </p>
          </div>
        )}
      </section>

      {error && (
        <p className={styles.practice__error} role="alert">
          {error}
        </p>
      )}

      {feedback && phase !== 'analyzing' && <FeedbackPanel feedback={feedback} />}
    </main>
  );
}
