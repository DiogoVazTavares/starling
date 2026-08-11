# Multi-turn conversational architecture with Gemini

- Type: wayfinder:research
- Status: closed
- Assignee: Diogo Vaz
- Blocked by: (none)
- Parent: wayfinder/map-seniority-mode.md

## Question

The existing slice is **one-shot**: record → mono/16 kHz WAV → single Gemini call → feedback
(tickets 001/006/007). A live mock interview is **multi-turn**. Can Gemini support that shape, and
what does the architecture look like? This is a feasibility + shape question that de-risks the whole
mode; it revisits assumptions in tickets 001 (Gemini audio API), 007 (audio format), and 009
(`@google/genai` SDK / Interactions API).

- **Session vs replayed history.** Does the Interactions API (GA June 2026, per ticket 009) support
  a stateful multi-turn session that carries a persona + prior turns, or must we re-send the
  conversation history (text and/or audio) on each turn? What are the token/cost implications of
  each over a ~6-turn interview?
- **Interviewer output modality.** Does the interviewer reply as **text** (rendered on screen) or as
  **synthesized speech** (TTS, more realistic)? If TTS: what produces it, latency, cost, and does it
  change the format strategy from ticket 007?
- **User answers across turns.** Is each spoken answer transcribed per-turn to feed back as context,
  or is raw audio carried forward? Does the mode need transcription (e.g. `gpt-4o-transcribe` /
  Deepgram, noted as the fallback in tickets 002/008) that the one-shot mode avoids?
- **Persona persistence.** How does the interviewer hold a consistent persona + hidden agenda (probe
  for the competency model from 012) across turns without drifting or breaking character?
- **Latency budget.** The slice runs ~9 s per attempt. What's a realistic per-turn round-trip for a
  conversation to feel live, and does it force any architecture choice (streaming, shorter turns)?
- **Cost.** Rough per-session cost for a ~6-turn audio interview, to sanity-check viability.

Deliverable: a markdown research asset (in `wayfinder/research/`) + a recommended conversation
architecture, linked from this ticket's answer. This informs 014 (protocol) and 017 (UX — whether
the interviewer speaks, whether turns stream).

## Answer

**Feasible, and the shape is the Gemini Live API — not replayed history.** Full findings +
architecture: [research/multiturn-conversation.md](../research/multiturn-conversation.md).

The Live API is a **stateful WebSocket** session built for exactly this: a spoken back-and-forth
where the persona + prior turns live server-side and are **not** re-sent each turn.

- **Session vs replayed history → Live session.** Persona/agenda set once in the setup
  `systemInstruction`, held server-side for the connection. Replaying history over the
  Interactions API is possible (stateful `previous_interaction_id`, or stateless resend) but loses
  live turn-taking and grows audio cost each turn. Live wins; the Interactions/replay path is kept
  documented only as the fallback if the `-preview` tier proves unstable.
- **Interviewer output → native speech.** Live's native-audio models reply as **synthesized
  speech** (24 kHz PCM), with a prebuilt `voiceName` matched to the persona — the realism the mode
  is for. Standalone TTS models exist but are for recitation, not conversation; not the path.
- **User answers → streamed 16 kHz PCM, transcribed per-turn for free.** Live has **built-in input
  transcription** (and output transcription), so no separate STT (`gpt-4o-transcribe`/Deepgram)
  is needed — the transcription tickets 002/008 named as a fallback is first-party here.
- **Persona persistence → session `systemInstruction`**, no per-turn re-priming (no drift).
- **Latency → no published numbers.** Live is designed for low latency (3.1-flash-live defaults
  `thinkingLevel: minimal`); the one-shot ~9 s is a batch figure and irrelevant. Spike to confirm
  it *feels* live before committing 017's UX.
- **Cost → ~$0.12** for a ~6-turn, ~10-min session. Negligible.

**Recommended architecture:** Live API (`BidiGenerateContent` WebSocket) via `@google/genai`;
model **`gemini-3.1-flash-live-preview`** (native audio out), exact-pinned; browser connects
**direct** to Gemini authed by a **backend-minted ephemeral token** (one new `/live-token`
endpoint — backend stays thin, no audio relay); **input + output transcription** on; **session
resumption** + `GoAway` handling so a dropped connection is invisible.

**Two caveats, both manageable:**

1. **New pipeline, new model.** This mode runs a streaming Live pipeline on a `-live` model —
   distinct from the behavioral mode's batch `gemini-3.6-flash` + Interactions stack (006/009),
   which is **unchanged**. Ticket 007's WAV-blob-to-HTTP-proxy pipeline does **not** apply here.
2. **`-preview` tier + 15-min session cap.** The Live models are `-preview`, re-introducing the
   preview-surface risk ticket 009 avoided — mitigate with the same exact-pin discipline and the
   documented Interactions fallback; **re-check live-model names at build time**. Audio sessions
   cap at 15 min (connection ~10 min); a ~6-turn screen fits, so resumption is robustness, not a
   core need — *unless* 014's protocol runs long, then reconnection becomes load-bearing.

**Hands to the map:** 014 gets its persona mechanism (`systemInstruction` + voice) and a turn
budget (~6 turns inside 15 min); 015 gets a free per-turn transcript of both sides to score
against; 017 gets "interviewer speaks, turns stream, reconnects stay invisible." The "should the
multi-turn pipeline upgrade the one-shot behavioral mode?" fog resolves toward **no** — Live is a
poor fit for the batch one-clip→one-verdict flow.
