# Migration plan — retire tabs, Live API, and dual-mode code

- Type: wayfinder:task
- Status: closed
- Assignee: Auto
- Blocked by: 020, 022
- Parent: wayfinder/map-unified-interview.md

## Question

Produce an explicit **keep / refactor / delete** list for the current codebase when moving to
unified Starling:

- `client/src/AppShell.tsx` — two tabs
- `client/src/seniority/*` — Live session machine, ConversationScreen, mock script
- `server/src/interviewer.ts`, `/api/live-token` — ephemeral token / Live API
- `client/src/App.tsx` + `usePracticeSession.ts` — behavioral loop (what merges into unified flow
  vs Behavioral drill profile)
- `client/src/questions.ts` — migration into `@starling/bank` (see [018](018-unified-question-bank-schema.md), [027](027-monorepo-packages-layout.md))

Record surprises, file-level checklist, and suggested build order for the implementation handoff.
No code changes in this ticket — decision + checklist only.

Depends on session UX [020](020-unified-session-flow-ux.md) and report contract [022](022-unified-end-report-contract.md).

## Answer

Pinned 2026-08-14 from a full pass over `client/src` + `server/src` against [020](020-unified-session-flow-ux.md) and [022](022-unified-end-report-contract.md). **No code changed** in this ticket — checklist only.

### Surprises

1. **Seeds are not on the client.** [026](026-convert-seniority-seeds-to-trees.md) still points at `client/src/seniority/seeds.ts`. The bank lives in **`server/src/interviewer.ts`** as `SEED_BANK` (moved with the Live persona). Ticket 026 body corrected to match.
2. **`BUILD-seniority-mode.md` is stale.** It still calls `/api/live-token` a 501 stub and `useInterviewSession` a mock script. Live is real (`liveSession.ts` + `mintLiveToken`). Treat the BUILD doc as historical; do not follow its build order.
3. **Behavioral attempt persistence (010) is not in the client.** Only seniority `localStorage` (`starling.seniority.sessions`) exists. Unified persistence stays fog on the map.
4. **Client `@google/genai` is Live-only.** Behavioral path talks HTTP to Hono. Drop the client SDK dep when Live goes.
5. **`audio/pcm.ts` (+ test) is Live-only** (16 kHz stream up / decode down). The keep path is WAV (`wav.ts` / `wav-encoder.ts` / `useRecorder.ts`), not PCM.
6. **Seniority report today is transcript-in, old 015 names.** [022](022-unified-end-report-contract.md) needs **audio-in** + renamed schema; `ReportScreen` still shows frame tag names — must hide them in UI.

### Keep (reuse as-is or with light wiring)

| Area | Files | Why |
|------|-------|-----|
| WAV audio pipeline | `client/src/audio/useRecorder.ts`, `wav.ts`, `wav-encoder.ts`, `base64.ts` | Proven 007 path for every Question |
| Behavioral feedback types + call | `client/src/api.ts`, `server/src/gemini.ts`, `server/src/rubric.ts`, `POST /api/feedback` | Drill `perAttempt` + end-report layer-1 behavioral trees |
| Feedback UI | `client/src/FeedbackPanel.tsx` (+ CSS) | Drill after each Question ([020](020-unified-session-flow-ux.md)) |
| Question prompt text | `client/src/questions.ts` **content** | Fold into `@starling/bank` trees ([018](018-unified-question-bank-schema.md) / [027](027-monorepo-packages-layout.md)); file itself goes away after move |
| Seed *content* | `SEED_BANK` openings in `server/src/interviewer.ts` | Authoring input for [026](026-convert-seniority-seeds-to-trees.md) (rewrite as fixed on-screen mains) |
| Competency / rubric prose | Ideas inside `server/src/seniority-rubric.ts` | Keep as prompt material; **schema + field names** refactor per 022 |
| Thin Hono + key story | `server/src/index.ts` shell, `/api/health`, `getClient` / `MODEL` | Same proxy pattern for new endpoints |
| Global styles / brand | `client/src/index.css` | Single-entry shell still needs base styles |

### Refactor (merge into unified product)

