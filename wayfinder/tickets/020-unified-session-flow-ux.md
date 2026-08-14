# Unified session flow and UX

- Type: wayfinder:prototype
- Status: closed
- Assignee: Diogo Vaz
- Blocked by: 018, 019, 021
- Parent: wayfinder/map-unified-interview.md

## Question

Pin the **screens and phase machine** for a unified session (HITL prototype — wireframes or
click-through stub OK):

- Start: pick profile (from config presets) → pick **Practice | Simulation** (session dial,
  not on profile — see [019](019-interview-profile-config.md)) → optional Behavioral drill
  tree picker when `treePick: userOptional` (random if skipped).
- Loop per **Question**: show written prompt → record → (Practice: review/re-record |
  Simulation: straight submit) → wait for follow-up picker → next Question or next tree.
- Progress: how much session state is visible (tree N of M, part label, category badge?).
- End: analyzing → report (022 shape) or per-attempt panel (Behavioral drill).
- Retire [`AppShell`](../BUILD-seniority-mode.md) two-tab shell — single entry, no mode switch.

Depends on bank schema [018](018-unified-question-bank-schema.md), profiles [019](019-interview-profile-config.md),
follow-up picker [021](021-ai-follow-up-picker.md).

## Answer

Pinned 2026-08-14 via prototype + grilling. Wireframes:
[prototypes/020-session-flow-wireframes.md](../prototypes/020-session-flow-wireframes.md).
List-vs-cards start compare lived under `client/src/prototypes/020-start-screen/` (deleted on
close; **list** won).

### Shell

Single entry — brand wordmark only. **Retire** `AppShell` two-tab shell. No mode switch.

### Start

1. **Radio list** of profiles (compact rows). Underfilled presets **visible but disabled**
   with shortfall reason ([019](019-interview-profile-config.md)).
2. **Practice | Simulation** dial (session-scoped review stance).
3. Optional tree picker when `treePick: userOptional` (Behavioral drill); default Random.
4. **Start session**.

### Phase machine

```
idle → start → ready → recording
  → reviewing     (Practice only)
  → submitting    (Simulation: stop skips reviewing)
  → picking       (/api/pick-follow-up wait)
      → ready     (next Question in tree)
      → treeDone → ready (next tree) | finishing
            → analyzing → report          (reportMode: endReport)
            → attemptFeedback → ready|idle  (reportMode: perAttempt)
```

Guided-steps: one phase fills the screen (same philosophy as [005](005-prototype-practice-ux.md)).

### Question loop

- Written prompt + record CTA.
- **Practice:** stop → review (listen / re-record / submit) — same as today’s behavioral loop.
- **Simulation:** stop → submit at once (no review UI).
- Then **picking** wait (~10 s target per [021](021-ai-follow-up-picker.md)); spinner +
  “Choosing the next question…”; no other affordance.
- `{ next }` → `ready` with that Question; `{ next: "done" }` → next tree’s main, or finish.

### Progress chrome

For both stances:

`Tree N of M · {Category} · Question K`

- Category = plain English (`Behavioral` / `Technical` / `Seniority`).
- `K` = 1 for the tree’s main, then +1 for each follow-up asked in that tree.

### End paths

- **`endReport`:** finishing → analyzing (“Building your report…”) → report screen with
  [022](022-unified-end-report-contract.md) shape (summary above deep dives) → Start another.
- **`perAttempt` (Behavioral drill):** 002 **FeedbackPanel after each Question**, then
  picker; when the tree is done → Try again (restart tree) or Back to start.

### End session

Quiet escape on Question screens. **Confirm + discard** — no partial end report; cancel
in-flight picker/feedback. Back to start.

Unblocks migration checklist [024](024-migration-retire-tabs-and-live-api.md).
