# Prototype the practice-screen UX

- Type: wayfinder:prototype
- Status: open
- Assignee:
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
