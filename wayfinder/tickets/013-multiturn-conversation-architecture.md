# Multi-turn conversational architecture with Gemini

- Type: wayfinder:research
- Status: open
- Assignee: (unclaimed)
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
