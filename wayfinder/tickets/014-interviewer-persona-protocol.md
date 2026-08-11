# Interviewer persona & conversation protocol

- Type: wayfinder:prototype
- Status: closed
- Assignee: Diogo Vaz
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

## Answer

The protocol was pinned down against a scripted single session —
[prototypes/014-scripted-session.md](../prototypes/014-scripted-session.md), a throwaway annotated
transcript to be absorbed on close — and three grilling decisions the user made on top of it. It
speaks 012's vocabulary (three tiers, six frames, five anti-signals) and runs inside 013's Live-API
envelope (persona in `systemInstruction`, interviewer speaks, ~6 turns under a 15-min cap).

The one line that governs everything below: **the interview is realistic; the report is the teacher.**
Nothing is scored, named, or coached *during* the conversation — every correction lands in 015's
report after the character drops.

### 1. Persona — one fixed interviewer

A single persona: **an engineering manager ~two levels above the candidate, running a ~25-minute
culture-fit screen.** Warm, curious, unhurried. Held server-side in the Live session's
`systemInstruction` (013), one prebuilt `voiceName` matched to it, native speech out. One persona, not
a roster — a persona *library* is out of scope for this map.

**The pressure comes from specificity and gentle disbelief, never hostility.** The interviewer's force
is "who decided that?" and "say more," plus frames offered as generous summaries — not a
stress-interview register. This is the central realism guardrail: the failure mode is a caricature
(too hostile) or a pushover (never probes), and warm-but-specific is the line between them.

### 2. Turn structure — floor-bounded coverage, not a fixed count

Open wide → probe for specificity → hand a frame → insist on *specificity, not the frame* → acknowledge
a landed reframe → pivot up/down a tier → close. Roughly 6–8 turns.

**Ending is floor-bounded coverage** (user decision). The session does not stop the moment all three
tiers are touched and ≥2 frames are dropped — it keeps **finding new ground** (a different piece of
work) until a **minimum turn/time floor** (~6 turns / ~10 min) is reached, then closes on the
interviewer's own initiative with a warm, **no-verdict** line. This exists to defeat a specific
degenerate case: a fold-everything candidate satisfies bare coverage in ~3 short turns and would
otherwise get the shortest interview and thinnest report despite needing the most practice. The floor
forces a second/third story instead. **The 15-min Live cap (013) is the hard ceiling** — the floor
pushes toward it, so a talkative candidate may hit the wall; session resumption (013) becomes
load-bearing if so, and the floor must yield to the cap.

### 3. Probing rules

- **What the candidate reaches for first is signal** — a ticket-level vs team-level opening story
  locates the starting tier before any probing.
- **Separate Tier 1 from Tier 2 by probing the *origin* of the work** ("who decided this was worth a
  quarter?") — collective/passive phrasing can't answer "who decided," forcing a subject.
- **Insist on specificity, not on the frame.** When an answer is thin, follow the crack toward an
  owned, first-person, quantified instance — "was there a version you argued against?" is a Tier-2
  evidence hook phrased so *no* is honest and *yes* is a real story.
- **Pivot off a tier once it reads `demonstrated`; reach for the next.** Stop mining evidence already
  surfaced; probe org-level leverage without naming the tier.
- **The interviewer must hold a running tier-profile *during* the session**, not just at the end —
  frames and pivots are aimed by live evidence, so 012's profile is computed continuously, not only
  handed to 015 at close.

### 4. Frame deployment

- **Register: warm generous summary** (user decision). A frame arrives as a friendly recap the
  candidate *wants* to agree with ("so you were the pair of hands that executed it — solid quarter
  either way"). Agreeing feels polite, not weak; refusing costs social capital. That's the real-world
  difficulty the mode trains, and it's the hardest frame to refuse. **The register never hardens** —
  no adaptive escalation (this consciously rules out the "difficulty/adaptivity" fog for this map; see
  map update).
- **Aimed by evidence, two legitimate targets:** (a) a tier that read *strong*, to pressure-test
  whether the evidence is really owned; (b) a tier that read *`absent`*, as a last-chance prompt to
  surface forgotten evidence. Both per 012's aiming rule.
- **Offered at most twice, then dropped for good.** A third push is the caricature failure mode.
- **On a full fold — drop it and pivot** (user decision). If the candidate fully accepts the frame and
  offers nothing to chase, the interviewer does *not* hold a second door open or circle back; it moves
  on warmly. The fold is never corrected in-session — the report is the only place the candidate
  learns it happened (012 tracks frames-accepted-vs-reframed distinctly from the tier profile, so
  "folded" and "no evidence" stay separable). Consistent with the never-coach-in-session rule; the
  floor (§2) ensures folding still yields a full-length session.

### 5. Guardrails (the realism contract)

1. **Anti-signals are never named in-session.** The interviewer probes *around* we-not-I, hedging,
   unquantified claims, and passivity; only 015's report quotes them back. (The prototype plants four
   unflagged tells on purpose.)
2. **Acknowledgement is thin and in-character.** One short line when the candidate lands a reframe
   ("that's the kind of call I was fishing for") — teaches which register worked mid-session, but
   never a score, never a coaching aside, never "that's Tier 2." Scoring aloud would collapse the
   screen into a tutorial and taint the report.
3. **Max two pushes per frame; frames offered ≤2 per session** in practice.
4. **The interviewer closes on its own initiative, with no verdict.** Character drops, *then* the
   report appears.

### Handoff to downstream tickets

- **016 (scenario/role seeding)** — now unblocked. Gets the fixed persona (manager ~2 levels up) and
  the wide-open opening move (§1 turn structure); seeds openings that give higher-tier evidence room
  to surface.
- **017 (two-tab UX)** — still blocked by 015. Gets: interviewer speaks (native audio), turns stream,
  ~6–8 turns, a warm no-verdict close that transitions to the report screen, and reconnection that must
  stay invisible if the floor pushes a session toward the 15-min cap.
- **015 (report contract)** — sibling frontier ticket. This protocol guarantees it a continuously-held
  tier profile, a frames-accepted-vs-reframed count, and unflagged anti-signal tells in the transcript
  to quote back.
