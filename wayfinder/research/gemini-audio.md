# Research: Gemini audio-input API

_Asset for ticket [001 — Gemini audio-input API](../tickets/001-gemini-audio-api.md). Sources are Google's primary docs (July 2026). For why `gemini-3.6-flash` over other models, see [model-comparison.md](./model-comparison.md)._

## TL;DR for the slice

- Send the recorded answer as **inline base64 audio** in a single call to
  **`gemini-3.6-flash`** via the new **Interactions API** (`@google/genai` SDK) and ask for
  **structured JSON** feedback via `response_format`.
- A 1–3 min answer is tiny (**32 tokens/sec** → 2 min ≈ 3,840 tokens; a few MB of audio),
  comfortably under the **20 MB inline** limit — **no Files API needed**.
- **Blocker to design around:** MediaRecorder's default output is **WebM/Opus**, which is
  **NOT on Gemini's supported-format list**. We must land the audio in a supported container
  (WAV/MP3/AAC/OGG-Vorbis/FLAC) first. → graduated ticket 007.

## Supported models & API surface

- **`gemini-3.6-flash`** accepts audio input via the **Interactions API**
  (`client.interactions.create`). A legacy **Generate Content API** also exists.
- SDK: **`@google/genai`** (JavaScript/Node).

## Accepted audio formats

WAV (`audio/wav`), MP3 (`audio/mp3`), AIFF (`audio/aiff`), AAC (`audio/aac`),
OGG **Vorbis** (`audio/ogg`), FLAC (`audio/flac`).

- **WebM/Opus is not listed.** Chrome MediaRecorder defaults to `audio/webm;codecs=opus`;
  Safari to `audio/mp4` (AAC, which *is* supported); Firefox to `audio/ogg;codecs=opus`
  (OGG **Opus**, not clearly the same as the listed OGG **Vorbis**).
- Safest cross-browser path: capture/encode to **WAV** in-browser (simple, lossless) or
  transcode server-side to MP3. See ticket 007.

## Inline vs Files API

- **Inline base64:** max **20 MB** total request size (audio + prompt). Fine for our use.
- **Files API:** only needed for files > 20 MB (irrelevant for short answers).

## Limits & cost

- Max **9.5 hours** of audio per prompt (irrelevant here).
- **32 tokens/second** of audio (1 min = 1,920 tokens). A full 3-min answer ≈ 5,760 input
  tokens — cost is negligible per attempt.

## What the model can comment on (delivery feedback honesty)

Documented capabilities: transcription, translation, **speaker diarization**,
**emotion detection**, and non-speech sound recognition.

- **Realistic:** overall tone / confidence / emotion, and full content critique from the
  transcription.
- **Less reliable direct from audio:** precise pace (WPM) and filler-word counts — better
  computed from transcript + clip duration if we want hard numbers. Set expectations
  accordingly in the rubric (ticket 002).

## Auth model

- Simplest for a personal project: **Google AI Studio API key** (`GEMINI_API_KEY` env),
  read by `@google/genai` — kept server-side (see ticket 004).
- **Vertex AI** alternative uses a service account / ADC (heavier; org-approved route).

## Code shape (inline audio → JSON feedback)

```javascript
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";

const client = new GoogleGenAI({}); // reads GEMINI_API_KEY from env

const audioData = fs.readFileSync("answer.wav", { encoding: "base64" });

const feedbackSchema = {
  type: "object",
  properties: {
    overallReady: { type: "boolean" },
    // ...dimensions defined by ticket 002 (the rubric)
    summary: { type: "string" },
  },
  required: ["overallReady", "summary"],
};

const interaction = await client.interactions.create({
  model: "gemini-3.6-flash",
  input: [
    { type: "text", text: "You are a behavioral interview coach... <rubric prompt>" },
    { type: "audio", data: audioData, mime_type: "audio/wav" },
  ],
  response_format: { type: "text", mime_type: "application/json", schema: feedbackSchema },
});

const feedback = JSON.parse(interaction.output_text);
```

- Schema also definable with **Zod** in JS. Note: only a **subset of JSON Schema** is
  supported; very large / deeply nested schemas may be rejected — keep the feedback shape flat.

### ⚠️ Do not also set `response_mime_type`

`response_format` carries its own `mime_type`, as in the sample above. **Setting the separate
top-level `response_mime_type` field alongside it fails** with a 400:

```
responseFormat must be set when responseMimeType is set.
```

— which is maddening, because it *is* set. The SDK's own doc comment on `response_mime_type`
("This is required if response_format is set") is **wrong**, and following it is what broke
ticket 006's first end-to-end run. Verified against the live API on 2026-07-31:

| Params sent | Result |
| --- | --- |
| `response_format` only | **200**, schema-valid JSON |
| `response_format` as a single-element **array** | **200**, schema-valid JSON |
| `response_format` **and** `response_mime_type` | 400 `responseFormat must be set…` |
| `response_mime_type` only | 400 `responseFormat must be set…` |

So `response_mime_type` appears to be vestigial in v2 — there is no combination in which
setting it helps. Pass `response_format` alone.

## Implications for the map

1. **New ticket 007** — decide the browser-audio → Gemini-accepted-format strategy; blocks
   the slice (006).
2. **Ticket 002 (rubric)** should keep the feedback JSON **flat** and set honest expectations
   on pace/filler-word precision.
3. **Ticket 004 (stack)** confirmed: a server-side call is needed; API-key-in-env is simplest.

## Sources

- [Audio understanding | Gemini API](https://ai.google.dev/gemini-api/docs/audio)
- [Audio understanding — Interactions API](https://ai.google.dev/gemini-api/docs/interactions/audio)
- [Structured outputs | Gemini API](https://ai.google.dev/gemini-api/docs/structured-output)
- [Structured outputs — Interactions API](https://ai.google.dev/gemini-api/docs/interactions/structured-output)
