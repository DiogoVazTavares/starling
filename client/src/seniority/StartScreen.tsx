import styles from './StartScreen.module.css';

/**
 * Session-start screen (ticket 017 §2): a plain "Start interview" with a reserved seeding slot.
 * Random single-button start, per ticket 016 — no menu, no difficulty.
 */
export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className={styles.start}>
      <h1>Seniority screen</h1>
      <p className={styles.start__lede}>
        A culture-fit screen with a manager two levels up. They'll ask, listen, and push. Afterwards
        you get a coaching report — nothing is scored while you talk.
      </p>

      {/* TODO(016): reserved seeding slot. If ticket 016 adds user-facing seeding controls (it
          currently specs a silent random pick), they render here without changing the layout. */}
      <div className={styles['start__seed-slot']} />

      <button type="button" className={styles.start__cta} onClick={onStart}>
        Start interview
      </button>

      <p className={styles.start__note}>🎤 mic access needed · ~15 min · find a quiet room</p>
    </section>
  );
}
