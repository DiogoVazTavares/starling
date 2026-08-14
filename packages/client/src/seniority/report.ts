/**
 * The seniority-report contract, mirrored from wayfinder/tickets/015-seniority-report-contract.md.
 * This is the flat JSON the server pins as Gemini's `response_format` schema and returns from
 * /api/seniority-report. Field order matches the report render order fixed by ticket 017:
 * headline -> ladder -> frames -> decode -> flags -> fix-its.
 */

export type Tier = 'Lead Self' | 'Lead Others' | 'Lead the Business';
export type TierLevel = 'absent' | 'emerging' | 'demonstrated';

/** The six diminishing-frame families from ticket 012 §3. */
export type FrameFamily =
  | 'Order-taker'
  | 'Bystander'
  | 'Small-scope'
  | 'Luck'
  | 'Too-junior'
  | 'False-modesty';

/** The five anti-signal families from ticket 012 §4. */
export type AntiSignal = 'we-not-i' | 'hedging' | 'unquantified' | 'passivity' | 'frame-acceptance';

export interface LadderCard {
  tier: Tier;
  level: TierLevel;
  note: string;
  /** Verbatim snippet from the candidate that earned the reading; empty when `level` is `absent`. */
  quote: string;
}

export interface ProbeDecodeEntry {
  measuring: string;
  whatYouDid: string;
  /** Strategy, never a scripted answer (ticket 002's "no model answer" rule). */
  seniorMove: string;
  /** Which frame this turn deployed, or `none`. */
  frame: FrameFamily | 'none';
}

export interface FramesFacedEntry {
  frame: FrameFamily;
  reframed: boolean;
}

export interface LanguageFlag {
  type: AntiSignal;
  quote: string;
  note: string;
}

export interface SeniorityReport {
  /** Advisory holistic sentence — never a gate (the analogue of the behavioral mode's interviewReady). */
  headline: string;
  ladder: LadderCard[];
  framesFaced: FramesFacedEntry[];
  probeDecode: ProbeDecodeEntry[];
  flags: LanguageFlag[];
  overallSummary: string;
  fixIts: string[];
}

/** One line of the live-transcribed conversation (both sides come free from the Live API, ticket 013). */
export interface TranscriptTurn {
  speaker: 'interviewer' | 'candidate';
  text: string;
}
