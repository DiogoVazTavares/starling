/**
 * Seniority-mode server pieces (tickets 013 + 015). SCAFFOLD: the live-token endpoint is not
 * implemented yet — that piece is marked below. The report call (015) is real.
 */

import { getClient, MODEL } from './gemini.ts';
import {
  ANTI_SIGNALS,
  FRAME_FAMILIES,
  PROBE_FRAMES,
  SYSTEM_INSTRUCTION,
  TIER_LEVELS,
  TIERS,
  buildPrompt,
  seniorityReportSchema,
  type SeniorityReport,
  type TranscriptTurn,
} from './seniority-rubric.ts';

export type { TranscriptTurn } from './seniority-rubric.ts';

/** Thrown when Gemini answers but the answer isn't usable. */
export class BadSeniorityReportError extends Error {}

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
  for (const [index, card] of ladder.entries()) {
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
  }

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
