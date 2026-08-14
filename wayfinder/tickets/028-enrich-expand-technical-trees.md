# Enrich and expand technical question trees

- Type: wayfinder:task
- Status: open
- Assignee:
- Blocked by: implementation (see [BUILD-unified-interview.md §1](../BUILD-unified-interview.md))
- Parent: wayfinder/map-unified-interview.md

> **Deferred:** not required for unified v1 — five technical trees in the bank are enough to
> fill presets. Do this in [BUILD §2](../BUILD-unified-interview.md) after §1 ships.

## Question

Grow the technical bank beyond the first Altium-inspired screen set
([025](025-author-technical-trees-altium.md) /
[`assets/025-technical-trees.ts`](../assets/025-technical-trees.ts)):

1. **Enrich** the five existing trees — add follow-ups (and tighten tags / `required` flags)
   so pools stay useful under the picker contract ([021](021-ai-follow-up-picker.md):
   `maxFollowUps=2`, must-ask probes before `done`). Use the Altium spoken portion and other
   real interviews as **inspiration**, not as a fixed replay script.
2. **Author more** technical trees (new `tech-*` ids) that fit a frontend / full-stack spoken
   screen — enough variety for random fill on Frontend technical and Full senior loop
   ([019](019-interview-profile-config.md)) without repeating the same five every session.

Keep schema from [018](018-unified-question-bank-schema.md). Still **not** wiring into the app
(drop-in asset only; packaging stays with bank / [027](027-monorepo-packages-layout.md)).

Deliverable: updated asset (extend 025’s file or add a sibling under `wayfinder/assets/`) with
enriched pools + new trees; list of new tree ids in the answer.
