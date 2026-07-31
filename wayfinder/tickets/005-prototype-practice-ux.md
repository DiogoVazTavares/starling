# Prototype the practice-screen UX

- Type: wayfinder:prototype
- Status: open
- Assignee: claude (background job cf8f5b93)
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

What should the practice screen look and feel like? Make a cheap, concrete artifact to react
to (via `/prototype`, possibly `/impeccable`), covering the core loop:

- Showing the question.
- Record / stop / playback of the spoken answer (and re-record).
- Waiting/processing state while Gemini responds.
- The feedback panel (how scores + qualitative notes are laid out).
- The retry affordance and moving on to the next question.
- **Free navigation** (decided in ticket 002): user moves next/previous freely, no
  "pass to unlock" gate; the `interviewReady` flag is advisory only.
- The feedback panel renders the rubric JSON shape from ticket 002 (4 scored dimensions +
  fix-its + overall summary + advisory interview-ready flag).

Deliverable: a throwaway prototype linked from the ticket; the resolved answer captures the
interaction decisions it settled.

## Prototype (awaiting your reaction)

Three structurally different takes, switchable via `?variant=` on the existing practice
screen (`client/src/App.tsx` hosts the switcher; variants live in
`client/src/practice-variants/`). Run `npm run dev` in `client/` and open:

- `http://localhost:5173/?variant=A` — **Guided steps**: one phase fills the screen at a
  time (record → review/playback → analyzing → feedback), nothing else visible. Feedback
  renders as the current stacked list-with-meters.
- `http://localhost:5173/?variant=B` — **Session log**: compact always-visible recorder up
  top; every attempt (with its own playback + compact feedback card) appends to a growing
  list below, so past attempts on this question stay visible and replayable. The waiting
  state is a shimmering placeholder card at the top of the log rather than a full-screen
  state.
- `http://localhost:5173/?variant=C` — **Cockpit**: persistent two-pane split — left pane
  (question, nav, recorder, review player) never changes shape; right pane is dedicated to
  feedback, showing an empty-state placeholder, a shaped skeleton while waiting, or a 2x2
  scorecard grid once feedback lands.

All three implement: record → stop → **listen back and re-record before submitting**
(missing from the current build), a distinct waiting state, the ticket-002 feedback shape,
and the existing free-navigation (Previous/Next, clamped, disabled mid-recording). Verified
via a scripted Playwright pass (fake mic device + stubbed `/api/feedback`) through all three:
record → review → re-record path → submit → feedback render, no console errors.

Floating orange bar at the bottom switches variants (arrow keys or click); hidden in
production builds. Nothing here is meant to survive — once a direction (or a mix) is picked,
fold the winner into `App.tsx` and delete `practice-variants/`.

**This ticket stays open** pending your reaction — pick a variant (or a mix), and the
resolution can record the settled interaction decisions and close it out.
