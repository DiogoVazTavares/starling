import styles from './ReportScreen.module.css';
import type { SeniorityReport, TierLevel } from './report';

// A BEM modifier never stands alone, so each level pill carries its element class too.
const LEVEL_CLASS: Record<TierLevel, string> = {
  demonstrated: `${styles.report__level} ${styles['report__level--demonstrated']}`,
  emerging: `${styles.report__level} ${styles['report__level--emerging']}`,
  absent: `${styles.report__level} ${styles['report__level--absent']}`,
};

const ACTION_PRIMARY = `${styles.report__action} ${styles['report__action--primary']}`;

/**
 * Renders the ticket 015 report contract in the fixed ticket 017 order:
 * headline -> ladder -> frames -> decode -> flags -> fix-its.
 */
export function ReportScreen({
  report,
  onNewInterview,
}: {
  report: SeniorityReport;
  onNewInterview: () => void;
}) {
  const reframed = report.framesFaced.filter((f) => f.reframed).length;

  return (
    <article className={styles.report}>
      <p className={styles.report__headline}>{report.headline}</p>

      <section>
        <h2 className={styles['report__section-title']}>Where you landed</h2>
        <div className={styles.report__ladder}>
          {report.ladder.map((card) => (
            <div key={card.tier} className={styles.report__card}>
              <strong>{card.tier}</strong>
              <span className={LEVEL_CLASS[card.level]}>{card.level}</span>
              <p>{card.note}</p>
              {card.quote && <p className={styles.report__quote}>“{card.quote}”</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles['report__section-title']}>
          Frames you faced ·{' '}
          <span className={styles.report__tally}>
            reframed {reframed} of {report.framesFaced.length}
          </span>
        </h2>
        <div className={styles.report__scoreboard}>
          {report.framesFaced.map((f) => (
            <div key={f.frame} className={styles['report__frame-row']}>
              <span>{f.frame}</span>
              <span>{f.reframed ? '✓ reframed' : '✗ accepted'}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles['report__section-title']}>What each question was measuring</h2>
        <div className={styles.report__decode}>
          {report.probeDecode.map((probe) => (
            <div key={probe.measuring} className={styles.report__probe}>
              {probe.frame !== 'none' && (
                <span className={styles['report__probe-tag']}>{probe.frame}</span>
              )}
              <span>measuring → {probe.measuring}</span>
              <span>what you did → {probe.whatYouDid}</span>
              <span>senior move → {probe.seniorMove}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles['report__section-title']}>Language flags</h2>
        <div className={styles.report__flags}>
          {report.flags.map((flag) => (
            <div key={flag.quote}>
              <strong>{flag.type}</strong>
              <p className={styles.report__quote}>“{flag.quote}”</p>
              <p>{flag.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles['report__section-title']}>For your next screen</h2>
        <p>{report.overallSummary}</p>
        <ul className={styles.report__fixits}>
          {report.fixIts.map((fix) => (
            <li key={fix}>{fix}</li>
          ))}
        </ul>
      </section>

      <div className={styles.report__actions}>
        <button type="button" className={ACTION_PRIMARY} onClick={onNewInterview}>
          New interview
        </button>
      </div>
    </article>
  );
}
