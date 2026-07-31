import { GoogleGenAI } from '@google/genai';
import {
  DIMENSION_NAMES,
  SYSTEM_INSTRUCTION,
  buildPrompt,
  feedbackSchema,
  type Feedback,
} from './rubric.ts';

/**
 * `gemini-3.6-flash` is the decision from ticket 008 — the only model with audio-in,
 * JSON-schema-out and text-rate audio pricing. `gemini-3.5-flash` is the documented
 * fallback, hence the override.
 */
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';

/** Thrown when the server is misconfigured, as opposed to the request being bad. */
export class MissingApiKeyError extends Error {}

/** Thrown when Gemini answers but the answer isn't usable. */
export class BadGeminiResponseError extends Error {}

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError(
      'GEMINI_API_KEY is not set. Copy server/.env.example to server/.env and add your key.',
    );
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export async function requestFeedback(question: string, wavBase64: string): Promise<Feedback> {
  const interaction = await getClient().interactions.create({
    model: MODEL,
    system_instruction: SYSTEM_INSTRUCTION,
    input: [
      { type: 'text', text: buildPrompt(question) },
      // Inline base64 — a short answer is far under the 20 MB inline limit (ticket 001).
      { type: 'audio', data: wavBase64, mime_type: 'audio/wav' },
    ],
    // `response_format` carries the mime type itself. Do NOT also set `response_mime_type`:
    // the API rejects that with "responseFormat must be set when responseMimeType is set",
    // even though it is set. The SDK's own doc comment on the field claims the opposite.
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: feedbackSchema,
    },
  });

  const text = interaction.output_text;
  if (!text) {
    throw new BadGeminiResponseError(
      `Gemini returned no text output (interaction status: ${interaction.status}).`,
    );
  }

  return parseFeedback(text);
}

/**
 * Gemini's structured output is schema-constrained, but a malformed response must surface
 * as an error rather than reach the UI as a half-empty feedback panel.
 */
function parseFeedback(text: string): Feedback {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    throw new BadGeminiResponseError(`Gemini returned text that isn't JSON: ${text.slice(0, 200)}`, {
      cause,
    });
  }

  if (typeof value !== 'object' || value === null) {
    throw new BadGeminiResponseError('Gemini returned JSON that is not an object.');
  }
  const candidate = value as Record<string, unknown>;

  const { dimensions, fixIts, overallSummary, interviewReady } = candidate;

  if (!Array.isArray(dimensions) || dimensions.length === 0) {
    throw new BadGeminiResponseError('Gemini response is missing scored dimensions.');
  }
  for (const dimension of dimensions) {
    const { name, score, note } = (dimension ?? {}) as Record<string, unknown>;
    if (!DIMENSION_NAMES.includes(name as never)) {
      throw new BadGeminiResponseError(`Gemini scored an unknown dimension: ${String(name)}`);
    }
    if (typeof score !== 'number' || typeof note !== 'string') {
      throw new BadGeminiResponseError(`Dimension "${String(name)}" is missing a score or note.`);
    }
  }
  if (!Array.isArray(fixIts) || fixIts.some((fix) => typeof fix !== 'string')) {
    throw new BadGeminiResponseError('Gemini response is missing usable fix-its.');
  }
  if (typeof overallSummary !== 'string' || typeof interviewReady !== 'boolean') {
    throw new BadGeminiResponseError('Gemini response is missing its overall verdict.');
  }

  return candidate as unknown as Feedback;
}