| Area | Files | Target |
|------|-------|--------|
| Entry | `client/src/main.tsx` | Mount one unified app root (no `AppShell`) |
| Practice loop → session machine | `client/src/App.tsx`, `usePracticeSession.ts`, `App.module.css` | **Core of unified flow** ([020](020-unified-session-flow-ux.md) phase machine). Keep guided-steps record/review/submit. Add: start (profiles + Practice\|Simulation), progress chrome, `picking`, tree loop, End session, `analyzing` → end report. **Behavioral drill** = this machine with `reportMode: perAttempt` + optional tree pick — not a separate mode |
| Nav model | Previous/Next across flat bank in `App.tsx` | **Retire** as primary nav. Session order = profile slots; progress = `Tree N of M · Category · Question K` |
| Profiles | _(new)_ `client/src/profiles.ts` | [019](019-interview-profile-config.md) presets |
| Question bank | `questions.ts` → `@starling/bank` | [027](027-monorepo-packages-layout.md); also absorb [025](025-author-technical-trees-altium.md) asset + [026](026-convert-seniority-seeds-to-trees.md) / [028](028-enrich-expand-technical-trees.md) |
| Seniority report types | `client/src/seniority/report.ts`, `server/src/seniority-rubric.ts` | Rename to 022 schema (`scopeEvidence`, `questionBreakdown`, …; tier/level enums). Drop Live `TranscriptTurn` as the report input shape |
| Seniority report call | `server/src/seniority.ts`, `POST /api/seniority-report`, `client/src/seniority/api.ts` `requestSeniorityReport` | Become **session audio + question metadata** → renamed deep dive (022 layer 2). May move beside new end-report assembler rather than stay under `seniority/` |
| Report UI | `client/src/seniority/ReportScreen.tsx` (+ CSS) | Become **end-report screen**: summary first, then deep dives; plain labels; **no frame tags in UI**. Drill does not use this screen |
| Start UX ideas | `client/src/seniority/StartScreen.tsx` | Replace with 020 radio-list start (profile + stance + optional drill tree). Do not keep Live “Begin interview” copy |
| Persistence pattern | `client/src/seniority/persistence.ts` | Pattern only (localStorage append). Unified session shape is still fog — do not migrate Live transcripts forward |

### Delete (Live / tabs / dual-mode shell)

| Area | Files / endpoints | Why |
|------|-------------------|-----|
| Two-tab shell | `AppShell.tsx`, `AppShell.module.css` | [020](020-unified-session-flow-ux.md) — single entry |
| Live mode orchestrator | `seniority/SeniorityMode.tsx` | Tabs + Live conversation gone |
| Live session machine | `seniority/useInterviewSession.ts` | Phases `connecting` / hold-to-talk ≠ 020 machine |
| Live WebSocket client | `seniority/liveSession.ts` | No Gemini Live in product |
| Live conversation UI | `ConversationScreen.tsx` (+ CSS) | Written prompt + MediaRecorder only |
| Live token client | `mintLiveToken` in `seniority/api.ts` | Goes with Live |
| Live server | `server/src/interviewer.ts` **entire file** after 026 has copied seed *text* out; `POST /api/live-token` in `index.ts` | Persona/protocol/Live model/voice/ephemeral token — out of scope |
| PCM helpers | `client/src/audio/pcm.ts`, `pcm.test.ts` | No streaming PCM without Live |
| Client SDK | `@google/genai` in `client/package.json` | Server-only after Live delete |
| Live-era seniority store | `starling.seniority.sessions` writes / `persistence.ts` once unused | Old transcript+015 reports are not the unified model; safe to stop writing (optional one-time clear) |
| Scaffold doc as guide | Relying on `wayfinder/BUILD-seniority-mode.md` for build steps | Historical only |

**Do not park Live code** for a later switch — map Out of scope already rules Live conversation out. Delete; do not feature-flag.

### New surface (implementation creates; listed so delete/refactor do not orphan the design)

| Piece | Spec |
|-------|------|
| `POST /api/pick-follow-up` | [021](021-ai-follow-up-picker.md) |
| Technical feedback path | [023](023-technical-answer-rubric.md) — sibling of `/api/feedback` or parameterized by category |
| End-report assembly | [022](022-unified-end-report-contract.md) three layers + UI |
| Unified session hook / screens | [020](020-unified-session-flow-ux.md) |

### Suggested build order (handoff)

1. **[027](027-monorepo-packages-layout.md)** — packages + `@starling/bank`; leave dual-mode running during the move (027’s own rule).
2. **Content (v1 minimum — done):** [026](026-convert-seniority-seeds-to-trees.md),
   [025](025-author-technical-trees-altium.md) in `@starling/bank`. [028](028-enrich-expand-technical-trees.md)
   deferred to [BUILD §2](../BUILD-unified-interview.md).
3. **Unified shell + session machine** — replace `AppShell`/`main` entry; grow `usePracticeSession` into the 020 machine; add `profiles.ts` + start screen; wire progress + End session.
4. **APIs** — `pick-follow-up` → technical feedback → seniority audio report (renamed schema) → summary call; keep `/api/feedback` for drill + behavioral trees.
5. **End-report UI** — refactor `ReportScreen`; hide frames; summary → deep dives.
6. **Delete Live/tabs** — files and endpoints in the Delete table; drop client `@google/genai` and PCM; remove `/api/live-token`.
7. **Smoke** — Behavioral drill (Practice + Simulation), one `endReport` profile with mixed categories, confirm no Live/WebSocket traffic.

**Coordination:** Finish step 2 content into the bank before step 3 relies on filled presets ([019](019-interview-profile-config.md) disables underfilled profiles). Do not delete `interviewer.ts` until 026 has extracted seed text.

### Handoff one-liner

Tabs + Live are **delete**; behavioral guided-steps + WAV + `/api/feedback` + `FeedbackPanel` are the **spine**; seniority report **content** survives as **renamed audio-in deep dive**; bank + profiles + picker + end-report are the **new** work — after [027](027-monorepo-packages-layout.md) and authoring tickets.