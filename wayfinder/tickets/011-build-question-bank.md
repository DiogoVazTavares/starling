# Author the question bank + wire it into the app

- Type: wayfinder:task
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: 003
- Parent: wayfinder/map.md

## Question

Ticket 003 defined the question-bank model but not its content or wiring. Build it:

- Author 21 hand-curated questions (3 each) across the 7 categories from ticket 003's answer:
  leadership, conflict, failure/mistake, teamwork/collaboration, ambiguity, impact/results,
  prioritization/time-management. SW-engineering flavored, not leveled by seniority.
- Fold in the slice's existing question as `conflict`'s first entry, unchanged:
  *"Tell me about a time you had to give difficult feedback to a colleague."*
- Data shape per ticket 003: `{ id: string; category: Category; prompt: string }`.
- Replace `client/src/App.tsx`'s single hardcoded `QUESTION` constant with the bank, plus
  free next/previous navigation through it (no pass/lock gating, per ticket 002).
- No follow-up probes, no persistence/history (that's ticket 010, separate).

Deliverable: the question-bank data + updated practice screen navigating it, working
end-to-end in the running app.

## Answer

**Built.** `client/src/questions.ts` holds the 21-question bank (`QUESTION_BANK: Question[]`,
`{ id, category, prompt }`, `Category` as a 7-way union) — 3 per category, SW-engineering
flavored, no probes field. The slice's original question is unchanged and is `conflict`'s
first entry (`conflict-difficult-feedback`).

`client/src/App.tsx` now tracks `questionIndex` instead of a hardcoded constant, with
Previous/Next buttons that walk the bank. Switching questions clears feedback/error/attempt
state (each question starts clean).

### Decisions made resolving scope ambiguity (code review caught these)

- **Clamped, not circular, navigation.** Previous/Next disable at the first/last question
  rather than wrapping around — neither ticket 003 nor this ticket asked for wrap-around, and
  clamping is the more literal reading of "a way to move through questions." Revisit in
  ticket 005 if the UX prototype wants wrap-around.
- **No category shown in the UI.** `CATEGORY_LABELS`/category display were cut after review —
  surfacing category in the practice screen is a UI decision for ticket 005 (prototype the
  practice-screen UX), not this wiring task. `category` stays in the `Question` data shape
  (needed for the model) but isn't rendered yet.
- **Nav buttons still disable during `recording`/`analyzing`.** This is *not* the pass/lock
  progression ticket 002 ruled out — it guards against orphaning an in-progress recording or
  attributing an in-flight Gemini response to the wrong question. Commented in `App.tsx` to
  avoid it being mistaken for reintroduced gating.

Verified end-to-end in a running dev server (Chromium via Playwright): category-free header
reads "Question N of 21", Previous is disabled on question 1, Next is disabled on question 21
(no wrap), and the prompt updates on every navigation with no console errors. `tsc -b`,
`oxlint`, and `vite build` all pass clean.
