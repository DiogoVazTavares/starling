<!-- label: wayfinder:map -->

# Map: Unified Starling interview

## Destination

A **build-ready spec** for one Starling product shape: **no tabs**, one question bank with
pre-authored **trees** (main prompt + follow-up pool), **profiles** that pick a category mix,
and **one end report** (summary first, then deep dive per category). Each part is a **written
question on screen → spoken audio answer** — no live AI interviewer voice. Follow-ups are
**AI-picked from the pool** after each part (batch, not live). The map is done when the way to
**build the consolidation** is clear and the old two-tab / Live-API path has a explicit
retirement plan.

## Notes

- **Plan-only** for this map (like [`map-seniority-mode.md`](map-seniority-mode.md)). Implementation
  is a separate effort after the map closes. [`map.md`](map.md) already carried the behavioral
  vertical slice; this map replaces the two-mode product direction charted in
  [`map-seniority-mode.md`](map-seniority-mode.md) §Destination.
- **Grilling outcomes (2026-08-14)** — standing preferences until tickets pin them:
  - Session = many parts, **one report at the end** (full-session profiles). **Behavioral drill**
    profile keeps per-attempt feedback (old retry loop) — not a tab, just a profile.
  - **Written question + audio** only. No Gemini Live conversation. No AI voice.
  - **Pre-authored trees**; **one recording per part**; **AI picks next follow-up from the pool**
    (does not invent questions).
  - **Profiles in a config file** (v1). Four presets: Culture-fit screen, Frontend technical,
    Behavioral drill, Full senior loop. Mix editable in file. JD-driven profiles = later fog.
  - **Review stance:** user picks Practice | Simulation at session start (not on the profile).
    `reportMode` stays on the profile (drill = perAttempt; others = endReport). See [019](tickets/019-interview-profile-config.md).
  - **Categories v1:** `behavioral` · `technical` · `seniority`. `system-design` = later fog.
  - **End report:** summary → deep dive per category. Behavioral = existing 4 dimensions.
    Technical = Correctness · Completeness · Clarity. Seniority = renamed schema + plain UI
    labels; **frame tags hidden** (plain English only in UI).
  - **Internal schema rename** (user-facing labels separate): `ladder`→`scopeEvidence`,
    `probeDecode`→`questionBreakdown`, `measuring`→`realQuestion`, `seniorMove`→`strongerMove`,
    `framesFaced`→`pushbackMoments`, `flags`→`wordingIssues`, tier enums → `self`/`team`/`business`,
    level enums → `notShown`/`partial`/`strong`.
- **Reuse from closed tickets:** audio pipeline (007), behavioral rubric (002), Gemini batch
  Interactions (001/009), competency model content (012), seniority report *content* (015 — shape
  migrates to renamed schema), persistence model (010), existing 21 behavioral prompts (011).
- **Supersedes:** two-tab shell (017), Live API session architecture as the primary path (013),
  live interviewer persona protocol (014) for in-session use. Live token / WebSocket code may be
  deleted or parked — see migration ticket.
- Skills: `/grilling`, `/domain-modeling`, `/prototype`, `/research`, `/impeccable` (UI).
- Tracker: local markdown (`wayfinder/tickets/NNN-slug.md`, `Parent:` → this file).
- Glossary: root [`CONTEXT.md`](../CONTEXT.md). Bank package target: `@starling/bank`
  (`packages/bank`); monorepo move plan pinned in
  [Move app into packages monorepo layout](tickets/027-monorepo-packages-layout.md)
  (execute after the map).

## Decisions so far

<!-- one line per closed ticket -->

- [Define unified question bank schema](tickets/018-unified-question-bank-schema.md) —
  `QuestionTree` = `main: Question` + `followUps: Question[]`; categories
  `behavioral`|`technical`|`seniority`; optional `theme`; ids `${treeId}-main` /
  `${treeId}-slug`; bank in `@starling/bank` (`packages/bank`); 21 behavioral → trees with
  empty pools; seniority seeds → fixed on-screen mains (026); technical via 025.
- [Interview profile config contract](tickets/019-interview-profile-config.md) —
  `client/src/profiles.ts`; hybrid slots (category count + optional pinned ids); session order
  = slots array contiguous; user picks Practice|Simulation at start; `reportMode` on profile
  (drill=`perAttempt`, else `endReport`); drill `treePick: userOptional`; underfilled presets
  disabled + hard-fail backup. Four v1 presets pinned in the ticket.
- [Technical answer rubric](tickets/023-technical-answer-rubric.md) — per **question tree**:
  Correctness · Completeness · Clarity (1–5 + note each); same flat `{dimensions, fixIts,
  overallSummary, interviewReady}` shape as 002; no Delivery; coach tone citing concrete gaps;
  app attaches `treeId`. Unblocks 022.
