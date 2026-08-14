# Convert seniority seeds to question trees

- Type: wayfinder:task
- Status: closed
- Assignee: Auto (Cursor agent)
- Blocked by: 018
- Parent: wayfinder/map-unified-interview.md

## Question

Convert the five **opening seeds** in `client/src/seniority/seeds.ts` (from
[`016`](../tickets/016-scenario-role-seeding.md)) into **seniority-category trees**: each seed's
`opening` becomes the main part; author a **follow-up pool** from [`012`](../tickets/012-seniority-competency-model.md)
diminishing-frame catalogue and [`014`](../tickets/014-interviewer-persona-protocol.md) probe
patterns — pre-authored, not live-generated.

Deliverable: five tree entries per bank schema [018](018-unified-question-bank-schema.md), covering
the failure catalogue. Live persona protocol (014) is **authoring inspiration only**; the unified
product does not run Live API in session.

## Answer

Authored 2026-08-14. Five `QuestionTree` entries live in
[`wayfinder/assets/026-seniority-trees.ts`](../assets/026-seniority-trees.ts)
(`SENIORITY_TREES_V1`). Schema matches [018](018-unified-question-bank-schema.md). Not wired into
the app.

**Source note:** the five seeds live in `server/src/interviewer.ts` (`SEED_BANK`) — they were moved
off `client/src/seniority/seeds.ts` when Live instructions became server-side. Live
“Open by inviting…” lines are rewritten as **fixed on-screen** `main.text` (018 **S1**).

| Tree id | Theme | Main (gist) | Required follow-up | Pool size | Failure classes (016 audit) |
|---------|-------|-------------|--------------------|-----------|-----------------------------|
| `seniority-proud-of` | `proud-of` | Proud-of / best work (wide open) | own-role | 6 | F3, F6, A2 (+ frame for A5) |
| `seniority-disagreement` | `disagreement` | Disagreed with a made decision — what you did | your-move | 6 | F1, F2, A1 (+ frame for A5) |
| `seniority-went-wrong` | `went-wrong` | Owned work that went sideways — full arc | your-agency | 6 | A4, A1, A3, F4 (+ frame for A5) |
| `seniority-ambiguous` | `ambiguous` | Move forward with no clear direction/owner | how-you-decided | 6 | F5, Tier-3, A4 (+ frame for A5) |
| `seniority-changed-how` | `changed-how` | Changed how team/org did something | your-role | 6 | F3, F5 (+ frame for A5) |

**Coverage:** every 012 frame (F1–F6) and anti-signal (A1–A5) is targeted by ≥1 follow-up across
the bank (same acceptance criterion as 016 §4). Frame-shaped follow-ups use warm-summary /
“is that fair?” wording from 014’s register, as **written questions** the picker can select after
audio — not Live improvisation.

**Authoring rules used**

- Train the **class** of seniority screens; no company, Zendesk, or STAR content copied.
- Ids: `seniority-<seed-id>` trees; `${treeId}-main` / `${treeId}-<slug>` questions (018).
- Pools unordered and larger than `maxFollowUps=2` (021); one `required: true` ownership/agency
  probe per tree; tags are soft picker hints (`frame`, `ownership`, `tier-reach`, …). Frame
  family names stay out of user-facing question text (map Notes — plain English only in UI).
- Fills seniority slots for Culture-fit, Frontend technical, and Full senior loop
  ([019](019-interview-profile-config.md)).

No new tickets. Fog unchanged.
