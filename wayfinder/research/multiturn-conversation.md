# Research: Multi-turn conversational architecture with Gemini

_Asset for ticket [013 — Multi-turn conversational architecture with Gemini](../tickets/013-multiturn-conversation-architecture.md),
on the [seniority-mode map](../map-seniority-mode.md). Sources are Google's primary docs
(ai.google.dev), fetched 2026-08-11. This de-risks the whole seniority mode and revisits the
one-shot assumptions in tickets [001](../tickets/001-gemini-audio-api.md) (audio API),
[007](../tickets/007-audio-format-strategy.md) (audio format) and
[009](../tickets/009-genai-sdk-package-choice.md) (SDK / Interactions API)._

## TL;DR — it's feasible, and the shape is the Live API

- **Use the Gemini Live API, not replayed history.** The Live API is a **stateful WebSocket**
  session built for exactly this: a bidirectional spoken conversation where the persona +
  prior turns live server-side and are **not** re-sent each turn. The alternative — replaying
  a growing conversation history on every turn over the Interactions API — is technically
  possible but loses the live feel and grows cost with each turn. Live wins decisively here.
- **The interviewer speaks (native audio out).** Live's native-audio models reply as
  **synthesized speech** — the realism the mock interview is for. Their **built-in output
  transcription** gives the text of what the interviewer said, so the UI can *also* show it on
  screen. No separate TTS service needed (standalone TTS models exist but are for recitation,
  not conversation).
- **No separate STT needed either.** Live has **built-in input transcription** — the user's
  spoken answer comes back as text per turn, ready to feed the seniority report (015) and to
  render as a running transcript. This is the transcription that tickets 002/008 flagged as a
  fallback; Live makes it first-party.
- **Persona holds server-side.** The interviewer persona + hidden agenda is set **once** in the
  session-setup `systemInstruction`; it persists across turns without re-priming.
- **Cost is negligible.** A ~6-turn, ~10-minute spoken session ≈ **$0.12** (order of magnitude).
- **The one real caveat is model tier + session length.** The Live-capable models are
  **`-preview`** tier, not the GA Interactions surface ticket 009 settled on — and Live sessions
  cap at **15 minutes of audio** with a **~10-minute connection lifetime**, needing session
  resumption / context compression for anything longer. Both are manageable; both are called out
  below and handed to tickets 014 (protocol length) and 017 (UX).

## The core decision: Live API vs replayed history

Ticket 013 asks whether Gemini supports a stateful multi-turn session or forces re-sending
history each turn. **Both exist. They are different products.**

