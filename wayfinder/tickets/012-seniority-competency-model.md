# Competency model for seniority/culture-fit screens

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: (none)
- Parent: wayfinder/map-seniority-mode.md

## Question

What competency model does this mode target, probe for, and score against? This is the **brain**
of the seniority mode — the interviewer probes for it (014) and the report scores on it (015), so
it is settled first.

- **The ladder.** Zendesk's **Lead Yourself / Lead the Team / Lead the Business** is the
  inspiration. Do we adopt it as-is, rename it, or generalize it into a model that isn't tied to
  one company's rubric? (Destination: train the *class* of seniority screens, not the Zendesk case.)
- **Level definitions.** For each rung, what does a modest vs strong demonstration look like, in
  terms an LLM can recognize from a transcript? (e.g. Lead-the-Team = "influenced/shaped a team,
  pushed back, drove scope beyond own tickets" vs "executes within a scope others define".)
- **Diminishing frames.** Catalogue the *kinds* of below-seniority framings an interviewer hands a
  candidate (the "you just do what you're told, right?" move) — these drive 014's probing and the
  report's "frames accepted" signal. Generalized, not the literal Zendesk lines.
- **Anti-signals.** What language/behaviour reads as *below* the target level — hedges,
  self-deprecation, "we" over "I", unquantified claims, passivity — so 015 can flag them against
  this model rather than an ad-hoc list.
- **Boundary.** What this model is *not* — it is a coaching lens, not a real hiring rubric; it must
  stay generalizable and not encode one company's leveling doc verbatim.

Inspiration (not content to copy): the Zendesk interview feedback doc and the STAR bank on the CV.

Deliverable: a written competency model — the ladder, per-level recognizable definitions, the
diminishing-frame catalogue, and the anti-signal list — recorded in the ticket answer. This is the
shared vocabulary that 014 (persona/protocol) and 015 (report contract) both build on.

## Answer

The competency model is a **coaching lens, not a hiring rubric** — deliberately generalizable, and
it never encodes one company's leveling doc verbatim. It has four parts: the tier ladder, the
scoring shape, the diminishing-frame catalogue, and the anti-signal list. 014 (persona/protocol)
probes for it; 015 (report contract) scores against it.

### 1. The ladder — three tiers of leadership scope (target-agnostic)

Generalized from Zendesk's Lead Yourself / Lead the Team / Lead the Business into a company-neutral
**scope-of-leadership** ladder. Three tiers, defined by *behaviour recognizable from a transcript* —
never by title or years:

- **Tier 1 — Lead Self** — owns their own outcomes and standards; reliable under pressure; drives
  their own growth; holds a bar without being told.
- **Tier 2 — Lead Others** — shapes/influences a team; mentors; pushes back on direction; drives
  scope beyond assigned tickets; creates clarity for others.
- **Tier 3 — Lead the Business** — moves org-level outcomes; navigates ambiguity/strategy; makes
  cross-team leverage; connects the work to why it matters commercially.

**Target-agnostic:** the mode never screens against a preset tier. It *locates where the candidate's
evidence lands*, and coaches from there.

### 2. Scoring shape — a per-tier evidence profile

Not a single placement. Each tier gets its own reading on a coarse 3-level ordinal scale — a
portrait of where owned evidence actually showed up:

- **absent** — no evidence surfaced for this tier. Silent ≠ incapable — it's a coaching prompt
  ("you never surfaced org-level impact"), not a verdict on the person.
- **emerging** — the behaviour is *claimed, second-hand, or hypothetical*: "we improved onboarding,"
  "I'd probably push back" — aspiration without a concrete owned instance.
- **demonstrated** — a **specific, first-person, owned** instance: a real situation, *their* action,
  an outcome. "I" not "we," a concrete result, a decision they actually made.

**The threshold axis (one axis, all three tiers): `owned + specific + first-person evidence`.**
Seniority is *shown through owned, concrete evidence*, not *asserted through altitude of language*.
This is the same axis the anti-signals (§4) measure, so the whole model coheres around one idea.

Deliberate consequence (confirmed intended): a junior person who tells a crisp owned story scores
`demonstrated` on Lead Self, while a senior person who speaks only in "we" scores `emerging`
everywhere. The mode trains you to *surface owned evidence* — that asymmetry is the point.

Coarse on purpose: 3 levels, not the behavioral mode's 1–5, because a conversation yields fuzzier
per-tier signal than a single graded answer, and coarse buckets resist false precision.

### 3. Diminishing-frame catalogue — six frame families

The distinctive move of the mode: framings that shrink the candidate *below* their real scope
("you just do what you're told, right?"). Generalized *kinds*, never the literal Zendesk lines.
Each frame is a **reframe opportunity** — the trained response is to not accept it and re-assert
owned evidence at the real tier. Each is tagged with **the tier it tries to strip**, so 014 can aim
frames at tiers where the candidate showed strength (pressure-test the real evidence) and 015 can
report which frames pulled them down.

| # | Frame family | The move | Tier it strips |
|---|---|---|---|
| 1 | **Order-taker** | "so you mostly execute what your lead/PM decides?" | Tier 2/3 → Tier 1 |
| 2 | **Bystander** | "the team drove that, you were along for it?" (the we-vs-I bait) | Tier 2 → Tier 1 |
| 3 | **Small-scope** | "that was a pretty contained / low-stakes piece, right?" | minimizes impact/ambition |
| 4 | **Luck / circumstance** | "sounds like it mostly worked out on its own / good timing" | denies agency over outcome |
| 5 | **Too-junior** | "at your level you wouldn't have been in those rooms / making that call" | denies altitude by title |
| 6 | **False-modesty invitation** | warm nudge to downplay: "I'm sure it wasn't a big deal" | baits self-deprecation/hedging |

Capped at six deliberately — enough to be a real catalogue, few enough that the interviewer and
report stay coherent. Finer variants are just wordings of these.

### 4. Anti-signal list — five language tells that read *below* tier

The granular, transcript-level counterpart to the tier profile — surfaced by the report as
**flags with an example quote, not scores**. The tier profile *is* the score; anti-signals are the
evidence *why*. Coaching-style ("here's where you said 'we' about your own decision"), never a
points deduction.

1. **We-not-I** — collective credit where the candidate owned the work ("we decided," "the team
   shipped"). The single strongest tell; undercuts ownership directly.
2. **Hedging / self-deprecation** — "kind of," "I just," "I'm no expert, but," "it was nothing."
   Low conviction; invites the false-modesty frame (§3.6).
3. **Unquantified claims** — impact asserted with no scale or outcome ("improved things," "it went
   well"). Vague → reads junior.
4. **Passivity / no agency** — things happening *to* them, not driven *by* them ("I was assigned,"
   "it got decided"). Denies the decision-making altitude of higher tiers.
5. **Frame acceptance** — agreeing with a diminishing frame (§3) instead of reframing. The
   conversational sibling of the others; the report scores "frames accepted vs reframed."

**Honesty caveat** (echoing ticket 002's delivery caveat): anti-signals are advisory impressions
from the transcript — the LLM flags candidates for the user to weigh, it does not claim precision.

### 5. Boundary — what this model is *not*

A coaching lens, not a real hiring rubric. It stays generalizable and must never encode one
company's leveling doc verbatim. It locates and coaches; it does not gate, rank against peers, or
issue a hire/no-hire verdict. (Free navigation and advisory-only framing carry over from the
behavioral mode's ticket 002.)

### Handoff to downstream tickets

- **014 (persona/protocol)** probes for the three tiers and deploys the six frames — aiming them at
  tiers where evidence appeared, to pressure-test whether it's owned.
- **015 (report contract)** returns the per-tier profile (`absent/emerging/demonstrated` ×3), the
  frames-accepted-vs-reframed count, and the anti-signal flags-with-quotes.
- **016 (scenario/role seeding)** can lean on tier vocabulary to seed openings that give room for
  higher-tier evidence to surface.
