# Research: model comparison — Gemini variants, Gemma, and competing audio-native LLMs

_Complements [gemini-audio.md](./gemini-audio.md) (which covers `gemini-3.6-flash` mechanics
in depth). This doc asks: is `gemini-3.6-flash` actually the right pick, versus other Gemini
tiers, self-hosted Gemma, or a competing provider? Sources are official docs (July 2026)._

## TL;DR for the slice

- **Stick with `gemini-3.6-flash`.** It's Google's newest Flash tier, audio-capable, and —
  unusually — **audio input is priced the same as text** ($1.50/1M tokens in, $7.50/1M out),
  unlike older Gemini tiers which charge a premium for audio. No reason to pay for Pro.
- **Gemma is a dead end for this project without extra work.** Only the small **E2B/E4B/12B**
  Gemma 4 variants take audio, capped at **30-second clips** (our answers run 1–3 min), and
  Gemma is **open-weights only** — no hosted API, so it means self-hosting a model server just
  to lose to Gemini on capability. Not worth it for a personal project.
- **OpenAI's `gpt-audio` is the closest competitor** and is genuinely cheap (~$0.02/min of
  input audio) and multi-format (webm included), **but it does not support Structured
  Outputs** — a real gap for our "return JSON feedback" requirement that Gemini doesn't have.
  This alone is enough to keep Gemini as the default.
- **AWS (Nova 2 Sonic) and Azure don't add a better option**: Nova 2 Sonic is a
  speech-to-speech/streaming model, not a batch "send a clip, get JSON back" model; Azure just
  re-hosts the same OpenAI audio models behind a Microsoft account.
- If audio-input reasoning ever disappoints, the fallback is **transcribe-then-text**:
  `gpt-4o-transcribe` or Deepgram Nova-3 for the transcript, then any text LLM (including
  Gemini) for the structured rubric — at the cost of losing direct tone/prosody signal.

## 1. Other Gemini variants — is `gemini-3.6-flash` the right one?

