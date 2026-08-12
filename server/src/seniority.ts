/**
 * Seniority-mode server pieces (tickets 013 + 015). SCAFFOLD: the live-token endpoint is not
 * implemented yet — that piece is marked below. The report call (015) is real.
 */

import { getClient, MODEL } from './gemini.ts';

export interface TranscriptTurn {
  speaker: 'interviewer' | 'candidate';
  text: string;
}

// Mirror of client/src/seniority/report.ts — the flat shape pinned as Gemini's response_format.
// The unions are kept in step with the client's on purpose (tickets 012/015); a stray literal must
// fail to type-check here, not just on the client. Server and client stay separate packages (same
// split as api.ts / rubric.ts), so the shape is duplicated rather than imported across the boundary.
const TIERS = ['Lead Self', 'Lead Others', 'Lead the Business'] as const;
const TIER_LEVELS = ['absent', 'emerging', 'demonstrated'] as const;
const FRAME_FAMILIES = [
  'Order-taker',
  'Bystander',
  'Small-scope',
  'Luck',
  'Too-junior',
  'False-modesty',
] as const;
const PROBE_FRAMES = [...FRAME_FAMILIES, 'none'] as const;
const ANTI_SIGNALS = ['we-not-i', 'hedging', 'unquantified', 'passivity', 'frame-acceptance'] as const;

type Tier = (typeof TIERS)[number];
type TierLevel = (typeof TIER_LEVELS)[number];
type FrameFamily = (typeof FRAME_FAMILIES)[number];
type ProbeFrame = (typeof PROBE_FRAMES)[number];
type AntiSignal = (typeof ANTI_SIGNALS)[number];

export interface SeniorityReport {
  headline: string;
  ladder: { tier: Tier; level: TierLevel; note: string; quote: string }[];
  framesFaced: { frame: FrameFamily; reframed: boolean }[];
  probeDecode: {
    measuring: string;
    whatYouDid: string;
    seniorMove: string;
    frame: ProbeFrame;
  }[];
  flags: { type: AntiSignal; quote: string; note: string }[];
  overallSummary: string;
  fixIts: string[];
}

/** Thrown when Gemini answers but the answer isn't usable. */
export class BadSeniorityReportError extends Error {}

