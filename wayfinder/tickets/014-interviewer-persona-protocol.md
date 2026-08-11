# Interviewer persona & conversation protocol

- Type: wayfinder:prototype
- Status: open
- Assignee: (unclaimed)
- Blocked by: 012, 013
- Parent: wayfinder/map-seniority-mode.md

## Question

How does the mock interviewer *behave* turn-to-turn so the session feels like a real
seniority/culture-fit screen — challenging but fair, not a caricature? This is the heart of the
mode. It needs the competency model (012) to know what it's probing for, and the conversation
architecture (013) to know what's technically possible (session vs history, text vs speech).

- **Turn structure.** Roughly how many turns? How does the interviewer open, follow up, and close?
- **Probing behaviour.** How does it decide, from an answer, whether to dig deeper, insist, pivot to
  a new competency, or hand a **diminishing frame** (from 012's catalogue) for the candidate to push
  back on? How aggressive should the pressure be?
- **Realism guardrails.** How to keep it from being a caricature (too hostile) or a pushover (never
  probes) — the failure modes that would make the training useless.
- **Reacting to the candidate.** Does it acknowledge good reframes / surfaced evidence, or stay
  poker-faced? How does that reinforce learning without breaking the screen's realism?
- **Ending.** What signals the interview is over and hands off to the report (015)?

Use `/prototype` to make a **rough scripted single session** (one persona, a handful of turns,
including at least one diminishing frame) for the user to react to — raising fidelity before any
build. Use `/grilling` to pin the protocol down around that artifact.

Deliverable: the interviewer persona + conversation protocol (turn logic, probing rules, guardrails,
ending condition), plus the linked prototype session. Feeds 016 (scenario seeding) and 017 (UX).
