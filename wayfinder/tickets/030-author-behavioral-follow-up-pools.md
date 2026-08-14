# Author behavioral follow-up pools

- Type: wayfinder:task
- Status: open
- Assignee:
- Blocked by: implementation (see [BUILD-unified-interview.md §1](../BUILD-unified-interview.md))
- Parent: wayfinder/map-unified-interview.md

## Question

Today the 21 behavioral trees in `@starling/bank` have **`followUps: []`** ([018](018-unified-question-bank-schema.md)
decision B1). The AI follow-up picker ([021](021-ai-follow-up-picker.md)) therefore stops after
the main question — no STAR probes on Culture-fit screen or other behavioral-heavy profiles.

After unified v1 ships, author **follow-up pools** for behavioral trees:

- At least the trees most likely to appear on **Culture-fit screen** and **Full senior loop**
  ([019](019-interview-profile-config.md)) — STAR depth probes (situation clarity, ownership,
  result/metrics, relevance), not seniority-frame catalogue (that stays on `seniority` trees).
- Use `required`, `tags` per [021](021-ai-follow-up-picker.md) / [research/follow-up-picker.md](../research/follow-up-picker.md).
- Schema unchanged ([018](018-unified-question-bank-schema.md)); update `packages/bank/src/behavioral.ts`.

Deliverable: enriched trees in the bank; list of tree ids touched. Not a picker or UI change.
