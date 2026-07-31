# Build the vertical slice: record → Gemini → feedback for one question

- Type: wayfinder:task
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: 007
- Parent: wayfinder/map.md

## Question

Build the running proof of the risky path, for ONE hardcoded question:

1. Practice screen shows the question.
2. User records a spoken answer in the browser (MediaRecorder).
3. Audio is sent to a server route that calls Gemini with the feedback prompt.
4. Structured feedback comes back and renders on screen.
5. User can retry the same question and get fresh feedback.

Scope guardrails: one hardcoded question, minimal UI, no persistence, no auth, no question
bank. This ticket is execution (the map's one carried-through build) — it exists to prove the
loop delivers value, not to be the finished product.

Depends on the audio-format strategy (007). The rubric + JSON shape (002), the stack + key
handling (004), and the Gemini API facts (001) are all settled — see those tickets and
[research/gemini-audio.md](../research/gemini-audio.md). The prototype (005) may inform the UI
but does not block. Build target: **Vite + React + TS** client + **Hono + TS** server,
Gemini key server-side, Vite proxying `/api` → Hono in local dev (per 004).

Deliverable: running code in the repo; the ticket answer records what was proved and any
surprises (latency, cost, audio-feedback quality) that reshape the spec or the fog.

## Progress

**Built, not yet proven end-to-end.** Staying open until one real recording has gone to Gemini
and come back as feedback — that run needs an API key and a microphone, neither of which the
build environment had.

### What exists

- `client/` — Vite + React + TS.
  - `src/audio/wav-encoder.ts` — pure mono/16-bit PCM WAV encoder (no deps, no Web Audio types).
  - `src/audio/wav.ts` — the 007 pipeline: `decodeAudioData` → mono 16 kHz `OfflineAudioContext`
    → WAV → base64. No per-browser branches.
  - `src/audio/useRecorder.ts` — MediaRecorder at the browser's default codec, elapsed-time
    counter, releases the mic on stop and on unmount.
  - `src/App.tsx` — practice screen: question, record/stop, "Listening to your answer…",
    feedback panel, "Try again" for a fresh attempt on the same question.
  - `src/FeedbackPanel.tsx` — the four dimensions with score meters, fix-its, summary, and the
    `interviewReady` line explicitly labelled as guidance rather than a verdict.
- `server/` — Hono + TS. `POST /api/feedback` validates the body, calls Gemini, returns the
  rubric JSON; `GET /api/health`. `src/rubric.ts` holds the schema and the coach system
  instruction (the 002 rubric, verbatim in intent). Key is read from `server/.env`, never sent
  to the browser.
- Root `README.md` with setup and the two dev commands.

### Verified

- **The Gemini call shape in ticket 001 is accurate** — checked against the installed SDK's own
  typings: `client.interactions.create`, `response_format: { type: 'text', mime_type,
  schema }`, and `interaction.output_text` all exist as documented.
- **`gemini-3.6-flash` and `gemini-3.5-flash` are both real** — they appear in the SDK's model
  union in `@google/genai@2.14.0`.
- **The hand-rolled WAV encoder produces a valid file.** Byte-layout assertions pass, and macOS
  `afinfo` parses the output independently as `WAVE, 1 ch, 16000 Hz, Int16, 2.000 sec` — exactly
  the format parameters 007 specified.
- Client typechecks, builds and lints clean; server typechecks clean.
- Both dev processes boot; `GET /api/health` and `POST /api/feedback` both answer **through the
  Vite proxy** on `:5173`, so the 004 no-CORS setup works. Body validation returns 400s, and the
  missing-key path returns its configured error rather than failing obscurely.

### First live run: one bug, now fixed

The first end-to-end attempt failed with a 400 from Gemini:

```
responseFormat must be set when responseMimeType is set.
```

**Cause: `server/src/gemini.ts` set both `response_mime_type` and `response_format`.** The
`response_format` object carries its own `mime_type`; setting the separate top-level field too is
rejected — even though `response_format` *was* set, which makes the message actively misleading.
The mistake came from trusting the SDK's doc comment on the field ("This is required if
`response_format` is set"), which is simply **wrong**. Ticket 001's research had the correct shape
all along; the code deviated from it.

Probed against the live API to be sure rather than guessing — `response_format` alone works, as
does a single-element array; both variants that include `response_mime_type` fail. Table recorded
in [research/gemini-audio.md](../research/gemini-audio.md). Fix was to delete the one line.

### Then verified against the live API

`POST /api/feedback` with a real WAV returns **HTTP 200 and rubric-shaped JSON** matching the 002
contract exactly — four named dimensions with scores and notes, `fixIts`, `overallSummary`,
`interviewReady`.

Strong signal that the **audio is genuinely being heard**, not inferred from the prompt: the test
file was a 2-second 440 Hz sine tone, and the feedback came back with *"The provided audio contains
only a brief signal tone and no spoken answer"*, all dimensions scored 1, and a fix-it asking for a
real recording. That is the rubric's "inaudible / not an attempt" branch firing correctly on
evidence only available from the audio itself.

**Latency: 8.8 s** end-to-end for a 2-second clip — so it's dominated by model time, not audio
length, and a real 1–3 minute answer should not be dramatically slower. Needs re-measuring on a
real answer.

## Answer

**The risky path works.** Verified in the browser on 2026-07-31 by Diogo, on a real spoken answer,
after the `response_mime_type` fix above — reported as passing "with flying colours". Record a
spoken answer → mono/16 kHz WAV in the browser → inline base64 to Gemini → structured rubric
feedback rendered on screen → retry the same question. Every link in the chain is now proven on
real input, including the two the tone test couldn't reach: the **browser-produced WAV is
listenable** to Gemini, and **audio-native feedback quality is good enough to keep the audio
path** — the transcribe-then-text fallback documented in 008 stays unbuilt.

### What this settles

- **Gemini multimodal audio-in is the right pipeline** for this product, not a risk to design
  around. The slice pipeline in the map is confirmed, not provisional.
- **The 007 audio strategy holds in practice** — client-side decode → mono 16 kHz → hand-rolled
  WAV, with a server that does no transcoding. No ffmpeg, no system deps, verified on Chrome.
- **The 002 rubric survives contact with real answers.** The four dimensions, the 1–5 scores, the
  fix-its and the advisory `interviewReady` flag all came back usable and worth reading.
- **The 004 stack holds** — Vite client + Hono server, key server-side only, `/api` proxied in dev.

### Numbers

- **Latency ≈ 9 s** per attempt (measured at 8.8 s for a 2-second clip, so dominated by model time
  rather than audio length). Acceptable for a practice loop; would be worth a progress indicator
  if it ever grew.
- **Cost: negligible, by calculation not measurement.** Ticket 001's 32 tokens/sec means a 2-minute
  answer is ~3,840 input tokens at text rates. Nothing in the live runs contradicted that, but no
  usage figures were actually captured — the server doesn't log them. Not worth chasing for a
  personal tool; note it if per-attempt cost ever matters.

### Carried forward

Nothing blocking. The slice is deliberately a proof, not the product: one hardcoded question, no
persistence, no history. The question bank (003) and the practice-screen UX (005) are the live
frontier, and progress tracking remains in the map's fog.

### Surprise worth recording

`@google/genai` **v1 is too old for this project**: v1.52.0's model union stops at
`gemini-3.1-*`, and its Interactions API has no `output_text` — `outputs` must be walked by
hand. v2.14.0 matches the research doc exactly. Anything on v1 will look subtly wrong.

That version choice was reactive, so it graduated into
[ticket 009](009-genai-sdk-package-choice.md), which settled it: the dependency is now pinned
**exactly** to `2.14.0` (no caret), and the Interactions API turns out to be the *GA* surface —
`generateContent` is the legacy one, the reverse of this ticket's framing above.
