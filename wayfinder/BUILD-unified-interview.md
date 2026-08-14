# Build — unified Starling interview

Implementation handoff for [`map-unified-interview.md`](map-unified-interview.md). Spec tickets
018–027 are **closed** (decisions written). This doc tracks **code** — what is done, what to build
next, and what waits until after v1 ships.

> **Do not follow** [`BUILD-seniority-mode.md`](BUILD-seniority-mode.md) — that path (two tabs +
> Gemini Live) is superseded.

## What's done today

| Step | Ticket | State |
|------|--------|-------|
| Monorepo + `@starling/bank` | [027](tickets/027-monorepo-packages-layout.md) | **Done** — `packages/{client,server,bank}` |
| Bank content (v1 minimum) | [025](tickets/025-author-technical-trees-altium.md), [026](tickets/026-convert-seniority-seeds-to-trees.md), [018](tickets/018-unified-question-bank-schema.md) | **Done** — 21 behavioral + 5 technical + 5 seniority trees in `packages/bank` |
| Behavioral drill (partial) | [006](tickets/006-build-vertical-slice.md) | **Done** — practice loop on behavioral trees only; `/api/feedback` works |

**Still the old app shape:** Seniority Live path still in the tree (unreachable from the shell); no
`pick-follow-up`, no unified end report.

## §1 — Implementation roadmap (do now)

From [024 §Suggested build order](tickets/024-migration-retire-tabs-and-live-api.md). Step 2
**excludes** [028](tickets/028-enrich-expand-technical-trees.md) — five technical trees are
enough to fill Frontend technical / Full senior loop for v1.

| # | Work | Spec |
|---|------|------|
| 1 | ~~Monorepo + bank~~ | [027](tickets/027-monorepo-packages-layout.md) |
| 2 | ~~Unified shell + session machine~~ — drop `AppShell` from entry; `profiles.ts`; start screen; Behavioral drill Practice\|Simulation; progress chrome; End session. Live files remain but are unreachable. Follow-up picker + end-report UI still later. | [020](tickets/020-unified-session-flow-ux.md), [019](tickets/019-interview-profile-config.md) |
| 3 | **APIs** — `POST /api/pick-follow-up`; technical feedback path; seniority audio deep dive (022 schema); summary assembler | [021](tickets/021-ai-follow-up-picker.md), [023](tickets/023-technical-answer-rubric.md), [022](tickets/022-unified-end-report-contract.md) |
| 4 | **End-report UI** — summary first, deep dives per category; plain labels; hide frame tags | [022](tickets/022-unified-end-report-contract.md), wireframes [020](prototypes/020-session-flow-wireframes.md) |
| 5 | **Delete Live + tabs** — see [024 Delete table](tickets/024-migration-retire-tabs-and-live-api.md); drop client `@google/genai`, PCM, `/api/live-token`, `interviewer.ts` (after seed text is in bank) | [024](tickets/024-migration-retire-tabs-and-live-api.md) |
| 6 | **Smoke** — Behavioral drill (Practice + Simulation); one `endReport` profile with mixed categories; no WebSocket traffic | [024](tickets/024-migration-retire-tabs-and-live-api.md) |

### Keep / refactor / delete (quick ref)

**Spine:** WAV pipeline, `/api/feedback`, `FeedbackPanel`, guided record → review → submit.

**Delete:** `AppShell`, Live client (`liveSession`, `useInterviewSession`, `ConversationScreen`,
`SeniorityMode`), `/api/live-token`, `interviewer.ts`, `pcm.ts`, client `@google/genai`.

Full file lists: [024 Answer](tickets/024-migration-retire-tabs-and-live-api.md).

### Checks

```sh
npm install
npm run check
npm run test
npm run dev:server   # :8787
npm run dev:client   # :5173
```

## §2 — Post-implementation (after §1 ships)

Do these **after** unified v1 runs end-to-end. Not blockers for §1.

| Order | Ticket | What |
|-------|--------|------|
| A | [028 — Enrich and expand technical question trees](tickets/028-enrich-expand-technical-trees.md) | Bigger technical pools + more `tech-*` trees so sessions do not repeat the same five |
| B | [029 — Persist unified interview sessions](tickets/029-persist-unified-sessions.md) | Extend [010](tickets/010-persist-attempt-history.md) for multi-part sessions + end report in `localStorage` |
| C | [030 — Author behavioral follow-up pools](tickets/030-author-behavioral-follow-up-pools.md) | Follow-ups on the 21 behavioral trees so Culture-fit / Full senior loop can probe STAR answers |

**Still fog (not ticketed):** JD-driven profiles, `system-design` category, live coding segment,
follow-up pool authoring guide, deployment, attempt trends UI.
