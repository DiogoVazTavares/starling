# Move app into packages monorepo layout

- Type: wayfinder:task
- Status: closed
- Assignee: Auto (Cursor agent)
- Blocked by:
- Parent: wayfinder/map-unified-interview.md

## Question

Pinning [`018`](018-unified-question-bank-schema.md) put the question bank in **`packages/bank`**
(`@starling/bank`). The agreed **target** layout is:

```
packages/client
packages/server
packages/bank
```

This ticket is the **mechanical migration** (not domain design):

- Create a workspace root (npm/pnpm/yarn workspaces — pick one to match the repo).
- Move `client/` → `packages/client`, `server/` → `packages/server`.
- Add `packages/bank` with the `Question` / `QuestionTree` contract and migrate
  `client/src/questions.ts` into `QUESTION_BANK` (behavioral B1 fold from 018).
- Wire Vite, Hono, `tsc`, and scripts so both packages import `@starling/bank`.
- Keep behavior unchanged: existing practice loop and seniority paths still run after the move.

Deliverable: repo builds and the current app still works; bank is the single source of truth for
tree data. No unified UX yet (that is later implementation after the map).

## Answer

Pinned 2026-08-14. **Plan only** (map Notes): this answer is the migration checklist for the
post-map build. Files were **not** moved in this session.

### Workspace

- **npm workspaces** (repo already uses npm + per-package `package-lock.json`; README is
  `npm --prefix …`).
- Root `package.json`: `"private": true`, `"workspaces": ["packages/*"]`. One root lockfile;
  delete `client/package-lock.json` and `server/package-lock.json` after the move.
- Package names: `@starling/client`, `@starling/server`, `@starling/bank` (all `private`).

### Layout after migrate

```
packages/bank/     → @starling/bank   (types + QUESTION_BANK)
packages/client/   → @starling/client (today’s client/)
packages/server/   → @starling/server (today’s server/)
```

- `wayfinder/` stays at repo root (specs/assets, not a workspace package).
- Env: `packages/server/.env` (update README copy path).
- Profiles stay in the client per [019](019-interview-profile-config.md):
  `packages/client/src/profiles.ts` when that file is added — **not** in the bank.

### `@starling/bank`

- Own the 018 contract (`InterviewCategory`, `BehavioralTheme`, `Question`, `QuestionTree`)
  and `export const QUESTION_BANK: QuestionTree[]`.
- Package entry: `"type": "module"`, export `./src/index.ts` (source; no separate bank build
  step in v1). Client (Vite) and server (`tsx`) both depend on `"@starling/bank": "*"`.
- **Populate on migrate:**
  1. **Behavioral B1** — fold `client/src/questions.ts`: each of the 21 becomes a tree;
     tree `id` = old question `id`; `category: 'behavioral'`; `theme` = old `category`;
     `main.id` = `${treeId}-main`; `main.text` = old `prompt`; `followUps: []`.
  2. **Technical** — absorb latest
     [`assets/025-technical-trees.ts`](../assets/025-technical-trees.ts) (and any 028
     enrichments present at migrate time).
  3. **Seniority** — absorb
     [`assets/026-seniority-trees.ts`](../assets/026-seniority-trees.ts).
- Types live **once** in the bank; drop duplicate type blocks from wayfinder assets after
  copy (or leave assets as historical snapshots — do not import them from the app).
- Until migrate runs, [028](028-enrich-expand-technical-trees.md) keeps writing under
  `wayfinder/assets/`. After migrate, further authoring edits `packages/bank`.

### Keep behavior unchanged

- **Practice loop** (behavioral drill path today): import `QUESTION_BANK` from
  `@starling/bank`; iterate **`category === 'behavioral'` only**; show / submit
  `tree.main.text` (replace `question.prompt`). Delete `packages/client/src/questions.ts`
  after the fold.
- **Seniority / Live path**: unchanged code paths; still does not read the bank until the
  later unified-shell build ([024](024-migration-retire-tabs-and-live-api.md)).
- No unified UX, profiles UI, or Live deletion in this ticket.

### Scripts / tooling

Root convenience scripts (delegate into workspaces), e.g.:

| Script | Meaning |
|--------|---------|
| `npm run dev` | document two-terminal still OK; optional `concurrently` later — not required |
| `npm run dev -w @starling/server` / `-w @starling/client` | replace `npm --prefix` |
| `npm run check -w @starling/client` | biome + typecheck as today |
| `npm run typecheck -w @starling/server` | as today |

- Vite: resolve workspace package (exports to `.ts` is enough; alias only if needed).
- Proxy `/api` → server port unchanged.
- Server: add `@starling/bank` dependency now even if unused until picker / report APIs —
  satisfies “both packages import the bank.”
- Biome / tsconfigs: paths under `packages/client` stay local; no need to lint the bank
  with Biome on day one unless easy.

### Done when (post-map implementer)

1. `packages/{client,server,bank}` exist; old `client/` and `server/` gone.
2. `QUESTION_BANK` holds behavioral + technical + seniority trees; app does not import
   wayfinder assets.
3. `npm install` at root; client + server typecheck/build; practice loop still works;
   seniority tab still works.
4. README updated for the new paths and `npm -w` scripts.

### Executed

Implemented on branch `feat/027-monorepo-packages-layout` (commit follows the Answer
checklist). Bank tests cover category counts, unique ids, and the B1 fold.
