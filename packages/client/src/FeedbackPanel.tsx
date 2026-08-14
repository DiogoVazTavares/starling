import type { Feedback } from './api';
import styles from './FeedbackPanel.module.css';

const MAX_SCORE = 5;

// A BEM modifier never stands alone, so each variant carries its element class too.
const READY_CLASS = `${styles.feedback__readiness} ${styles['feedback__readiness--ready']}`;
const NOT_READY_CLASS = `${styles.feedback__readiness} ${styles['feedback__readiness--not-ready']}`;

export function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  return (
    <section className={styles.feedback}>
      <p className={styles.feedback__summary}>{feedback.overallSummary}</p>

      <ul className={styles.feedback__dimensions}>
        {feedback.dimensions.map((dimension) => (
          <li key={dimension.name}>
            <div className={styles['feedback__dimension-head']}>
              <span className={styles['feedback__dimension-name']}>{dimension.name}</span>
              {/* role=img so the aria-label is honoured — a bare span's generic role ignores it,
                  which silently dropped this label for screen readers. */}
              <span
                className={styles.feedback__score}
                role="img"
                aria-label={`${dimension.score} out of ${MAX_SCORE}`}
              >
                {dimension.score}
                <span className={styles['feedback__score-max']}>/{MAX_SCORE}</span>
              </span>
            </div>
            <div className={styles.feedback__meter} role="presentation">
              <span
                className={styles['feedback__meter-fill']}
                style={{ width: `${(dimension.score / MAX_SCORE) * 100}%` }}
              />
            </div>
            <p className={styles.feedback__note}>{dimension.note}</p>
          </li>
        ))}
      </ul>

      <div className={styles['feedback__fix-its']}>
        <h2 className={styles['feedback__fix-its-title']}>Next time</h2>
        <ol className={styles['feedback__fix-its-list']}>
          {feedback.fixIts.map((fix) => (
            <li key={fix}>{fix}</li>
          ))}
        </ol>
      </div>

      {/* Advisory, never a gate (ticket 002) — the label has to say so. */}
      <p className={feedback.interviewReady ? READY_CLASS : NOT_READY_CLASS}>
        {feedback.interviewReady
          ? 'This would land well in a real interview.'
          : 'This one needs another pass.'}
        <span className={styles['feedback__readiness-caveat']}>
          Guidance, not a verdict — you decide when to move on.
        </span>
      </p>
    </section>
  );
}
