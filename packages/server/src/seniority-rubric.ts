/**
 * The seniority-report rubric — the "brain" of the mode (tickets 012 + 015). Mirrors the
 * rubric.ts / gemini.ts split: this file is schema + prompt + types, seniority.ts is the call
 * and response parsing.
 *
 * Types here are a mirror of client/src/seniority/report.ts — the flat shape pinned as Gemini's
 * response_format. The unions are kept in step with the client's on purpose (tickets 012/015); a
 * stray literal must fail to type-check here, not just on the client. Server and client stay
 * separate packages (same split as api.ts / rubric.ts), so the shape is duplicated rather than
 * imported across the boundary.
 */

export interface TranscriptTurn {
  speaker: 'interviewer' | 'candidate';
  text: string;
}

export const TIERS = ['Lead Self', 'Lead Others', 'Lead the Business'] as const;
export const TIER_LEVELS = ['absent', 'emerging', 'demonstrated'] as const;
// 'none' is a member here (unlike the client's FrameFamily, which keeps it as a separate union
// arm on ProbeDecodeEntry.frame) because only probeDecode uses it — framesFaced never does, so one
// shared enum is simpler than a second PROBE_FRAMES type for a single extra sentinel value.
export const FRAME_FAMILIES = [
  'Order-taker',
  'Bystander',
  'Small-scope',
  'Luck',
  'Too-junior',
  'False-modesty',
  'none',
] as const;
export const ANTI_SIGNALS = ['we-not-i', 'hedging', 'unquantified', 'passivity', 'frame-acceptance'] as const;

export type Tier = (typeof TIERS)[number];
export type TierLevel = (typeof TIER_LEVELS)[number];
export type FrameFamily = (typeof FRAME_FAMILIES)[number];
export type AntiSignal = (typeof ANTI_SIGNALS)[number];

export interface SeniorityReport {
  headline: string;
  ladder: { tier: Tier; level: TierLevel; note: string; quote: string }[];
  framesFaced: { frame: FrameFamily; reframed: boolean }[];
  probeDecode: {
    measuring: string;
    whatYouDid: string;
    seniorMove: string;
    frame: FrameFamily;
  }[];
  flags: { type: AntiSignal; quote: string; note: string }[];
  overallSummary: string;
  fixIts: string[];
}

/** Passed to Gemini as `response_format.schema`. Flat per ticket 001/015 — no nullable fields. */
export const seniorityReportSchema = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description: 'One advisory holistic sentence on ladder placement. Prose, never a verdict.',
    },
    ladder: {
      type: 'array',
      description: 'Exactly one entry per tier, in this order: Lead Self, Lead Others, Lead the Business.',
      items: {
        type: 'object',
        properties: {
          tier: { type: 'string', enum: [...TIERS] },
          level: { type: 'string', enum: [...TIER_LEVELS] },
          note: { type: 'string', description: 'The coaching read for this tier.' },
          quote: {
            type: 'string',
            description: "Verbatim candidate snippet. Empty string when level is 'absent'.",
          },
        },
        required: ['tier', 'level', 'note', 'quote'],
      },
    },
    framesFaced: {
      type: 'array',
      description: 'One entry per diminishing frame the interviewer actually deployed. Count, not a rate.',
      items: {
        type: 'object',
        properties: {
          frame: { type: 'string', enum: [...FRAME_FAMILIES] },
          reframed: { type: 'boolean' },
        },
        required: ['frame', 'reframed'],
      },
    },
    probeDecode: {
      type: 'array',
      description: 'One entry per substantive interviewer question (exclude pure back-channels).',
      items: {
        type: 'object',
        properties: {
          measuring: { type: 'string', description: 'The hidden agenda behind the question.' },
          whatYouDid: { type: 'string', description: "How the candidate actually handled it, paraphrased." },
          seniorMove: {
            type: 'string',
            description: 'The stronger strategy they missed — a strategy, never a scripted line.',
          },
          frame: { type: 'string', enum: [...FRAME_FAMILIES] },
        },
        required: ['measuring', 'whatYouDid', 'seniorMove', 'frame'],
      },
    },
    flags: {
      type: 'array',
      description: 'One entry per anti-signal moment actually present. No we-vs-I ratio anywhere.',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: [...ANTI_SIGNALS] },
          quote: { type: 'string', description: 'The verbatim trigger.' },
          note: { type: 'string', description: 'One-line coaching read.' },
        },
        required: ['type', 'quote', 'note'],
      },
    },
    overallSummary: { type: 'string', description: 'One or two sentences, holistic across all signals.' },
    fixIts: {
      type: 'array',
      description: '1-3 concrete, forward-looking "next interview" strategies, never scripted lines.',
      items: { type: 'string' },
    },
  },
  required: ['headline', 'ladder', 'framesFaced', 'probeDecode', 'flags', 'overallSummary', 'fixIts'],
} as const;

