# Prototype (throwaway): Unified session flow — screens + phase machine

ASCII wireframes + phase machine for ticket 020. Decisions live in the ticket
[Answer](../tickets/020-unified-session-flow-ux.md). Keep as the linked asset; do not treat as
product UI.

Constraints respected:
- **019:** profile presets; Practice | Simulation at start; drill `treePick: userOptional`;
  `reportMode` on profile.
- **021:** after each submit → wait for `pick-follow-up`.
- **022:** `endReport` → analyzing → `{summary, deepDives}`; drill = `perAttempt`.
- **Map Notes:** written prompt + spoken audio; no Live API; no AppShell tabs.

---

## Phase machine (pinned)

```
idle
  └─► start          profile list → Practice|Simulation → [optional tree] → Start
        └─► ready            written Question; record CTA
              └─► recording
                    └─► reviewing     Practice only
                    └─► submitting    Simulation: stop → submit (skip reviewing)
                          └─► picking
                                ├─► ready     next Question in same tree
                                └─► treeDone
                                      ├─► ready          next tree’s main
                                      └─► finishing
                                            ├─► analyzing → report     (endReport)
                                            └─► attemptFeedback        (perAttempt)
                                                  └─► ready|idle
```

**Shell:** single entry; brand wordmark only — no tabs.

---

## Screen 0 — Start (pinned: radio list)

```
┌───────────────────────────────────────────────┐
│  Starling                                       │
├───────────────────────────────────────────────┤
│   Choose a session                              │
│                                                 │
│   ○ Culture-fit screen                          │
│     1 seniority · 5 behavioral · end report     │
│                                                 │
│   ● Behavioral drill                            │
│     1 behavioral · feedback each attempt        │
│                                                 │
│   ○ Full senior loop          (disabled)        │
│     Needs 2 more seniority trees                │
│                                                 │
│   How do you want to run it?                    │
│   [ Practice ● ]  [ Simulation ]                │
│                                                 │
│   Tree: [ Random ▾ ]   ← drill only             │
│                                                 │
│              [ Start session ]                  │
└───────────────────────────────────────────────┘
```

---

## Screen 1 — Question (guided steps)

Progress chrome (both stances): `Tree 2 of 6 · Technical · Question 1`

Practice: stop → review → re-record | submit.  
Simulation: stop → submit (no review).

---

## Screen 2 — Picking

Spinner + “Choosing the next question…” (no other affordance).

---

## Screen 3a — End report (`endReport`)

Analyzing → report (summary above deep dives per 022) → Start another session.

---

## Screen 3b — Drill (`perAttempt`)

002 FeedbackPanel **after each Question**, then picker. Tree done → Try again | Back to start.

---

## End session

Confirm + discard. No partial report.

---

## Grilling pins (2026-08-14)

1. Progress chrome **B** → `Tree N of M · Category · Question K`
2. Drill feedback **after each Question**
3. Start screen **radio list** (cards rejected; live A/B compare deleted on close)
4. Simulation **straight submit**
5. End session **confirm + discard**
