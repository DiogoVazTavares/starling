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

## Open tickets

<!-- the frontier: open + unblocked + unassigned -->

- [012 — Competency model for seniority/culture-fit screens](tickets/012-seniority-competency-model.md)
  — unassigned. **(frontier)**
- [014 — Interviewer persona & conversation protocol](tickets/014-interviewer-persona-protocol.md)
  — blocked by 012.
- [015 — Seniority feedback report contract](tickets/015-seniority-report-contract.md)
  — blocked by 012.
- [016 — Opening-scenario / interviewer-role seeding](tickets/016-scenario-role-seeding.md)
  — blocked by 012, 014.
- [017 — Two-tab navigation + live-conversation UX](tickets/017-two-tab-conversation-ux.md)
  — blocked by 014, 015.

## Not yet specified

<!-- in-scope fog; graduates into tickets as the frontier advances -->

- **Persisting & comparing seniority reports over time** — tracking whether the diminishing-frame /
  hedge habits improve across sessions. Ties into the original map's attempt-history fog.
- **Optional personalization from the real STAR bank** — later, the mode could ingest Diogo's actual
  stories (from the `cv` repo) to coach evidence-selection. Deliberately deferred: inspiration only
  for now, to avoid overfitting.
- **Interviewer difficulty / adaptivity** — whether the interviewer scales pressure to the
  candidate's level. Hangs on 014.

## Out of scope

<!-- ruled beyond the destination; never graduates -->

- **Overfitting to the specific Zendesk interview** — no hardcoded company, interviewer persona, or
  fixed question set drawn 1:1 from that screen. Ruled out per the destination.
- **Building the mode in this effort** — this map is plan-only; implementation is a separate effort.
- **Turning Starling into a multi-user or distributable product** — inherited from
  [`map.md`](map.md); still a personal tool.
