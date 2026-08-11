# Two-tab navigation + live-conversation UX

- Type: wayfinder:prototype
- Status: open
- Assignee: (unclaimed)
- Blocked by: 013, 014, 015
- Parent: wayfinder/map-seniority-mode.md

## Question

How do the two modes coexist, and what does the **live-conversation screen** look and feel like? A
back-and-forth interview is a very different UI from the behavioral mode's record-one-answer screen.
Needs the conversation architecture (013 — does the interviewer speak? do turns stream?), the
protocol (014 — what a turn looks like), and the report contract (015 — what the payoff renders).

- **Two-tab shell.** How the behavioral and seniority modes coexist — tab/nav pattern, shared shell,
  where mode selection lives. The behavioral screen stays unchanged; this frames it, not rewrites it.
- **The conversation screen.** Showing whose turn it is, the interviewer's question (text and/or
  audio playback), the running turn history, the recording/answering state, and progression through
  the interview. Very different from a single prompt + record button.
- **The report screen.** Rendering the 015 contract — ladder scoring, the per-probe decode
  breakdown, the hedge/"we vs I" flags — legibly, so the coaching actually lands.
- **Session start.** Where the 016 seeding surfaces (pick an archetype/difficulty, or just "start").
- **Consistency.** Reuse the existing design language (CSS Modules + BEM, per `client/README.md`)
  so the new mode feels like the same product.

Use `/prototype` and `/impeccable` to produce a rough UI artifact (wireframe or stub) of the tab
shell, the conversation screen, and the report screen for the user to react to.

Deliverable: the UX spec + linked prototype for the two-tab navigation, the live-conversation
screen, and the report screen. This closes the route — with 012–016, the mode is ready to build.