Per the [Gemini models page](https://ai.google.dev/gemini-api/docs/models) and
[pricing page](https://ai.google.dev/gemini-api/docs/pricing), several Gemini tiers accept
audio input, not just `gemini-3.6-flash`:

| Model | Audio input? | Input cost | Audio-specific rate? | Notes |
|---|---|---|---|---|
| **`gemini-3.6-flash`** (current default) | Yes | $1.50/1M in, $7.50/1M out | No — same as text | Newest Flash (released 2026-07-21), "balances speed with intelligence," 1,048,576-token context, 65,536 max output. |
| `gemini-3.5-flash` | Yes | $1.50/1M in, $9.00/1M out | No — same as text | Positioned as "most intelligent" for sustained/agentic work; pricier output than 3.6, no audio advantage for us. |
| `gemini-3.5-flash-lite` | Not confirmed audio-capable on the models page | $0.30/1M in, $2.50/1M out | — | Cheapest/fastest tier; skip — we want the audio-understanding depth. |
| `gemini-3.1-flash-lite` | Yes | $0.25/1M (text/image/video) | **Yes — $0.50/1M for audio** (2x text) | Older tier that still splits out an audio surcharge. |
| `gemini-2.5-flash` | Yes | $0.30/1M (text/image/video) | **Yes — $1.00/1M for audio** (>3x text) | Cheaper base rate but audio costs more per token than 3.6-flash's flat rate once you account for the surcharge. |
| `gemini-2.5-flash-lite` | Yes | $0.10/1M (text/image/video) | **Yes — $0.30/1M for audio** (3x text) | Same pattern — audio surcharge. |
| `gemini-2.5-pro` | Yes (multimodal) | $1.25–2.50/1M in (tiered by context), $10–15/1M out | Not broken out separately | Pro tier: ~7x the output cost of 3.6-flash for a rubric-JSON task that doesn't need Pro-level reasoning. Not worth it here. |

Source: [Models | Gemini API](https://ai.google.dev/gemini-api/docs/models),
[Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing).

**Reading the pattern:** the two newest Flash generations (3.5 and 3.6) have **unified
pricing** — audio input costs the same as text/image/video. Every older tier (2.5-flash,
2.5-flash-lite, 3.1-flash-lite) still **surcharges audio 2–3x** over text. That's a concrete
reason to prefer the newest Flash, beyond "it's newest": **it's the cheapest way to send audio
to Gemini per token**, not just the most capable.

**Verdict:** `gemini-3.6-flash` is the right default. `gemini-3.5-flash` is a viable fallback
(same audio pricing, slightly pricier output) if 3.6-flash has an outage or a rubric-quality
regression; `gemini-2.5-pro` is overkill (much higher cost, no evidence the STAR/tone rubric
needs frontier reasoning); anything in the 2.x/3.1-lite tier is a false economy once the audio
surcharge is factored in.

**Aside — a real-time alternative exists but isn't a fit:** Google also has a
[**Live API**](https://ai.google.dev/gemini-api/docs/live-api/capabilities) (WebSocket,
bidirectional voice) built on `gemini-2.5-flash-native-audio`, mirroring OpenAI's Realtime API
below. It's for live back-and-forth voice conversation, not "upload one clip, get one
JSON verdict" — not a fit for this app's practice-then-review flow. Worth remembering only if
the product later grows a live mock-interview mode.

## 2. Gemma — open models, audio input?

Per the [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4) and
[Gemma 4 overview](https://ai.google.dev/gemma/docs/core):

- Gemma 4 ships in five sizes: **E2B, E4B, 12B, 26B-A4B, 31B**. Of these, **only E2B, E4B, and
  12B support audio input** (speech recognition / speech-to-translated-text). The larger
  26B-A4B and 31B variants are **text + image only**.
- Where audio is supported, it's capped at **30-second clips** — our answers (1–3 min) would
  need chunking, adding real engineering work Gemini's Interactions API doesn't require.
- Gemma is **open-weights (Apache 2.0)**, distributed via Hugging Face / GitHub, meant for
  **self-hosting** (Ollama, LM Studio, Transformers, Keras) on anything from mobile to servers.
  There is **no first-party hosted "Gemma API"** analogous to the Gemini API — Google Cloud
  offers managed *deployment* of the weights, but you still provision and pay for compute
  yourself, and audio-specific tooling (encoder, chunking, diarization) is DIY.
- If Gemma were chosen for cost or privacy reasons, it would need either (a) accepting the
  30-second-clip limit and stitching results, or (b) **falling back to text-only Gemma +
  a separate STT step** (see §4) for anything longer — i.e. Gemma text-only variants would
  force the transcribe-then-text architecture outright.

**Verdict:** not worth it for a personal project. Self-hosting a model server, working around
a 30-second audio cap, and still landing behind Gemini's Interactions-API structured output
and diarization/emotion features is a lot of yak-shaving for a "record a 2-minute answer"
use case with no cost/data-residency requirement driving the decision.

## 3. Competing multimodal models with native audio input

### OpenAI

Per [OpenAI's Models list](https://developers.openai.com/api/docs/models),
[`gpt-audio` model page](https://developers.openai.com/api/docs/models/gpt-audio), and the
[Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs):

- **`gpt-audio`** (GA, released 2026-01-19) — OpenAI's flagship general-availability audio
  model. Accepts audio input **and** output via Chat Completions, Responses API, or the
  Realtime API. 128k context, 16,384 max output tokens.
  - Pricing: **$2.50/1M text input, $10/1M text output; $32/1M audio-input tokens, $64/1M
    audio-output tokens.** At ~600 audio-input tokens/min, that's roughly **$0.019 per minute
    of input audio** — cheaper per-minute than it looks from the headline number.
  - **Structured Outputs: explicitly "Not supported"** on the `gpt-audio` model page. The
    Structured Outputs guide says the feature is available "starting with GPT-4o" for
    text/JSON-schema calls generally, but the audio-input models are absent from that
    supported list — confirmed by the model page's own feature table. This is the single
    biggest practical gap versus Gemini for our use case: we'd have to either (a) prompt for
    JSON and parse leniently (no schema guarantee), or (b) transcribe first, then send text to
    a JSON-schema-capable text model (see §4 fallback).
  - **`gpt-audio-mini`** — cheaper sibling: $0.60/1M text in, $2.40/1M text out (per
    third-party trackers citing OpenAI's published rates; not independently re-verified on the
    official page in this pass).
- **`gpt-realtime-2.1`** (and `-mini`, and legacy `gpt-realtime-1.5`) — the **Realtime API**
  family: WebSocket/WebRTC, ~320ms response times, built for **live** voice agents, not
  bounded "upload a clip" requests. OpenAI's own audio guide frames Realtime as for
  low-latency live events and Chat Completions/`gpt-audio` as the fit for "bounded request"
  batch use — i.e. Realtime is the wrong tool for our recorded-answer flow.
- **Speech-to-text-only models** (`gpt-4o-transcribe`, `gpt-4o-mini-transcribe`,
  `gpt-4o-transcribe-diarize`, `whisper-1`) are covered in §4 — these take audio in but only
  emit a transcript, not feedback.
- **Format support:** Chat Completions `input_audio` examples in OpenAI's docs use WAV;
  third-party summaries of the GPT-4o audio family also list **mp3, flac, opus, and pcm16** as
  accepted. Separately, the transcription-only endpoints (§4) accept a broader set including
  **webm** directly — notably, unlike Gemini, OpenAI's STT endpoints would accept a browser
  MediaRecorder WebM/Opus blob **with no transcoding step**.
- **Access:** API key via an OpenAI platform account (same trust tier as Gemini's AI Studio
  key) — no cloud-account overhead required for personal-project use.

### Azure OpenAI

Per [Azure OpenAI audio docs](https://learn.microsoft.com/en-us/azure/foundry-classic/openai/concepts/audio)
and [structured outputs how-to](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs):

- Re-hosts the **same underlying GPT-4o-generation audio models** (`gpt-4o-audio-preview`,
  `gpt-4o-mini-audio-preview`) through `/chat/completions`.
- Notably, **Azure's docs state these audio-preview models DO support Structured Outputs**
  (API version `2024-08-01-preview` onward) — a different (and more favorable) answer than
  OpenAI's own `gpt-audio` GA model page. This looks like a version-lineage difference (older
  `-preview` audio models vs. the newer `gpt-audio` GA model), not a contradiction — worth a
  spot-check if this project ever seriously considers OpenAI, since it suggests **structured
  output + audio input support depends heavily on which exact model/version you pick.**
  Would need re-verification if pursued.
  Access requires an **Azure subscription** (heavier than an API key) — not a natural fit for
  a personal project already using a plain Gemini API key.

### AWS Bedrock

Per [Amazon Nova 2 Sonic model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-sonic.html)
and [AWS speech-to-speech guide](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html):

- **Amazon Nova 2 Sonic** is Bedrock's audio-native model — but it's a **streaming
  speech-to-speech / bidirectional-conversation** model (like Gemini Live or OpenAI Realtime),
  not a "send one clip, get one structured response" model. Cross-modal audio+text input
  within a session is supported, but the product shape is a live conversation, not a batch
  judged-answer endpoint.
  - Limited region availability (US East/West, Tokyo only) and access is via an **AWS
    account + Bedrock model access request**, a heavier onboarding step than an API key.
- **Verdict:** doesn't fit the "record once, get a JSON verdict" shape any better than
  Realtime/Live API do, and adds AWS-account overhead for no capability gain.

## 4. Transcribe-then-text fallback (if audio-native reasoning underperforms)

If direct audio-in structured-feedback quality disappoints, the fallback architecture is:
**STT model → transcript (+ duration/word-timing) → any text LLM with JSON-schema support**
(Gemini text-only, or GPT-5.x, or Claude) for the STAR/rubric analysis. This trades away
direct tone/prosody signal for reliability of transcript-derived structure (as already flagged
in gemini-audio.md's honesty section).

| Option | Accuracy signal (official/independent) | Rough cost | Format notes |
|---|---|---|---|
| **`gpt-4o-transcribe`** / `gpt-4o-mini-transcribe` / `whisper-1` | OpenAI-published quality improvement over Whisper for `gpt-4o-transcribe`; word-level timestamps via `whisper-1`'s `verbose_json`. [Speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text) | Not itemized on the fetched page in this pass — check `/api/docs/pricing` before committing. | Accepts mp3, mp4, mpeg, mpga, m4a, wav, **webm** directly — no transcode needed for a raw MediaRecorder blob. 25 MB file limit. |
| **Deepgram Nova-3** | Deepgram's own benchmark: **5.26% WER**; an independent July-2026 multi-dataset benchmark put it at **12.3% WER** average — the two numbers disagree, self-reported vs. independent, so treat Deepgram's number as a ceiling not a guarantee. | **$0.0077/min pre-recorded** (pay-as-you-go), cheaper on Growth plan — from [deepgram.com/pricing](https://deepgram.com/pricing) (July 2026). $200 free credit, no card required. | Batch/async "Nova-3" endpoint fits our use case (upload one clip, get transcript back). |
| **AssemblyAI Universal-3.5 Pro** | AssemblyAI's own figures cite **95–98% word accuracy** on clean audio for Universal-3.5 Pro. [Pricing page](https://www.assemblyai.com/pricing) | **$0.21/hr** async (Universal-3.5 Pro), $0.15/hr for the older Universal-2; diarization add-on +$0.02/hr. $50 free credit on signup. | Purpose-built pre-recorded endpoint; diarization/PII-redaction add-ons could directly serve the "confidence/tone" side of the rubric if we ever need it text-side. |

None of these three return structured *feedback* — only a transcript (plus, for AssemblyAI/
Deepgram, word timings, confidence scores, and speaker labels) — so this path always needs a
second LLM call for the STAR/clarity rubric, same as the direct-audio path, just fed a
transcript instead of raw audio.

## Comparison table

| Model | Accepts audio input? | Formats | Structured/JSON output? | Rough cost | Access |
|---|---|---|---|---|---|
| **`gemini-3.6-flash`** (chosen) | Yes | WAV, MP3, AIFF, AAC, OGG-Vorbis, FLAC (no WebM/Opus) | **Yes** — JSON Schema via `response_format` | $1.50/1M in, $7.50/1M out (audio = text rate) | API key (Google AI Studio) |
| `gemini-3.5-flash` | Yes | Same as above | Yes | $1.50/1M in, $9.00/1M out | API key |
| `gemini-2.5-flash` / `-lite` / `gemini-3.1-flash-lite` | Yes | Same as above | Yes | Base rate + 2–3x audio surcharge | API key |
| `gemini-2.5-pro` | Yes | Same as above | Yes | $1.25–2.50/1M in, $10–15/1M out | API key |
| Gemma 4 (E2B/E4B/12B) | Yes, ≤30s clips only | Model-dependent, self-managed | Not documented; DIY prompting | Free weights + your own compute | Self-host only (Apache 2.0, HF/GitHub) |
| Gemma 4 (26B-A4B/31B) | **No — text/image only** | — | — | Free weights + your own compute | Self-host only |
| **OpenAI `gpt-audio`** | Yes | WAV/MP3/FLAC/Opus/PCM16 (Chat Completions) | **No** — not supported on this model | $32/1M audio-in, $64/1M audio-out (~$0.019/min in) | API key |
| OpenAI `gpt-realtime-2.1` | Yes (streaming) | Real-time audio stream | Not the target use case | ~$0.06–0.11/min typical agent session | API key |
| Azure OpenAI `gpt-4o-audio-preview` | Yes | Same GPT-4o family formats | Reportedly yes (per Azure docs; version-dependent) | Azure consumption pricing | Azure subscription |
| AWS Bedrock Nova 2 Sonic | Yes (streaming speech-to-speech) | Streaming audio only | Not the target use case | Bedrock consumption pricing | AWS account + model access request |
| `gpt-4o-transcribe` (STT only) | Yes (transcribe only) | mp3/mp4/mpeg/mpga/m4a/wav/**webm** | N/A — transcript only | See OpenAI pricing page | API key |
| Deepgram Nova-3 (STT only) | Yes (transcribe only) | Common audio containers | N/A — transcript only | $0.0077/min pre-recorded | API key |
| AssemblyAI Universal-3.5 Pro (STT only) | Yes (transcribe only) | Common audio containers | N/A — transcript only | $0.21/hr async | API key |

## Recommendation

- **Yes, Gemini is still the right pick**, and specifically **`gemini-3.6-flash`**: it's the
  only option in this comparison that combines (a) native audio input, (b) genuine JSON-schema
  structured output, and (c) audio priced the same as text — all behind a simple API key, no
  cloud account. `gemini-3.5-flash` is the one credible same-family fallback if 3.6-flash has
  problems; nothing else in the Gemini lineup, Gemma, or a competing provider beats it for this
  specific "one clip in, one JSON verdict out" shape.
- **Gemma is off the table** for this project unless self-hosting or data residency becomes a
  requirement — the 30-second audio cap and lack of a hosted API make it strictly more work
  for less capability here.
- **OpenAI's `gpt-audio` is the most credible alternative** and worth remembering if Gemini's
  pricing, availability, or org policy ever changes — but **today it cannot do audio-in +
  structured-JSON-out in one call**, which is the exact thing this app needs. That gap is the
  one finding here that would actually change the map's decisions if it were reversed.
- **Nothing found here should change the current stack decision (ticket 004)** or the format
  strategy (ticket 007) — Gemini's format restrictions (no WebM/Opus) stand distinct from
  OpenAI's, which is a point in OpenAI's favor if this project ever pivots providers, but not
  enough on its own to justify switching given the structured-output gap above.
- **Worth flagging for ticket 002 (rubric):** if audio-native feedback quality is ever found
  wanting in practice, the documented fallback (transcribe with `gpt-4o-transcribe` or Deepgram
  Nova-3, then feed transcript + duration to any JSON-schema-capable text LLM) is a proven,
  well-priced escape hatch — worth keeping in mind as a design option, not urgent to build now.

## Sources

- [Models | Gemini API](https://ai.google.dev/gemini-api/docs/models)
- [Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Audio understanding | Gemini API](https://ai.google.dev/gemini-api/docs/audio)
- [Live API capabilities guide | Gemini API](https://ai.google.dev/gemini-api/docs/live-api/capabilities)
- [Gemma 4 model card | Google AI for Developers](https://ai.google.dev/gemma/docs/core/model_card_4)
- [Gemma 4 model overview | Google AI for Developers](https://ai.google.dev/gemma/docs/core)
- [Models | OpenAI API](https://developers.openai.com/api/docs/models)
- [GPT Audio Model | OpenAI API](https://developers.openai.com/api/docs/models/gpt-audio)
- [Structured outputs | OpenAI API](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Audio and speech | OpenAI API](https://developers.openai.com/api/docs/guides/audio)
- [Speech to text | OpenAI API](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Azure OpenAI audio (classic) | Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry-classic/openai/concepts/audio)
- [Structured outputs — Azure OpenAI | Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs)
- [Amazon Nova 2 Sonic model card | AWS Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-sonic.html)
- [Speech-to-Speech (Amazon Nova 2 Sonic) | AWS](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html)
- [Deepgram pricing](https://deepgram.com/pricing)
- [AssemblyAI pricing](https://www.assemblyai.com/pricing)
