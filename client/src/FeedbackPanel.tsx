import type { Feedback } from './api';

const MAX_SCORE = 5;

export function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  return (
    <section className="feedback">
      <p className="summary">{feedback.overallSummary}</p>

      <ul className="dimensions">
        {feedback.dimensions.map((dimension) => (
          <li key={dimension.name}>
            <div className="dimension-head">
              <span className="dimension-name">{dimension.name}</span>
              <span className="score" aria-label={`${dimension.score} out of ${MAX_SCORE}`}>
                {dimension.score}
                <span className="score-max">/{MAX_SCORE}</span>
              </span>
            </div>
            <div className="meter" role="presentation">
              <span style={{ width: `${(dimension.score / MAX_SCORE) * 100}%` }} />
            </div>
            <p className="note">{dimension.note}</p>
          </li>
        ))}
      </ul>

      <div className="fix-its">
        <h2>Next time</h2>
        <ol>
          {feedback.fixIts.map((fix) => (
            <li key={fix}>{fix}</li>
          ))}
        </ol>
      </div>

      {/* Advisory, never a gate (ticket 002) — the label has to say so. */}
      <p className={`readiness ${feedback.interviewReady ? 'ready' : 'not-ready'}`}>
        {feedback.interviewReady
          ? 'This would land well in a real interview.'
          : 'This one needs another pass.'}
        <span className="readiness-caveat">Guidance, not a verdict — you decide when to move on.</span>
      </p>
    </section>
  );
}