/** Passed to Gemini as `response_format.schema`. Flat per ticket 001/015 — no nullable fields. */
const seniorityReportSchema = {
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
          frame: { type: 'string', enum: [...PROBE_FRAMES] },
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

const SYSTEM_INSTRUCTION = `You are a coaching analyst for a seniority / culture-fit interview screen. You read the full transcript of a multi-turn interview and return a structured coaching report. This is a coaching lens, not a hiring rubric — you locate where evidence showed up and coach from there, and you never issue a hire/no-hire verdict.

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

function buildPrompt(transcript: TranscriptTurn[]): string {
  const lines = transcript
    .map((turn) => `${turn.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${turn.text}`)
    .join('\n');
  return `Here is the full transcript of a seniority/culture-fit interview screen, in chronological order:\n\n${lines}\n\nAssess it against the competency model and return the report.`;
}

export async function generateSeniorityReport(transcript: TranscriptTurn[]): Promise<SeniorityReport> {
  const interaction = await getClient().interactions.create({
    model: MODEL,
    system_instruction: SYSTEM_INSTRUCTION,
    input: [{ type: 'text', text: buildPrompt(transcript) }],
    // `response_format` carries the mime type itself. Do NOT also set `response_mime_type` —
    // same 001/006 gotcha as the behavioral mode's requestFeedback in gemini.ts.
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: seniorityReportSchema,
    },
  });

  const text = interaction.output_text;
  if (!text) {
    throw new BadSeniorityReportError(
      `Gemini returned no text output (interaction status: ${interaction.status}).`,
    );
  }

  return parseSeniorityReport(text);
}

/**
 * Gemini's structured output is schema-constrained, but a malformed response must surface
 * as an error rather than reach the UI as a half-empty report.
 */
function parseSeniorityReport(text: string): SeniorityReport {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    throw new BadSeniorityReportError(`Gemini returned text that isn't JSON: ${text.slice(0, 200)}`, {
      cause,
    });
  }

  if (typeof value !== 'object' || value === null) {
    throw new BadSeniorityReportError('Gemini returned JSON that is not an object.');
  }
  const report = value as Record<string, unknown>;

  const { headline, ladder, framesFaced, probeDecode, flags, overallSummary, fixIts } = report;

  if (typeof headline !== 'string') {
    throw new BadSeniorityReportError('Gemini response is missing "headline".');
  }

  if (!Array.isArray(ladder) || ladder.length !== TIERS.length) {
    throw new BadSeniorityReportError(`Gemini response must have exactly ${TIERS.length} ladder entries.`);
  }
  ladder.forEach((card, index) => {
    const { tier, level, note, quote } = (card ?? {}) as Record<string, unknown>;
    // Ticket 015 §1 fixes the order (Lead Self, Lead Others, Lead the Business) and requires
    // exactly one entry per tier — check position, not just enum membership.
    if (tier !== TIERS[index]) {
      throw new BadSeniorityReportError(`Ladder entry ${index} must be tier "${TIERS[index]}", got: ${String(tier)}`);
    }
    if (!TIER_LEVELS.includes(level as never)) {
      throw new BadSeniorityReportError(`Tier "${String(tier)}" has an unknown level: ${String(level)}`);
    }
    if (typeof note !== 'string' || typeof quote !== 'string') {
      throw new BadSeniorityReportError(`Tier "${String(tier)}" is missing a note or quote.`);
    }
    // Ticket 015 §1: an "absent" tier carries no quote — the note alone is the coaching prompt.
    if (level === 'absent' && quote !== '') {
      throw new BadSeniorityReportError(`Tier "${String(tier)}" is "absent" but has a non-empty quote.`);
    }
  });

  if (!Array.isArray(framesFaced)) {
    throw new BadSeniorityReportError('Gemini response is missing "framesFaced".');
  }
  for (const entry of framesFaced) {
    const { frame, reframed } = (entry ?? {}) as Record<string, unknown>;
    if (!FRAME_FAMILIES.includes(frame as never)) {
      throw new BadSeniorityReportError(`Gemini faced an unknown frame: ${String(frame)}`);
    }
    if (typeof reframed !== 'boolean') {
      throw new BadSeniorityReportError(`Frame "${String(frame)}" is missing "reframed".`);
    }
  }

  if (!Array.isArray(probeDecode) || probeDecode.length === 0) {
    throw new BadSeniorityReportError('Gemini response is missing the probe decode.');
  }
  for (const entry of probeDecode) {
    const { measuring, whatYouDid, seniorMove, frame } = (entry ?? {}) as Record<string, unknown>;
    if (typeof measuring !== 'string' || typeof whatYouDid !== 'string' || typeof seniorMove !== 'string') {
      throw new BadSeniorityReportError('A probe-decode entry is missing measuring/whatYouDid/seniorMove.');
    }
    if (!PROBE_FRAMES.includes(frame as never)) {
      throw new BadSeniorityReportError(`Probe-decode entry has an unknown frame: ${String(frame)}`);
    }
  }

  if (!Array.isArray(flags)) {
    throw new BadSeniorityReportError('Gemini response is missing "flags".');
  }
  for (const flag of flags) {
    const { type, quote, note } = (flag ?? {}) as Record<string, unknown>;
    if (!ANTI_SIGNALS.includes(type as never)) {
      throw new BadSeniorityReportError(`Gemini flagged an unknown anti-signal: ${String(type)}`);
    }
    if (typeof quote !== 'string' || typeof note !== 'string') {
      throw new BadSeniorityReportError(`Flag "${String(type)}" is missing a quote or note.`);
    }
  }

  if (typeof overallSummary !== 'string') {
    throw new BadSeniorityReportError('Gemini response is missing "overallSummary".');
  }
  if (!Array.isArray(fixIts) || fixIts.some((fix) => typeof fix !== 'string')) {
    throw new BadSeniorityReportError('Gemini response is missing usable fix-its.');
  }

  return report as unknown as SeniorityReport;
}
