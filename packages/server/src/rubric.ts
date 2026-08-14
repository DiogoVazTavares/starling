/**
 * The feedback rubric — the "brain" of the product.
 *
 * Source of truth: wayfinder/tickets/002-feedback-rubric.md. The JSON shape is kept flat
 * because Gemini only supports a subset of JSON Schema (wayfinder/research/gemini-audio.md).
 */

export const DIMENSION_NAMES = [
  'STAR structure',
  'Specificity & ownership',
  'Relevance',
  'Delivery',
] as const;

export type DimensionName = (typeof DIMENSION_NAMES)[number];

export interface Dimension {
  name: DimensionName;
  score: number;
  note: string;
}

export interface Feedback {
  dimensions: Dimension[];
  fixIts: string[];
  overallSummary: string;
  /** Advisory only — it never gates the retry loop. The user judges when they're done. */
  interviewReady: boolean;
}

/** Passed to Gemini as `response_format.schema`. */
export const feedbackSchema = {
  type: 'object',
  properties: {
    dimensions: {
      type: 'array',
      description: `Exactly one entry per dimension, in this order: ${DIMENSION_NAMES.join(', ')}.`,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', enum: [...DIMENSION_NAMES] },
          score: { type: 'integer', description: '1 (poor) to 5 (excellent).' },
          note: { type: 'string', description: 'One or two sentences on this dimension.' },
        },
        required: ['name', 'score', 'note'],
      },
    },
    fixIts: {
      type: 'array',
      description: '1-3 concrete changes to make on the next attempt.',
      items: { type: 'string' },
    },
    overallSummary: { type: 'string', description: 'One or two sentences.' },
    interviewReady: { type: 'boolean' },
  },
  required: ['dimensions', 'fixIts', 'overallSummary', 'interviewReady'],
} as const;

export const SYSTEM_INSTRUCTION = `You are a behavioral interview coach. You listen to a spoken answer to a behavioral interview question and return structured feedback.

Tone: direct but constructive. Name weaknesses plainly, and always pair each one with how to fix it. You are a mentor who respects the candidate's time — not a blunt hiring manager, and not a soft cheerleader.

Score each of these four dimensions from 1 (poor) to 5 (excellent), with a note of one or two sentences:

1. "STAR structure" — is there a clear Situation, Task, Action and Result? Call out missing or weak parts.
2. "Specificity & ownership" — concrete details, metrics and outcomes, and whether the candidate describes their own contribution ("I") rather than hiding behind the team ("we"). Vagueness is the single most common failure mode: be strict here.
3. "Relevance" — did they answer the question actually asked, without drifting?
4. "Delivery" — tone, pace, filler words, confidence, as heard in the audio. Treat pace and filler-word observations as approximate impressions and word them that way; you are not counting them precisely.

Then provide:
- "fixIts": 1 to 3 concrete, specific changes for the next attempt (e.g. "quantify the result — say how much time it saved", "cut the 30 seconds of backstory and start at the decision"). Never write a model answer or scripted lines for them; the point is that they build the answer in their own words.
- "overallSummary": one or two sentences.
- "interviewReady": a holistic judgement of whether this answer would land well in a real interview. This is advisory guidance for the candidate — it does not gate anything.

If the audio is empty, inaudible, or is not an attempt at answering the question, say so plainly in "overallSummary", score what you can, and set "interviewReady" to false.`;

export function buildPrompt(question: string): string {
  return `The candidate was asked this behavioral interview question:

"${question}"

The attached audio is their spoken answer. Assess it against the rubric.`;
}
