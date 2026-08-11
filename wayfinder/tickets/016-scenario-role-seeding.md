# Opening-scenario / interviewer-role seeding

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: 012, 014
- Parent: wayfinder/map-seniority-mode.md

## Question

The behavioral mode has a fixed 21-question bank (ticket 003/011). The seniority mode is a
conversation, so the equivalent question is: **what seeds each session** so the mode trains the
*class* of seniority/culture-fit screens rather than one company's interview? Needs the competency
model (012) and the interviewer protocol (014).

- **Seeds, not a script.** Since the interviewer improvises turn-to-turn (014), what does a session
  start from — an **interviewer archetype / role** (e.g. skeptical hiring manager, peer-level panel,
  skip-level exec), an opening scenario, a target competency to stress, or some combination?
- **Coverage.** What spread of archetypes/scenarios gives useful variety without overfitting? Enough
  that repeated sessions feel different and cover the ladder's range.
- **Seeding from inspiration without hardcoding.** How do the STAR bank and the Zendesk feedback
  inform the seeds at author-time (framing the *kinds* of probes) **without** baking in a specific
  company, interviewer, or 1:1 question set — the explicit anti-overfit constraint from the map.
- **User control.** Does the user pick an archetype/difficulty before starting, or is it random /
  adaptive? (Adaptivity itself is fog on the map — keep this to the seeding decision.)

Deliverable: the seeding model — the set of archetypes/scenarios and how a session is initialized
from one — recorded in the ticket answer. Feeds 017 (UX: how the user starts a session).

## Answer

The seeding model resolves the "what's the conversational equivalent of the 21-question bank"
question with a deliberately **minimal** seed: a session is seeded by **one opening prompt and
nothing else**. Everything that makes the mode work — the persona (014), the turn protocol (014),
the tier ladder and frame/anti-signal catalogue (012) — stays constant and adaptive across sessions.
The seed only sets turn 1; from there 014's interviewer improvises on live evidence.

### 1. The unit of variation — the opening prompt only

The "interviewer archetype" axis from the ticket is already closed by 014: there is **one** fixed
persona (a manager ~2 levels up, warm-but-specific), and a persona roster is out of scope. So the only
thing that varies session to session is **which opening the interviewer leads with**. There is no
per-session tier bias and no difficulty dial — an explicit tier target would fight 014's adaptive
running tier-profile, and 014 already fixed the register (never hardens), so difficulty is a dial with
nothing behind it. Tier coverage is an **emergent property** of the conversation, not a seed setting.

### 2. Representation — a semantic seed, not a verbatim line

Each seed is a short **instruction** handed to the persona via 013's `systemInstruction`
(e.g. *"open by inviting a story about a piece of work they'd point to as their best"*), which the
model phrases in its own voice each session. Not a fixed line. This keeps turn 1 fresh across replays,
is consistent with 013 holding the persona server-side and the interviewer speaking natively, and is
the anti-overfit-friendly form: a seed describes the *kind* of probe, never a company's literal words.
014 already trusts the model to improvise every subsequent turn, so trusting it on turn 1 is
consistent.

### 3. Organizing axis — by story-kind, authored against the failure catalogue

The bank is organized by the **kind of story the opening invites**, not by tier target (leads the
witness; contradicts §1) and not by difficulty (fixed in 014). Crucially, the seeds are **not**
justified by generic behavioral-interview coverage — they are authored against 012's failure
catalogue, which is itself the generalized Zendesk feedback. Each opening earns its place because it
**reliably manufactures the conditions where a specific failure class happens**. Every opening is
written target-agnostic and leaves room for higher-tier evidence to surface without naming a tier.

### 4. The five-seed bank (with the failure classes each provokes)

Frames (F1–F6) and anti-signals (A1–A5) are 012's. The tags are an **author-time audit tool** — they
record *why each seed is in the bank*; the frames themselves are still deployed adaptively by 014 on
live evidence, never fired by the seed.

| # | Opening seed (story-kind) | Failure classes it is designed to provoke |
|---|---|---|
| 1 | **Proud-of / best work** (wide open) | reveals default tier-reach; baits **F3** small-scope & **F6** false-modesty; surfaces **A2** hedging when they downplay |
| 2 | **A disagreement / a time you pushed back** | **F1** order-taker, **F2** bystander; tests **A1** we-not-I on who owned the push-back |
| 3 | **Something that didn't go well** | **A4** passivity, **A1** we-not-I (blame diffusion), **A3** unquantified, **F4** luck/circumstance |
| 4 | **An ambiguous situation, no clear direction** | **F5** too-junior; tests unprompted Tier-3 evidence; **A4** passivity |
| 5 | **A time you changed how something was done** | **F3** small-scope, **F5** too-junior; the core Zendesk failure — *surfacing leadership evidence unprompted* |

**Coverage audit (the acceptance criterion for the bank):** every failure class is provoked by ≥1
opening. Anti-signals — A1 (2,3), A2 (1), A3 (3), A4 (3,4); **A5 (frame acceptance)** is not
seed-specific — it is exercised by construction whenever 014 deploys *any* frame, so every session
covers it. Frames — F1 (2), F2 (2), F3 (1,5), F4 (3), F5 (4,5), F6 (1). All eleven classes covered.
Seed 1 stays deliberately wide because *what the candidate reaches for first is itself signal*
(014 §3) — it locates the starting tier before any probing.

### 5. The Zendesk / STAR link — failure-mode, never content

Two kinds of link, only one allowed:

- **Content link (banned):** copying Zendesk's questions, the interviewer's phrasing, or Diogo's STAR
  stories into the bank. Ruled out by the map — that screen won't recur; overfitting to it is out of
  scope.
- **Failure-mode link (the mechanism):** the Zendesk feedback tells us *which failures matter*
  (accepting diminishing frames, not surfacing leadership evidence unprompted, hedging/self-deprecation,
  we-not-I, not reading what a casual question measures). Those are already generalized into 012's
  frames + anti-signals. The seeds are then **selected to trigger those classes** (§3/§4). The chain is
  *Zendesk feedback → 012's failure catalogue → seeds selected to provoke it* — never *Zendesk questions
  → seeds*.

The **STAR bank plays a mirror role at author-time only:** sanity-check that each seed *has* a plausible
strong senior answer a real story could fill, so the coaching target is reachable. Nothing from the STAR
bank is baked into runtime.

### 6. User control — random single-button start

When a session starts the mode **picks one of the five at random**; the candidate does not know which is
coming. No menu (naming the openings — "the failure story," "the leadership story" — leaks intent and
breaks the cold-open realism that is the mode's core value, per 014's *"the interview is realistic, the
report is the teacher"*). No difficulty selector (§1). Over repeated sessions the random spread
self-covers the ladder. **Deliberate weak-spot drilling** (bias selection toward a candidate's recurring
failures) is genuinely valuable but is **deferred to the map's existing adaptivity fog** — it needs the
cross-session history that is itself unspecified fog — and is explicitly *not* decided here.

### Handoff to downstream tickets

- **017 (two-tab / live-conversation UX)** — still blocked by 015. Gets: **single-button "start a
  session" start, no pre-session menu, no difficulty control.** The five seeds live server-side; the UI
  never names them.
- No new tickets surfaced. Adaptive/weighted seed selection stays as the map's already-parked adaptivity
  fog; the optional STAR-bank personalization fog is untouched (this ticket only uses the STAR bank as an
  author-time reachability check, not runtime ingestion).