- [Author technical question trees (Altium / frontend screen set)](tickets/025-author-technical-trees-altium.md) —
  five trees in [`assets/025-technical-trees.ts`](assets/025-technical-trees.ts)
  (`tech-browser-url-enter`, `tech-rest`, `tech-http-vs-https`, `tech-cors`,
  `tech-event-loop`); required probes from Altium fixture; pools tagged for 021; not wired yet.
- [AI follow-up picker contract](tickets/021-ai-follow-up-picker.md) —
  `POST /api/pick-follow-up` → `{ next: id | "done" }`; audio-in current answer + text
  history/pool; enum-constrained schema; picker-only (no scores); `maxFollowUps=2`;
  `required` before `done`; ~10 s UX / ~25 s then deterministic fallback. Notes:
  [research/follow-up-picker.md](research/follow-up-picker.md). Unblocks 020.
- [Unified end report contract](tickets/022-unified-end-report-contract.md) — three-layer
  calls (per-tree 002/023 audio → seniority session audio → summary from score JSON);
  assembled `{summary, deepDives}`; seniority = renamed 015 (frames in JSON, hidden in UI);
  drill opts out (`perAttempt`).
- [Unified session flow and UX](tickets/020-unified-session-flow-ux.md) — single entry (no
  tabs); start = radio list + Practice|Simulation + optional drill tree; guided-steps phase
  machine; Simulation stop→submit; progress `Tree N of M · Category · Question K`; drill
  feedback after each Question; End session = confirm+discard; endReport → analyzing → 022
  report. Wireframes: [prototypes/020-session-flow-wireframes.md](prototypes/020-session-flow-wireframes.md).
  Unblocks 024.
- [Migration plan — retire tabs, Live API, and dual-mode code](tickets/024-migration-retire-tabs-and-live-api.md) —
  keep WAV + `/api/feedback` + FeedbackPanel spine; refactor practice loop → 020 machine /
  drill profile; rename seniority report to 022 audio-in deep dive; **delete** AppShell, Live
  client/server (`liveSession`, `interviewer.ts`, `/api/live-token`, PCM, client `@google/genai`).
  Build order in [`BUILD-unified-interview.md`](BUILD-unified-interview.md) §1 (028 deferred to §2).
  Seeds live in `server/src/interviewer.ts` (026 path corrected).
- [Convert seniority seeds to trees](tickets/026-convert-seniority-seeds-to-trees.md) —
  five trees in [`assets/026-seniority-trees.ts`](assets/026-seniority-trees.ts)
  (`seniority-proud-of`, `seniority-disagreement`, `seniority-went-wrong`,
  `seniority-ambiguous`, `seniority-changed-how`); fixed on-screen mains from 016 seeds;
  pools cover 012 F1–F6 / A1–A5; not wired yet.
- [Move app into packages monorepo layout](tickets/027-monorepo-packages-layout.md) —
  npm workspaces; `packages/{client,server,bank}` as `@starling/{client,server,bank}`; bank owns
  018 types + full `QUESTION_BANK` (B1 behavioral + absorb 025/026); practice loop filters
  behavioral / uses `main.text`; profiles stay in client. **Executed** — see
  [`BUILD-unified-interview.md`](BUILD-unified-interview.md).

## Open tickets

<!-- frontier: spec complete — implementation is BUILD §1, not a wayfinder ticket -->

_(none — map spec is closed. Code: [`BUILD-unified-interview.md`](BUILD-unified-interview.md) §1.)_

## Post-implementation

<!-- after BUILD §1 ships — not v1 blockers -->

- [028 — Enrich and expand technical question trees](tickets/028-enrich-expand-technical-trees.md)
- [029 — Persist unified interview sessions](tickets/029-persist-unified-sessions.md)
- [030 — Author behavioral follow-up pools](tickets/030-author-behavioral-follow-up-pools.md)

## Not yet specified

<!-- in-scope fog -->

- **JD-driven profile** — paste/link a job description; Starling picks trees. Long-term; not v1.
- **`system-design` category** — add when the first authored trees exist.
- **Live coding segment** — out of scope v1; may become a profile type later (editor + different
  feedback). Altium interview had live code; Starling covers the spoken parts only for now.
- **Follow-up pool authoring guide** — how to write good pools and tags for AI selection.
  Sharper after 021: pools larger than `maxFollowUps` (2); mark must-ask probes `required`;
  `tags` are soft picker hints only. Still not a ticket until someone authors a short guide.
- **Deployment** — inherited fog from [`map.md`](map.md).

## Out of scope

<!-- ruled beyond the destination -->

- **Two-tab product shell** — one app, profiles instead of modes. Supersedes 017's destination.
- **Live AI interviewer conversation** — Gemini Live voice/back-and-forth as the session driver.
  Follow-up *selection* from a fixed pool via batch API is in scope; live talk is not.
- **Frame tag labels in the UI** — pushback types stay internal; users see plain English only.
- **Multi-user / distributable product** — personal tool (inherited from [`map.md`](map.md)).
- **Overfitting to Zendesk or Altium** — real interviews are authoring inspiration, not fixed
  replay scripts.
