# Interview profile config contract

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz
- Blocked by:
- Parent: wayfinder/map-unified-interview.md

## Question

Pin the **profiles config file** shape and the four v1 presets from the map Notes:

| Profile | ~Trees | Mix |
|---------|--------|-----|
| Culture-fit screen | 6 | 1 seniority + 5 behavioral |
| Frontend technical | 6 | 1 seniority + 5 technical |
| Behavioral drill | 1 | 1 behavioral |
| Full senior loop | 8 | 2 seniority + 3 technical + 3 behavioral |

Also pin per-profile **rules**:

- `reviewMode`: `practice` | `simulation`
- `reportMode`: `endReport` | `perAttempt` (Behavioral drill only)

Decide: file path (`profiles.ts` vs JSON), how tree **selection** works (random within category
vs ordered), whether the user picks a specific tree in Behavioral drill, and validation (not
enough trees in bank yet). No UI editor in v1 — file edit only.

## Answer

Pinned 2026-08-14 via grilling.

### File

Typed module: **`client/src/profiles.ts`** (same style as today’s bank file; may move with
packaging later — keep next to session config, not a second format). No UI editor in v1 —
file edit only. No JSON.

### Selection (hybrid)

- Default slot: **category + count** → pick at random from the bank, **no repeat in the
  session**.
- Optional slot: **pinned `treeIds`** in fixed order (for future / special presets).
- **Behavioral drill** (`treePick: 'userOptional'`): random by default, with an **optional
  user tree picker** on the start screen.
- **Session order** follows the **`slots` array order, contiguous** (finish slot N before
  slot N+1).

### Review stance vs report mode

- **`reviewMode` (`practice` | `simulation`) is not on the profile.** The user picks it at
  session start on every profile. UI labels: **Practice** | **Simulation**. Keep **Drill**
  for the Behavioral drill *profile* name only.
- **`reportMode` stays on the profile:**
  - Behavioral drill → `perAttempt`
  - Culture-fit, Frontend technical, Full senior loop → `endReport`

### Validation

- Presets the current bank **cannot fill** stay **visible but disabled**, with a short
  shortfall reason.
- If an underfilled profile still reaches start → **hard fail** (no soft shrink).

### Config shape

```ts
type Category = 'behavioral' | 'technical' | 'seniority';
type ReportMode = 'endReport' | 'perAttempt';
type TreePick = 'random' | 'userOptional';

type ProfileSlot =
  | { type: 'count'; category: Category; count: number }
  | { type: 'pinned'; treeIds: string[] };

interface InterviewProfile {
  id: string;
  label: string;
  reportMode: ReportMode;
  treePick: TreePick;
  slots: ProfileSlot[];
}
```

### v1 presets

| id | label | reportMode | treePick | slots (order) |
|----|-------|------------|----------|---------------|
| `culture-fit` | Culture-fit screen | `endReport` | `random` | seniority×1, behavioral×5 |
| `frontend-technical` | Frontend technical | `endReport` | `random` | seniority×1, technical×5 |
| `behavioral-drill` | Behavioral drill | `perAttempt` | `userOptional` | behavioral×1 |
| `full-senior-loop` | Full senior loop | `endReport` | `random` | seniority×2, technical×3, behavioral×3 |

Unblocks start-screen work on [Unified session flow and UX](020-unified-session-flow-ux.md)
(still blocked on follow-up picker [021](021-ai-follow-up-picker.md) for the mid-session loop).
