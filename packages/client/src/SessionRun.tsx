import styles from './App.module.css';
import { FeedbackPanel } from './FeedbackPanel';
import { formatDuration } from './sessionPhases';
import type { useUnifiedSession } from './useUnifiedSession';

const CTA_RECORD = `${styles.practice__cta} ${styles['practice__cta--record']}`;
const CTA_STOP = `${styles.practice__cta} ${styles['practice__cta--stop']}`;
const CTA_SECONDARY = `${styles.practice__cta} ${styles['practice__cta--secondary']}`;

type Session = ReturnType<typeof useUnifiedSession>;

export function SessionRun({ session }: { session: Session }) {
  const { phase, question, progressChrome, reviewUrl, feedback, error, treeDone } = session;

  if (!question || !progressChrome) return null;

  function confirmEnd() {
    const leave = window.confirm('End this session? Your progress will be discarded.');
    if (leave) session.endSession();
  }

  return (
    <main className={styles.practice}>
      <header className={styles.practice__chrome}>
        <span className={styles.practice__eyebrow}>{progressChrome}</span>
        <button type="button" className={styles.practice__end} onClick={confirmEnd}>
          End session
        </button>
      </header>

      <h1 className={styles.practice__question}>{question.text}</h1>

      <section className={styles.practice__step}>
        {phase === 'ready' && (
          <button type="button" className={CTA_RECORD} onClick={session.startRecording}>
            Start recording
          </button>
        )}

        {phase === 'recording' && (
          <div className={styles['practice__step-inner']}>
            <span className={styles.practice__mic} aria-hidden />
            <p className={styles.practice__timer}>{formatDuration(session.elapsedSeconds)}</p>
            <button type="button" className={CTA_STOP} onClick={session.stopRecording}>
              Stop
            </button>
          </div>
        )}

        {phase === 'reviewing' && reviewUrl && (
          <div className={styles['practice__step-inner']}>
            <p className={styles.practice__hint}>Listen back before you send it.</p>
            {/* biome-ignore lint/a11y/useMediaCaption: user's own recording — no caption track. */}
            <audio className={styles.practice__player} src={reviewUrl} controls />
            <div className={styles['practice__review-actions']}>
              <button type="button" className={CTA_SECONDARY} onClick={session.reRecord}>
                Re-record
              </button>
              <button type="button" className={CTA_RECORD} onClick={session.submitReview}>
                Submit for feedback
              </button>
            </div>
          </div>
        )}

        {phase === 'submitting' && (
          <div className={styles['practice__step-inner']}>
            <span className={styles.practice__spinner} aria-hidden />
            <p className={styles.practice__hint} aria-live="polite">
              Listening to your answer…
            </p>
          </div>
        )}

        {phase === 'picking' && (
          <div className={styles['practice__step-inner']}>
            <span className={styles.practice__spinner} aria-hidden />
            <p className={styles.practice__hint} aria-live="polite">
              Choosing the next question…
            </p>
          </div>
        )}

        {phase === 'attemptFeedback' && treeDone && (
          <div className={styles['practice__step-inner']}>
            <p className={styles.practice__hint}>Tree complete.</p>
            <div className={styles['practice__review-actions']}>
              <button type="button" className={CTA_RECORD} onClick={session.tryAgain}>
                Try again
              </button>
              <button type="button" className={CTA_SECONDARY} onClick={session.backToStart}>
                Back to start
              </button>
            </div>
          </div>
        )}

        {phase === 'finishing' && (
          <div className={styles['practice__step-inner']}>
            <p className={styles.practice__hint}>Session complete.</p>
            <button type="button" className={CTA_SECONDARY} onClick={session.backToStart}>
              Back to start
            </button>
          </div>
        )}
      </section>

      {error && (
        <p className={styles.practice__error} role="alert">
          {error}
        </p>
      )}

      {feedback && phase === 'attemptFeedback' && <FeedbackPanel feedback={feedback} />}
    </main>
  );
}