export const SYSTEM_INSTRUCTION = `You are a coaching analyst for a seniority / culture-fit interview screen. You read the full transcript of a multi-turn interview and return a structured coaching report. This is a coaching lens, not a hiring rubric — you locate where evidence showed up and coach from there, and you never issue a hire/no-hire verdict.

Tone: direct but constructive. Name weaknesses plainly, and always pair each one with the move that fixes them.

Score against this competency model — three tiers of leadership scope, defined by behaviour recognizable from the transcript, never by title or years:

1. "Lead Self" — owns their own outcomes and standards; reliable under pressure; drives their own growth; holds a bar without being told.
2. "Lead Others" — shapes/influences a team; mentors; pushes back on direction; drives scope beyond assigned tickets; creates clarity for others.
3. "Lead the Business" — moves org-level outcomes; navigates ambiguity/strategy; makes cross-team leverage; connects the work to why it matters commercially.

For each tier, read one level on a single axis — owned + specific + first-person evidence:
- "absent" — no evidence surfaced for this tier. A coaching prompt, not a verdict on the person; when a tier is "absent", its "quote" must be the empty string.
- "emerging" — the behaviour is claimed, second-hand, or hypothetical ("we improved onboarding", "I'd probably push back") — aspiration without a concrete owned instance.
- "demonstrated" — a specific, first-person, owned instance: a real situation, their action, an outcome.

Watch for these six diminishing frames the interviewer may deploy — framings that try to shrink the candidate below their real scope:
1. "Order-taker" — "so you mostly execute what your lead/PM decides?" (strips Tier 2/3 to Tier 1)
2. "Bystander" — "the team drove that, you were along for it?" (the we-vs-I bait; strips Tier 2 to Tier 1)
3. "Small-scope" — "that was a pretty contained / low-stakes piece, right?" (minimizes impact/ambition)
4. "Luck" — "sounds like it mostly worked out on its own / good timing" (denies agency over outcome)
5. "Too-junior" — "at your level you wouldn't have been in those rooms / making that call" (denies altitude by title)
6. "False-modesty" — a warm nudge to downplay ("I'm sure it wasn't a big deal") (baits self-deprecation/hedging)

And these five anti-signal language tells that read below tier:
1. "we-not-i" — collective credit where the candidate owned the work ("we decided", "the team shipped"). The strongest tell.
2. "hedging" — "kind of", "I just", "I'm no expert, but", "it was nothing". Low conviction.
3. "unquantified" — impact asserted with no scale or outcome ("improved things", "it went well").
4. "passivity" — things happening to them, not driven by them ("I was assigned", "it got decided").
5. "frame-acceptance" — agreeing with a diminishing frame instead of reframing it.

Anti-signal and frame reads are advisory impressions from the transcript, not precise measurements — word them that way.

Return:
- "headline": one advisory holistic sentence on where the session landed across the three tiers (e.g. "strong owned evidence at Lead Self, but Lead Others only showed up second-hand, and Lead the Business was absent"). Prose only — never a single-tier verdict and never a pass/fail judgement.
- "ladder": exactly one entry per tier, in this order — Lead Self, Lead Others, Lead the Business. Each has a "note" (the coaching read) and a "quote" (a verbatim snippet from the candidate's own words that earned the reading; empty string when "level" is "absent").
- "framesFaced": one entry per diminishing frame the interviewer actually deployed during the interview, with "reframed" true if the candidate pushed back and re-asserted owned evidence, false if they accepted it. Never compute or imply a percentage — this is a count.
- "probeDecode": one entry per substantive interviewer question (exclude pure back-channels like "go on" or "mm-hmm") — roughly 5-6 entries. For each: "measuring" (the hidden agenda behind the question), "whatYouDid" (how the candidate actually handled it, paraphrased — never a verbatim interviewer quote), "seniorMove" (the stronger strategy they missed, described as a strategy to reach for, never a scripted sentence to recite), and "frame" (which of the six diminishing frames this turn deployed, or "none").
- "flags": one entry per anti-signal moment actually present in the transcript, each with "type" (one of the five families), "quote" (the verbatim trigger), and "note" (a one-line coaching read). Never compute or report a "we" vs "I" ratio anywhere.
- "overallSummary": one or two sentences — the holistic "how did this screen go" across all three signals (ladder, frames, flags). Distinct from "headline", which is only about ladder placement.
- "fixIts": 1 to 3 concrete, forward-looking "next interview" suggestions. Strategy, never a scripted answer to recite (e.g. "go in with one story where you drove scope beyond your tickets and lead with it", not the sentence to say).

Never include a holistic ready/not-ready boolean or any numeric score anywhere — "headline" and "overallSummary" carry the holistic read in prose only.`;

export function buildPrompt(transcript: TranscriptTurn[]): string {
  const lines = transcript
    .map((turn) => `${turn.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${turn.text}`)
    .join('\n');
  return `Here is the full transcript of a seniority/culture-fit interview screen, in chronological order:\n\n${lines}\n\nAssess it against the competency model and return the report.`;
}
