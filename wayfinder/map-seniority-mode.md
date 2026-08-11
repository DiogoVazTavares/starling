<!-- label: wayfinder:map -->

# Map: Seniority / culture-fit interview mode

## Destination

A **build-ready spec** (plan-only) for a **new "seniority / culture-fit" mode in Starling** —
a second tab alongside the existing behavioral trainer. The mode runs a **multi-turn
conversational mock interview**: Gemini plays an interviewer that asks, listens to a spoken
answer, reacts, probes, insists, and hands the candidate *diminishing frames* to push back on.
At the end it produces a **seniority report** that:

- scores the session on a seniority ladder (Zendesk's **Lead Yourself / Lead the Team / Lead the
  Business** is the inspiration, generalized);
- **decodes what each question was really measuring** (the probe behind the casual question);
- **flags hedges and "we vs I"** language.

The map is done when the way to *build* this mode is clear — the tickets are then **handed off**
for implementation (this map decides, it does not build).

## Notes

- **Plan-only.** Unlike the original vertical-slice map ([`map.md`](map.md)), this map does **not**
  carry execution. Tickets resolve decisions and produce specs; a separate effort builds them.
- **Train the class, not the case.** The Zendesk interview and Diogo's STAR story bank are
  **inspiration only** — never hardcoded content. Overfitting to a specific company / interviewer
  / question set is explicitly out of scope: that interview will not recur, and the goal is to get
  better at *this kind* of screen in general.
- **A second mode, not a rewrite.** The behavioral trainer (record one answer → rubric feedback)
  stays exactly as it is. This adds a parallel mode; the two coexist behind tab navigation.
- **The core failures this mode trains** (from the Zendesk feedback): accepting diminishing frames
  instead of reframing; failing to surface leadership evidence unprompted; hedging /
  self-deprecation; saying "we" instead of "I"; not reading what a casual question is measuring.
- Source material for inspiration: the interview feedback doc (Zendesk handoff, lives in the `cv`
  repo scratchpad) and the STAR bank on Diogo's CV.
- Skills to consult when resolving tickets: `/grilling`, `/domain-modeling`, `/research`,
  `/prototype`, `/impeccable` (UI).
- Local-markdown tracker convention (same as [`map.md`](map.md)): tickets are
  `wayfinder/tickets/NNN-slug.md` with a `Parent:` header pointing here; blocking via `Blocked by:`;
  claim via `Assignee:`; resolve by appending `## Answer`, setting `Status: closed`, and adding a
  line to Decisions-so-far.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- [013 — Multi-turn conversational architecture with Gemini](tickets/013-multiturn-conversation-architecture.md)
  — use the Gemini **Live API** (stateful WebSocket): persona held server-side via
  `systemInstruction`, interviewer replies as **native speech**, both sides transcribed
  automatically, ephemeral-token direct connection, ~$0.12/session. New streaming pipeline on a
  `-live` model, separate from the behavioral mode's batch stack.
  [(details)](research/multiturn-conversation.md)
- [012 — Competency model for seniority/culture-fit screens](tickets/012-seniority-competency-model.md)
  — a **coaching lens, not a hiring rubric**: a target-agnostic 3-tier scope-of-leadership ladder
  (Lead Self / Lead Others / Lead the Business), scored as a per-tier `absent/emerging/demonstrated`
  evidence profile on one axis — *owned + specific + first-person evidence*. Plus a six-family
  diminishing-frame catalogue (each tagged with the tier it strips) and a five-family anti-signal
  list (flagged with quotes, not scored). The shared vocabulary 014 and 015 build on.
- [015 — Seniority feedback report contract](tickets/015-seniority-report-contract.md)
  — the report is a **separate batch call over the transcript** (`gemini-3.6-flash` + Interactions +
  `response_format`, *not* the Live session) — text only, so vocal delivery isn't graded, but it's
  re-runnable over stored transcripts. Contract: a prose `headline` (no ladder enum) + three tier
  cards `{tier, level, note, quote}`; a **probe decode** (one entry per interviewer question,
  `{measuring, whatYouDid, seniorMove, frame}`, senior-move as strategy not script per 002); a
  **`framesFaced` scoreboard** ("reframed N of M", count not rate); **anti-signal flags**
  `{type, quote, note}` computed by Gemini (no client heuristic, **no we/I ratio**); `overallSummary`
  + 1–3 `fixIts`; **no** holistic gate flag. Flat enum-based JSON per 001. The contract 017 renders.
- [014 — Interviewer persona & conversation protocol](tickets/014-interviewer-persona-protocol.md) —
  **one fixed persona** (a manager ~2 levels up), **warm-but-specific** pressure, never hostile.
  Governing rule: *the interview is realistic, the report is the teacher* — nothing scored, named, or
  coached in-session. Frames land as **warm generous summaries** (register **never hardens**), aimed
  by live evidence, offered ≤2× then dropped; **on a full fold the interviewer drops it and pivots**
  (no in-session correction). Ending is **floor-bounded coverage** (keep finding new ground to a ~6-turn
  floor, capped by 013's 15-min ceiling) so a fold-everything session still runs full-length. Pinned
  against a scripted session: [prototypes/014-scripted-session.md](prototypes/014-scripted-session.md).
  Unblocks 016.

## Open tickets

<!-- the frontier: open + unblocked + unassigned -->

- [016 — Opening-scenario / interviewer-role seeding](tickets/016-scenario-role-seeding.md)
  — unassigned, now unblocked (014 closed). **(frontier)**
- [017 — Two-tab navigation + live-conversation UX](tickets/017-two-tab-conversation-ux.md)
  — unassigned, now unblocked (014 + 015 closed). **(frontier)**

## Not yet specified

<!-- in-scope fog; graduates into tickets as the frontier advances -->

- **Persisting & comparing seniority reports over time** — tracking whether the diminishing-frame /
  hedge habits improve across sessions. Ties into the original map's attempt-history fog.
- **Optional personalization from the real STAR bank** — later, the mode could ingest Diogo's actual
  stories (from the `cv` repo) to coach evidence-selection. Deliberately deferred: inspiration only
  for now, to avoid overfitting.

## Out of scope

<!-- ruled beyond the destination; never graduates -->

- **Overfitting to the specific Zendesk interview** — no hardcoded company, interviewer persona, or
  fixed question set drawn 1:1 from that screen. Ruled out per the destination.
- **Building the mode in this effort** — this map is plan-only; implementation is a separate effort.
- **Turning Starling into a multi-user or distributable product** — inherited from
  [`map.md`](map.md); still a personal tool.
