import { BadGeminiResponseError, getClient, MODEL, MissingApiKeyError } from './gemini.ts';
import {
  DEFAULT_MAX_FOLLOW_UPS,
  PICKER_SOFT_TIMEOUT_MS,
  PICKER_SYSTEM_INSTRUCTION,
  applyModelChoice,
  buildPickerPrompt,
  buildPickerSchema,
  deterministicFallback,
  parseModelNext,
  resolveBeforeModel,
  type PickFollowUpRequest,
  type PickFollowUpResult,
} from './picker.ts';

export type { PickFollowUpRequest, PickFollowUpResult } from './picker.ts';

/**
 * Pick the next follow-up or `done` for a tree (ticket 021).
 * Empty pools and depth-cap short-circuits skip Gemini. Invalid / timed-out model
 * output coerces to the deterministic fallback so the session never stalls.
 */
export async function requestPickFollowUp(
  request: PickFollowUpRequest,
): Promise<PickFollowUpResult> {
  const shortCircuit = resolveBeforeModel(request.candidates, request.followUpsAsked);
  if (shortCircuit) return shortCircuit;

  try {
    const modelNext = await withSoftTimeout(
      callPickerModel(request),
      PICKER_SOFT_TIMEOUT_MS,
    );
    return applyModelChoice(request.candidates, request.followUpsAsked, modelNext);
  } catch (error) {
    if (error instanceof MissingApiKeyError) throw error;
    console.error('[pick-follow-up] Gemini failed; using fallback:', error);
    return deterministicFallback(request.candidates, request.followUpsAsked);
  }
}

async function callPickerModel(request: PickFollowUpRequest): Promise<string | undefined> {
  const candidateIds = request.candidates.map((c) => c.id);
  const interaction = await getClient().interactions.create({
    model: MODEL,
    system_instruction: PICKER_SYSTEM_INSTRUCTION,
    input: [
      {
        type: 'text',
        text: buildPickerPrompt({
          treeId: request.treeId,
          answeredQuestionId: request.answeredQuestionId,
          answeredQuestionText: request.answeredQuestionText,
          candidates: request.candidates,
          history: request.history,
          followUpsAsked: request.followUpsAsked,
          maxFollowUps: DEFAULT_MAX_FOLLOW_UPS,
        }),
      },
      { type: 'audio', data: request.audioBase64, mime_type: 'audio/wav' },
    ],
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: buildPickerSchema(candidateIds),
    },
  });

  const text = interaction.output_text;
  if (!text) {
    throw new BadGeminiResponseError(
      `Gemini returned no text output (interaction status: ${interaction.status}).`,
    );
  }

  return parseModelNext(text);
}

function withSoftTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Pick-follow-up soft timeout after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
