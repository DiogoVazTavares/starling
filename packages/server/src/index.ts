import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { BadGeminiResponseError, MissingApiKeyError, requestFeedback } from './gemini.ts';
import { mintLiveToken } from './interviewer.ts';
import { requestPickFollowUp } from './pickFollowUp.ts';
import type { PickerCandidate, PickerHistoryEntry } from './picker.ts';
import { BadSeniorityReportError, generateSeniorityReport, type TranscriptTurn } from './seniority.ts';

/**
 * The whole reason this server exists: it holds GEMINI_API_KEY so the browser never does
 * (ticket 004). Everything else here is a thin proxy — no transcoding, no persistence.
 */

/** Gemini's inline-audio ceiling is 20 MB for the whole request; leave room for the prompt. */
const MAX_AUDIO_BASE64_CHARS = 18 * 1024 * 1024;

const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true }));

app.post('/api/feedback', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Request body must be JSON.' }, 400);
  }

  const { question, audioBase64 } = (body ?? {}) as Record<string, unknown>;

  if (typeof question !== 'string' || question.trim() === '') {
    return c.json({ error: 'Missing "question".' }, 400);
  }
  if (typeof audioBase64 !== 'string' || audioBase64 === '') {
    return c.json({ error: 'Missing "audioBase64" (a base64-encoded WAV).' }, 400);
  }
  if (audioBase64.length > MAX_AUDIO_BASE64_CHARS) {
    return c.json({ error: 'That recording is too long to send in one request.' }, 413);
  }

  try {
    const feedback = await requestFeedback(question, audioBase64);
    return c.json(feedback);
  } catch (error) {
    console.error('[feedback] failed:', error);

    if (error instanceof MissingApiKeyError) {
      return c.json({ error: error.message }, 500);
    }
    if (error instanceof BadGeminiResponseError) {
      return c.json({ error: `Gemini sent back something unusable: ${error.message}` }, 502);
    }
    const detail = error instanceof Error ? error.message : String(error);
    return c.json({ error: `Gemini call failed: ${detail}` }, 502);
  }
});

app.post('/api/pick-follow-up', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Request body must be JSON.' }, 400);
  }

  const parsed = parsePickFollowUpBody(body);
  if ('error' in parsed) {
    return c.json({ error: parsed.error }, parsed.status);
  }

  try {
    const result = await requestPickFollowUp(parsed.request);
    return c.json(result);
  } catch (error) {
    console.error('[pick-follow-up] failed:', error);

    if (error instanceof MissingApiKeyError) {
      return c.json({ error: error.message }, 500);
    }
    const detail = error instanceof Error ? error.message : String(error);
    return c.json({ error: `Pick-follow-up failed: ${detail}` }, 502);
  }
});

// --- Seniority mode (tickets 013 + 015) --------------------------------------------------------

/**
 * Mint a short-lived Gemini ephemeral token with the whole interviewer config locked in, so the
 * browser opens the Live WebSocket directly — the backend stays thin and never relays audio
 * (ticket 013). An optional `seedId` in the body resumes the same scenario on reconnection.
 */
app.post('/api/live-token', async (c) => {
  // A body is optional (a fresh session sends none); tolerate a missing or non-JSON body.
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const seedId = typeof body.seedId === 'string' ? body.seedId : undefined;

  try {
    return c.json(await mintLiveToken(seedId));
  } catch (error) {
    console.error('[live-token] failed:', error);

    if (error instanceof MissingApiKeyError) {
      return c.json({ error: error.message }, 500);
    }
    const detail = error instanceof Error ? error.message : String(error);
    return c.json({ error: `Could not mint a live token: ${detail}` }, 502);
  }
});

