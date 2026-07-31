# Gemini audio-input API: formats, limits, prompting

- Type: wayfinder:research
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

How do we send recorded audio to Gemini and get structured feedback back? Establish the
facts the vertical slice depends on:

- Which Gemini model(s) accept audio input, and via which SDK/endpoint (Vertex AI vs
  Google AI Studio / `generativelanguage` API)?
- Accepted audio formats and how MediaRecorder output (typically `audio/webm;codecs=opus`)
  maps to them — do we need transcoding, or inline-base64 vs file upload?
- Size / duration limits per request; token/cost implications of a ~1–3 min answer.
- How to get **structured** output (JSON feedback) — response schema / JSON mode support.
- Auth model for calling from a small backend (API key vs service account).
- What audio-derived signal the model can actually comment on (tone, pace, filler words)
  vs what it cannot — to set honest expectations for the delivery-feedback promise.

Deliverable: a markdown summary linked from this ticket (e.g. `wayfinder/research/gemini-audio.md`).

## Answer

Full findings: [wayfinder/research/gemini-audio.md](../research/gemini-audio.md).

- **Model/API:** `gemini-3.6-flash` via the Interactions API (`@google/genai` SDK,
  `client.interactions.create`). Send audio as **inline base64** — no Files API needed
  (inline limit 20 MB; a 3-min answer is a few MB / ~5.8K tokens at 32 tokens/sec).
- **Structured feedback:** use `response_format` with `mime_type: "application/json"` + a
  JSON schema (Zod supported in JS). Keep the schema flat — only a subset of JSON Schema is
  supported.
- **Accepted formats:** WAV, MP3, AIFF, AAC, OGG Vorbis, FLAC. **WebM/Opus (MediaRecorder's
  default) is NOT supported** → new **ticket 007** to decide the format strategy; it blocks
  the slice (006).
- **Delivery feedback honesty:** emotion/tone and content are reliable; precise pace (WPM)
  and filler-word counts are better computed from transcript + duration — note in rubric (002).
- **Auth:** AI Studio API key in a server-side env var is simplest; Vertex AI (service
  account) is the heavier org-approved alternative. Confirms 004 needs a server-side call.
