import styles from './ConversationScreen.module.css';
import type { InterviewPhase } from './useInterviewSession';

/**
 * Variant A live conversation (ticket 017 §3): only the current interviewer turn is on screen. The
 * interviewer speaks (native audio, ticket 013) with its words pinned as text and a ▶ replay; the
 * candidate answers by holding the button, which streams their voice up. While answering it's
 * audio-only — a mic indicator + level meter, no live transcript of your own words.
 */
export function ConversationScreen({
  phase,
  prompt,
  error,
  answering,
  level,
  onBeginAnswer,
  onEndAnswer,
  onReplay,
  onEnd,
  onRetry,
}: {
  phase: InterviewPhase;
  prompt: string;
  error: string | null;
  answering: boolean;
  level: number;
  onBeginAnswer: () => void;
  onEndAnswer: () => void;
  onReplay: () => void;
  onEnd: () => void;
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

  if (phase === 'connecting') {
    return (
      <section className={styles.talk}>
        <span className={styles.talk__mic} aria-hidden />
        <p className={styles.talk__hint} aria-live="polite">
          Connecting you to the interviewer…
        </p>
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
      <p className={styles.talk__prompt}>{prompt || '…'}</p>

      <button type="button" className={styles.talk__replay} onClick={onReplay} disabled={!prompt}>
        ▶ replay
      </button>

      <hr className={styles.talk__divider} />

      {/* Fixed-height so switching to the answering state doesn't shove the button below it. */}
      <div className={styles['talk__answer-area']}>
        {answering ? (
          <div className={styles.talk__answering}>
            <span className={styles.talk__mic} aria-hidden />
            <meter
              className={styles.talk__meter}
              aria-label="Microphone level"
              min={0}
              max={1}
              value={level}
            />
            <p className={styles.talk__hint} aria-live="polite">
              Listening… release when you're done.
            </p>
          </div>
        ) : (
          <p className={styles.talk__hint}>Take your time, then hold the button to answer.</p>
        )}
      </div>

      {/*
        Hold-to-record: press and hold (pointer or keyboard) to stream your answer up. We capture the
        pointer on press so pointerup always lands back here — starting to answer inserts the meter
        block above and shifts this button, which would otherwise fire pointerleave the instant you
        press and end the turn immediately (an empty answer + a UI flicker). Capture also lets you
        drift off the button while holding, so we don't end on pointerleave at all.
      */}
      <button
        type="button"
        className={
          answering ? `${styles.talk__answer} ${styles['talk__answer--live']}` : styles.talk__answer
        }
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          onBeginAnswer();
        }}
        onPointerUp={onEndAnswer}
        onPointerCancel={onEndAnswer}
        onKeyDown={(event) => {
          if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) onBeginAnswer();
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter') onEndAnswer();
        }}
      >
        {answering ? 'Release when done' : 'Hold to answer'}
      </button>

      {/* The interviewer normally closes on its own (ticket 014); this is just an early-exit hatch. */}
      <button type="button" className={styles.talk__end} onClick={onEnd}>
        End interview early
      </button>
    </section>
  );
}