app.post('/api/seniority-report', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Request body must be JSON.' }, 400);
  }

  const { transcript } = (body ?? {}) as Record<string, unknown>;
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return c.json({ error: 'Missing "transcript" (a non-empty array of turns).' }, 400);
  }

  try {
    const report = await generateSeniorityReport(transcript as TranscriptTurn[]);
    return c.json(report);
  } catch (error) {
    console.error('[seniority-report] failed:', error);

    if (error instanceof MissingApiKeyError) {
      return c.json({ error: error.message }, 500);
    }
    if (error instanceof BadSeniorityReportError) {
      return c.json({ error: `Gemini sent back something unusable: ${error.message}` }, 502);
    }
    const detail = error instanceof Error ? error.message : String(error);
    return c.json({ error: `Report generation failed: ${detail}` }, 502);
  }
});

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, ({ port: boundPort }) => {
  console.log(`server listening on http://localhost:${boundPort}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('warning: GEMINI_API_KEY is not set — /api/feedback will fail until it is.');
  }
});

function parsePickFollowUpBody(
  body: unknown,
):
  | { request: Parameters<typeof requestPickFollowUp>[0] }
  | { error: string; status: 400 | 413 } {
  const record = (body ?? {}) as Record<string, unknown>;
  const {
    treeId,
    answeredQuestionId,
    answeredQuestionText,
    audioBase64,
    candidates,
    history,
    followUpsAsked,
  } = record;

  if (typeof treeId !== 'string' || treeId.trim() === '') {
    return { error: 'Missing "treeId".', status: 400 };
  }
  if (typeof answeredQuestionId !== 'string' || answeredQuestionId.trim() === '') {
    return { error: 'Missing "answeredQuestionId".', status: 400 };
  }
  if (typeof answeredQuestionText !== 'string' || answeredQuestionText.trim() === '') {
    return { error: 'Missing "answeredQuestionText".', status: 400 };
  }
  if (typeof audioBase64 !== 'string' || audioBase64 === '') {
    return { error: 'Missing "audioBase64" (a base64-encoded WAV).', status: 400 };
  }
  if (audioBase64.length > MAX_AUDIO_BASE64_CHARS) {
    return { error: 'That recording is too long to send in one request.', status: 413 };
  }
  if (!Array.isArray(candidates)) {
    return { error: 'Missing "candidates" (an array).', status: 400 };
  }
  if (!Array.isArray(history)) {
    return { error: 'Missing "history" (an array).', status: 400 };
  }
  if (typeof followUpsAsked !== 'number' || !Number.isFinite(followUpsAsked) || followUpsAsked < 0) {
    return { error: 'Missing "followUpsAsked" (a non-negative number).', status: 400 };
  }

  const parsedCandidates: PickerCandidate[] = [];
  for (const entry of candidates) {
    const candidate = (entry ?? {}) as Record<string, unknown>;
    if (typeof candidate.id !== 'string' || candidate.id.trim() === '') {
      return { error: 'Each candidate needs a non-empty "id".', status: 400 };
    }
    if (typeof candidate.text !== 'string' || candidate.text.trim() === '') {
      return { error: 'Each candidate needs a non-empty "text".', status: 400 };
    }
    const item: PickerCandidate = { id: candidate.id, text: candidate.text };
    if (Array.isArray(candidate.tags) && candidate.tags.every((t) => typeof t === 'string')) {
      item.tags = candidate.tags as string[];
    }
    if (typeof candidate.required === 'boolean') {
      item.required = candidate.required;
    }
    parsedCandidates.push(item);
  }

  const parsedHistory: PickerHistoryEntry[] = [];
  for (const entry of history) {
    const turn = (entry ?? {}) as Record<string, unknown>;
    if (typeof turn.questionId !== 'string' || turn.questionId.trim() === '') {
      return { error: 'Each history entry needs a non-empty "questionId".', status: 400 };
    }
    if (typeof turn.questionText !== 'string' || turn.questionText.trim() === '') {
      return { error: 'Each history entry needs a non-empty "questionText".', status: 400 };
    }
    const item: PickerHistoryEntry = {
      questionId: turn.questionId,
      questionText: turn.questionText,
    };
    if (typeof turn.coverageNote === 'string') {
      item.coverageNote = turn.coverageNote;
    }
    parsedHistory.push(item);
  }

  return {
    request: {
      treeId,
      answeredQuestionId,
      answeredQuestionText,
      audioBase64,
      candidates: parsedCandidates,
      history: parsedHistory,
      followUpsAsked,
    },
  };
}
