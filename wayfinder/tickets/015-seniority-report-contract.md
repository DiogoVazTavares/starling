# Seniority feedback report contract

- Type: wayfinder:grilling
- Status: open
- Assignee: Diogo Vaz
- Blocked by: 012
- Parent: wayfinder/map-seniority-mode.md

## Question

What does the **end-of-session report** look like — the payoff of the whole conversation? This is
the seniority-mode analogue of ticket 002's behavioral rubric, but it grades a *multi-turn
interview*, not one answer. It needs the competency model (012) to score against.

The three coaching signals the user chose:

- **Seniority-ladder scoring.** Where did the session land on the 012 ladder (Lead Yourself / Team /
  Business, generalized)? Per-rung, holistic, or both? Scored 1–5 like the behavioral rubric, or a
  different shape? Note per level.
- **Probe decode.** Per question, a *"what this was really measuring → what you did → the senior
  move"* breakdown — the single most valuable artifact from the Zendesk analysis. What's the shape
  (one entry per interviewer turn)? How much of the transcript does it reference?
- **Hedge & "we vs I" flags.** Surface hedges/self-deprecation ("not my area", "I guess"), and the
  "we" vs "I" ratio. **Where is this computed** — Gemini over the full transcript, or a client-side
  heuristic on a transcript? (Tie to 013's transcription decision.) How honest about approximation
  (echo 002's caveat that delivery signals are impressions, not hard metrics)?

Also decide: a **frames-accepted** signal (did the candidate push back on diminishing frames, per
012's catalogue)? Overall summary + a few concrete "next interview" fix-its (no full model
answers, per 002)? Tone — direct but constructive, matching 002.

Deliverable: the report rubric + the JSON contract Gemini must return (kept within its supported
flat-schema subset, per ticket 001), recorded in the ticket answer. This is the contract 017 (UX)
renders.