| | **Live API** (recommended) | **Replayed history** (Interactions/`generateContent`) |
|---|---|---|
| Transport | Stateful **WebSocket** (`BidiGenerateContent`) | Request/response HTTP, one call per turn |
| History | Held **server-side** for the open connection — not re-sent | Stateful mode (`previous_interaction_id`) server-stores it; stateless mode re-sends every turn |
| Audio in | **Streamed** 16 kHz PCM chunks | One audio blob per request (per ticket 007) |
| Audio out | **Native speech** (24 kHz PCM) | Text only (unless a separate TTS call) |
| Transcription | **Built-in**, both sides | Separate STT step needed for user audio → text |
| Turn latency | Designed for **low-latency** live turn-taking | Full round-trip per turn, no streaming turn-taking |
| Cost over 6 turns | Flat per-minute over one session | Grows: re-sending audio history re-pays for prior turns |
| Model | A `-live` / native-audio model (see below) | `gemini-3.6-flash` (project's current pin) |

**Verdict: Live API.** A mock interview *is* a live spoken back-and-forth — the Live API is the
tool Google built for it. Replaying history would mean a separate TTS call per turn, a separate
STT call per turn, no streaming turn-taking, and audio-history cost that compounds every turn.
The only reason to prefer replayed-history would be to reuse the exact one-shot pipeline — but
that pipeline (client-side WAV blob → thin HTTP proxy, per ticket 007) doesn't fit a live
conversation anyway. This mode gets a **new, streaming pipeline**; the behavioral mode keeps its
batch one.

### Interactions API multi-turn, for the record

Even outside Live, the Interactions API supports multi-turn two ways
([interactions-overview](https://ai.google.dev/gemini-api/docs/interactions-overview)):
**stateful** (`previous_interaction_id` continues a server-stored conversation and lets implicit
caching cut cost/latency — recommended) and **stateless** (`store=false`, resend full history
client-side). The `@google/genai` SDK also has a client-side `client.chats.create()` /
`chat.sendMessage()` helper. None of these give spoken turn-taking, so they're not the fit here —
but they're the honest fallback if the Live `-preview` tier proves unstable (see caveats).

## Session, persona & the length ceiling

- **Persona / hidden agenda:** set once in the setup message's `systemInstruction`
  (`setup: { model, responseModalities, systemInstruction }`). Persists for the session — no
  per-turn re-priming, which is what keeps the interviewer from drifting or breaking character.
  Directly answers 013's "persona persistence" sub-question and hands 014 a clean mechanism.
- **Context window:** **128k tokens** for native-audio models (32k for other Live models). Audio
  bills at **25 tokens/sec**, so a 10-minute session is nowhere near the ceiling.
- **⚠️ Session length ceiling:** audio-only sessions cap at **15 minutes**; the underlying
  WebSocket connection lasts **~10 minutes** and terminates on its own even mid-session.
  - **Session resumption:** the server periodically emits a `SessionResumptionUpdate` handle; a
    new connection restores state via `SessionResumptionConfig.handle`. Handles are valid **2
    hours** after a session ends. A `GoAway` message (with `timeLeft`) warns before disconnect,
    so the client reconnects gracefully — invisible to the candidate.
  - **Context-window compression:** a sliding-window mechanism can extend a session "to an
    unlimited amount of time."
  - **Implication for 014 & 017:** a ~6-turn screen fits inside 15 minutes comfortably, so
    resumption is a **robustness measure** (survive a mid-turn connection drop), not a core
    requirement — *unless* 014's protocol runs long, in which case reconnection becomes load-
    bearing and 017's UX must hide the reconnect.

## Interviewer output modality — speech + on-screen text

- Native-audio Live models (below) **only support the AUDIO response modality** — the reply is
  speech, not text. To *also* show the interviewer's words on screen, enable **output audio
  transcription** rather than asking for a text modality.
- **Voice:** `speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName` (e.g. `"Kore"`);
  ~30 prebuilt voices with distinct characters (firm/upbeat/breathy…), 100+ languages. Lets 014
  pick a voice that fits the interviewer persona.
- Audio out is **24 kHz, 16-bit PCM, mono**; audio in is **16 kHz PCM** (Gemini resamples if
  needed). The 16 kHz-mono input aligns with ticket 007's format decision — but note the pipeline
  is now **streamed PCM chunks over a socket**, not a finished WAV file.
- **Standalone TTS is NOT the path.** Dedicated TTS models (`gemini-3.1-flash-tts-preview`,
  `gemini-2.5-flash-preview-tts`, …) exist, but Google's own docs distinguish them: TTS is for
  precise recitation (podcasts/audiobooks), whereas Live is "designed for interactive… audio."
  Use Live's native audio out; don't bolt on a TTS call.

## Transcription — built in, both sides

Live provides automatic transcription via two setup flags — **`input_audio_transcription`**
(the user's spoken answer → text) and **`output_audio_transcription`** (the interviewer's spoken
reply → text) — returned as `inputTranscription` / `outputTranscription` on the server message.

This is a big simplification: the seniority report (015) can score against a clean per-turn
transcript, and 017 can render a live transcript, **without** the separate STT model
(`gpt-4o-transcribe` / Deepgram) that the one-shot mode's research named as a fallback. The
answer to 013's "user answers across turns" sub-question: **transcribed per-turn, for free, by
the Live session itself.**

_(Doc gap: I confirmed the flags/fields exist from the capabilities list and the response-message
schema, but did not retrieve a copy-pasteable setup snippet enabling them — verify the exact
field names at build time.)_

## Latency

- **No numeric benchmark is published** by Google for either Live or batch audio round-trips —
  treat any specific millisecond figures from blogs/third parties as unverified.
- Qualitatively, Live is built for **low-latency** turn-taking (its whole reason to exist), and
  `gemini-3.1-flash-live-preview` defaults `thinkingLevel` to **minimal** specifically to minimise
  latency. Ephemeral-token direct connections (below) further cut latency by removing a backend
  relay hop.
- The one-shot mode's ~9 s per attempt is **irrelevant** here — that's a batch round-trip;
  Live streams. **Recommendation:** treat live-turn latency as the one thing to confirm with a
  throwaway spike before committing 017's UX to "interviewer speaks in real time" (build-effort
  concern, not a planning blocker).

## Cost

Live pricing (per [pricing page](https://ai.google.dev/gemini-api/docs/pricing), updated
2026-08-11), billed at 25 audio tokens/sec:

| Model | Audio in | Audio out | Text in / out (1M) |
|---|---|---|---|
| `gemini-3.1-flash-live-preview` | $3.00/1M or **$0.005/min** | $12.00/1M or **$0.018/min** | $0.75 / $4.50 |
| `gemini-2.5-flash-native-audio-preview-12-2025` | $3.00/1M | $12.00/1M | $0.50 / $2.00 |

**Rough 10-minute, 6-turn session** (≈5 min candidate speaking, ≈5 min interviewer speaking —
my split, not a Google figure): 5 × $0.005 + 5 × $0.018 ≈ **$0.12/session**. Negligible for a
personal tool. Replaying growing audio history over the batch API would cost *more* (each turn
re-pays for prior turns' audio) — another point for Live.

## Connection topology (recommendation)

Two ways for the browser to reach a Live session:

1. **Ephemeral tokens (recommended).** The small backend mints a short-lived token
   (`client.authTokens.create`, single-use, `newSessionExpireTime` ~1 min to start, `expireTime`
   ~30 min to keep sending) and the **browser connects directly** to Gemini's WebSocket. No
   long-lived API key in the client, no backend proxying realtime audio → lower latency. Within
   the 30-min token you reconnect via session resumption ~every 10 min without spending the
   token's single use.
2. **Backend WebSocket proxy.** The browser talks to your server, which holds the API key and
   relays to Gemini. Simpler mental model, but the backend must now stream audio both ways (it's
   no longer the thin HTTP proxy of ticket 004), and it adds a relay hop of latency.

**Recommendation:** ephemeral tokens — it keeps the backend thin (mint a token, done), matches
the personal-tool trust model (the API key stays server-side), and is the lower-latency path. The
backend gains exactly one new endpoint (`POST /live-token`), not a streaming relay.

## ⚠️ Model discrepancy — the seniority mode needs a *live* model

The project pins **`gemini-3.6-flash`** (tickets 006/009) for the one-shot batch mode. **That
model does not appear anywhere in the Live API / pricing docs.** Live/native-audio is served by a
distinct family:

- **`gemini-3.1-flash-live-preview`** — newest live model; native audio out; minimal-thinking
  default for latency. **Recommended default for this mode.**
- **`gemini-2.5-flash-native-audio-preview-12-2025`** — native-audio dialog; viable fallback.
- `gemini-3.5-live-translate-preview` — translation-specialised; not a fit.

Two consequences:

1. **The seniority mode runs on a different model than the behavioral mode.** That's fine — it's
   a genuinely different pipeline. The behavioral mode's `gemini-3.6-flash` + Interactions-API
   decision (009) is **unchanged**; this mode adds a parallel Live-API stack.
2. **These are `-preview`, not GA.** Ticket 009 deliberately chose the GA Interactions surface and
   warned against preview-tier surfaces that "could break under us," pinning `@google/genai`
   **exactly** to `2.14.0` for that reason. The Live path re-introduces exactly that preview-tier
   risk. Mitigations: the same exact-pin discipline; keep the replayed-history/Interactions path
   documented above as the escape hatch; and **re-check the live model list at build time** —
   `-preview` tags churn, and a GA live model may exist by then. _(Model-list page not fetched
   this pass; confirm names against
   [models](https://ai.google.dev/gemini-api/docs/models) when building.)_

## Recommended conversation architecture (summary)

1. **Transport:** Gemini **Live API** (`BidiGenerateContent` WebSocket) via `@google/genai`.
2. **Model:** `gemini-3.1-flash-live-preview` (native audio out), exact-pinned; confirm live-model
   names at build time. Fallback: `gemini-2.5-flash-native-audio-preview-12-2025`.
3. **Connection:** browser → Gemini **direct**, authed by a **backend-minted ephemeral token**
   (one new `/live-token` endpoint; backend stays thin, no audio relay).
4. **Persona:** set once at setup via `systemInstruction` (feeds 014); pick a prebuilt `voiceName`
   to match the persona.
5. **Turns:** candidate speech streamed in as 16 kHz PCM; interviewer replies as **native speech**
   (24 kHz PCM) played back; **input + output transcription** enabled so both sides also exist as
   text (feeds the 015 report and 017's on-screen transcript).
6. **Session lifecycle:** enable **session resumption** (handle + `GoAway` handling) so a mid-
   interview connection drop is invisible; enable **context-window compression** if 014's protocol
   can exceed the 15-min audio cap.
7. **Cost:** ~$0.12/session — no budget concern.
8. **Risk to spike before build:** confirm live-turn latency *feels* live, and confirm the current
   live model names/tier.

## What this hands the rest of the map

- **014 (persona/protocol):** persona = a session `systemInstruction`; interviewer speaks (pick a
  voice); ~6 turns fit the 15-min ceiling; anything longer needs resumption/compression. Turn
  count/length is now a real constraint 014 owns.
- **015 (report contract):** a clean **per-turn transcript of both sides** is available for free
  (built-in transcription) — score against that.
- **017 (UX):** interviewer **speaks**; turns **stream**; UI shows whose turn it is, plays the
  interviewer's audio, and renders the live transcript; reconnects must be invisible. This is a
  live-conversation screen, not a record-one-answer screen.
- **Behavioral mode:** unchanged. The "should the multi-turn pipeline upgrade the one-shot mode?"
  fog resolves toward **no** — Live is a streaming/conversational pipeline, a poor fit for the
  batch "one clip → one JSON verdict" flow the behavioral mode already nails.

## Flagged gaps (verify at build time)

1. No published numeric latency benchmarks for Live — spike it.
2. Exact setup-time field names for `input_audio_transcription` / `output_audio_transcription`
   confirmed to exist but no copy-pasteable snippet retrieved.
3. Interactions API docs don't confirm whether raw audio persists/replays inside stateful
   (`previous_interaction_id`) history — only matters if the fallback path is ever taken.
4. Live model names are `-preview` and churn; re-check the model list before building.

## Sources

- [Live API overview](https://ai.google.dev/gemini-api/docs/live-api)
- [Live API capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities)
- [Live API session management](https://ai.google.dev/gemini-api/docs/live-session)
- [Live API — get started (WebSocket)](https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket)
- [Live API — ephemeral tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens)
- [Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Speech generation (Interactions)](https://ai.google.dev/gemini-api/docs/speech-generation)
- [Audio understanding](https://ai.google.dev/gemini-api/docs/audio)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Models](https://ai.google.dev/gemini-api/docs/models)
