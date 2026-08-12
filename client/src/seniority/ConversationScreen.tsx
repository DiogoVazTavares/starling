import styles from './ConversationScreen.module.css';
import type { InterviewPhase } from './useInterviewSession';

/**
 * Variant A live conversation (ticket 017 §3): only the current interviewer turn is on screen.
 *
 * SCAFFOLD: the "answer" button stands in for hold-to-record. In the real build (ticket 013) this
 * captures 16 kHz PCM, streams it to the Live session, and shows a mic indicator + level meter
 * while you speak — audio-only, no live transcript of your own words (ticket 017 §3).
 */
export function ConversationScreen({
  phase,
  prompt,
  error,
  onAnswer,
  onRetry,
}: {
  phase: InterviewPhase;
  prompt: string;
  error: string | null;
  onAnswer: () => void;
  onRetry: () => void;
}) {
  if (phase === 'error') {
    return (
      <section className={styles.talk}>
        <p className={styles.talk__error} role="alert">
          {error ?? 'Something went wrong.'}
        </p>
        <button type="button" className={styles.talk__answer} onClick={onRetry}>
          Start over
        </button>
      </section>
    );
  }

  if (phase === 'generating') {
    return (
      <section className={styles.talk}>
        <span className={styles.talk__mic} aria-hidden />
        <p className={styles.talk__hint} aria-live="polite">
          Writing up your report…
        </p>
      </section>
    );
  }

  return (
    <section className={styles.talk}>
      <span className={styles.talk__speaker}>Interviewer</span>
      <p className={styles.talk__prompt}>{prompt}</p>

      {/* TODO(013): replay the interviewer's native-audio turn. Placeholder button for now. */}
      <button type="button" className={styles.talk__replay}>
        ▶ replay
      </button>

      <hr className={styles.talk__divider} />

      {/* TODO(013): hold-to-record — capture audio, stream to the Live session, show a level meter. */}
      <button type="button" className={styles.talk__answer} onClick={onAnswer}>
        Answer
      </button>
      <p className={styles.talk__hint}>Take your time. Press Answer when you're done speaking.</p>
    </section>
  );
}
