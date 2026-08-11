# Two-tab navigation + live-conversation UX

- Type: wayfinder:prototype
- Status: closed
- Assignee: Diogo Vaz
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

## Answer

Pinned down against a throwaway wireframe artifact —
[prototypes/017-ux-wireframes.md](../prototypes/017-ux-wireframes.md) (ASCII sketches of all three
screens + two conversation variants, to be absorbed on close) — and seven grilling decisions. The
UX reuses the existing design language (narrow centered column, CSS-Modules+BEM per
`client/README.md`, the guided-steps *one-thing-on-screen-at-a-time* philosophy from ticket 005). It
honours 013 (interviewer speaks, turns stream, 15-min cap, invisible reconnection), 014 (*the
interview is realistic; the report is the teacher* — nothing scored/named/coached in-session), and
renders 015's report contract.

### 1. Two-tab shell

A thin app shell frames both modes with two top tabs — **Behavioral** and **Seniority screen**. The
behavioral screen is **unchanged**, just framed (a second mode, not a rewrite — map Notes).

- **Default tab on load: Behavioral.** The proven zero-setup mode; the seniority screen is a
  ~25-min committed session you opt into deliberately, not the thing to land in on every app open.
- **Tab-switch mid-interview: warn + confirm**, but **only while a session is live** (Screen 2). A
  live seniority session is a stateful WebSocket (013) with real cost + an in-progress transcript, so
  a stray click mustn't silently discard it — a small "Leave the interview? Your session will end and
  you won't get a report" dialog. On the start and report screens there's nothing to lose, so
  switching is free and immediate.

### 2. Session start (Screen 1) — plain start + a reserved 016 slot

One-paragraph what-to-expect (a ~25-min screen with a manager two levels up, per 014's persona), a
mic/quiet-room note, and a single **Start interview** button. Mic access is granted on Start.

- **016 dependency handled by a reserved seeding slot, not a guess.** 016 (session seeding) is being
  resolved in parallel. 017 defines the slot's **placement, width, and visual treatment** (a centered
  control group in the start card, directly above the button) but **not its contents**. Whatever 016
  lands on — nothing, an archetype picker, a difficulty toggle — drops in without re-opening the
  layout; if 016 seeds silently, the slot collapses to paragraph + button. This closes 017 without
  standing in for 016.

### 3. The live conversation (Screen 2) — **Variant A: minimal, one turn at a time**

Only the **current** interviewer turn is on screen — it feels like being *in* a phone screen, not
reading a chat log. Chosen over a streaming chat log (Variant B) because a scrollable transcript +
running timer quietly converts a nerve-test into a document-review exercise, dissolving the
in-the-moment "do I accept this frame?" pressure that is 014's whole training target. Also matches
guided-steps, so the new mode feels like the same product.

- **Before answering:** the interviewer *speaks* (native audio, 013) and its question is pinned as
  **text** underneath, with a **▶ replay** button. No countdown, no auto-start — you read, replay,
  and press **Hold to answer** on your own initiative. (The frame-as-generous-summary from 014 is a
  long seductive sentence, so keeping the current turn's text + replay is the one concession borrowed
  from B — but **no scrollback** to prior turns.)
- **While answering: audio-only.** A pulsing mic indicator + a live level/waveform for presence —
  **no live transcript of your own words.** Watching your words appear makes you self-edit against the
  screen (the same reason the chat log was rejected) and live STT visibly stumbling is distracting at
  the worst moment. The transcript still exists invisibly (013) — saved for the report + interviewer,
  never shown live.
- **No on-screen progress signal — no timer, no "turn 3 of 6".** A turn counter leaks 014's hidden
  structure (you'd see the frame coming); a countdown makes you rush your last answer, against 014's
  unhurried register. Ending is the interviewer's job anyway (warm no-verdict close). The **15-min
  hard cap (013) is enforced in-persona** — near the cap the interviewer *naturally* moves to close
  ("we're coming up on time, so last thing…"), a real interviewer's move, keeping 013's cap +
  reconnection machinery invisible.

### 4. End-of-interview transition

Interviewer closes warmly with no verdict (014) → a brief **"Writing up your report…"** state while
015's batch call runs over the transcript (a few seconds) → the report screen. Character drops
first, *then* the report appears (014's guardrail).

### 5. The report (Screen 3) — renders the 015 contract

A single long scroll, sections in fixed order. Reuses `FeedbackPanel`'s card/quote visual language.
**Order:**

1. **Headline** — 015 `headline`, prose gist.
2. **Where you landed** — the three ladder cards (`ladder[]`: tier, level dot
   absent/emerging/demonstrated, quote, note). Leads because the headline is phrased in ladder terms,
   so the cards immediately substantiate it.
3. **Frames you faced** — the `framesFaced[]` scoreboard, "reframed 1 of 3". The sharp hook that makes
   you read on; the mode's signature signal.
4. **What each question was measuring** — `probeDecode[]` (measuring → what you did → senior move,
   frame tag). The deep per-question read, below the two at-a-glance sections.
5. **Language flags** — `flags[]` with quotes (the "evidence why", per 012).
6. **For your next screen** — `overallSummary` + 1–3 `fixIts`, forward-looking, closing the report.

Footer: **New interview** / **Back to behavioral**.

### 6. Persistence — save silently, no history UI

Each finished session is **persisted silently** — transcript + report JSON, mirroring ticket 010's
`localStorage` shape — so 015's re-runnable-over-stored-transcript design stays buildable and the
map's "compare reports over time" fog isn't stranded. But **017 ships no history/trends UI**:
reopening or comparing past reports is deferred to that fog. Navigating away doesn't destroy data; it
just isn't browsable yet in this ticket.

### Handoff / route status

- This closes the **build-ready UX** for the three seniority screens. With 012–015 + this, the mode
  is specified end to end; only **016 (seeding)** remains open (in flight), and its output lands in
  the reserved start-screen slot without touching the rest of the UX.
- The silent-persistence decision feeds the map's **"persist & compare seniority reports over time"**
  fog — which now also owns the deferred report-history browsing UI.
