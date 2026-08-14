# Persist unified interview sessions

- Type: wayfinder:grilling
- Status: open
- Assignee:
- Blocked by: implementation (see [BUILD-unified-interview.md §1](../BUILD-unified-interview.md))
- Parent: wayfinder/map-unified-interview.md

## Question

Extend [010 — Persist attempt history](010-persist-attempt-history.md) for **unified** Starling
(after [BUILD-unified-interview.md §1](../BUILD-unified-interview.md) ships):

- **Behavioral drill** (`perAttempt`): keep 010's `{ id, questionId, timestamp, feedback }` shape
  (feedback JSON only — no audio, no transcript).
- **Full-session profiles** (`endReport`): what to store — profile id, tree ids + part ids
  answered, category mix, end report JSON ([022](022-unified-end-report-contract.md)), timestamp?
- **Storage:** still `localStorage`, single-machine, no backend (010's rules).
- **Retention / delete:** keep forever + user bulk delete, or same as 010?
- **History UI:** plain list in v1, or silent save only (like seniority 017 fog)?
- **Relation to trends fog** — still separate?

Deliverable: pinned data model + write/read rules; implementation is code work post-spec.
