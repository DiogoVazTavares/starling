import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { BadGeminiResponseError, MissingApiKeyError, requestFeedback } from './gemini.ts';
import { mintLiveToken } from './interviewer.ts';
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
