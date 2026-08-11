# Seniority feedback report contract

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz
- Blocked by: 012
- Parent: wayfinder/map-seniority-mode.md

## Question

What does the **end-of-session report** look like — the payoff of the whole conversation? This is
the seniority-mode analogue of ticket 002's behavioral rubric, but it grades a *multi-turn
interview*, not one answer. It needs the competency model (012) to score against.

The three coaching signals the user chose:

- **Seniority-ladder scoring.** Where did the session land on the 012 ladder (Lead Yourself / Team /
  Business, generalized)? Per-rung, holistic, or both? Scored 1–5 like the behavioral rubric, or a
  different shape? Note per level.
- **Probe decode.** Per question, a *"what this was really measuring → what you did → the senior
  move"* breakdown — the single most valuable artifact from the Zendesk analysis. What's the shape
  (one entry per interviewer turn)? How much of the transcript does it reference?
- **Hedge & "we vs I" flags.** Surface hedges/self-deprecation ("not my area", "I guess"), and the
  "we" vs "I" ratio. **Where is this computed** — Gemini over the full transcript, or a client-side
  heuristic on a transcript? (Tie to 013's transcription decision.) How honest about approximation
  (echo 002's caveat that delivery signals are impressions, not hard metrics)?

Also decide: a **frames-accepted** signal (did the candidate push back on diminishing frames, per
012's catalogue)? Overall summary + a few concrete "next interview" fix-its (no full model
answers, per 002)? Tone — direct but constructive, matching 002.

Deliverable: the report rubric + the JSON contract Gemini must return (kept within its supported
flat-schema subset, per ticket 001), recorded in the ticket answer. This is the contract 017 (UX)
renders.

## Answer

The end-of-session report is the seniority-mode analogue of ticket 002's behavioral rubric, but it
grades a **multi-turn interview** and it is **coaching, never a hire/no-hire gate** (012's boundary
carries over). It scores against 012's competency model: the three-tier ladder, the six
diminishing-frame catalogue, and the five anti-signal families.

### 0. Where the report is generated — a separate batch call over the transcript

The interview runs on the **Live API** (013); the report does **not**. When the Live session ends,
its accumulated **transcript** (both sides, transcribed for free per 013) is sent as **text** to the
behavioral mode's already-proven stack — `gemini-3.6-flash` via the **Interactions API** with
`response_format` (tickets 001/006/009). The report is one batch call.

Why batch, not the Live session reporting on itself:

- **Structured JSON output is the entire deliverable, and only the batch stack has it proven.**
  Ticket 001's `response_format` findings (flat schema; never alongside `response_mime_type`) are
  Interactions-API findings. Reliable schema output over a `-preview` native-audio Live socket was
  never established.
- **Keeps the interviewer in character.** A persona that knows it will grade you carries a second
  agenda — exactly the drift 013 warned about. The screen and the coach are separated.
- **Re-runnable.** The transcript is text, so an improved report prompt can regrade old sessions —
  the natural bridge to the map's "persist & compare reports over time" fog.
- **The report is the batch case.** No turn-taking, latency-insensitive; cost negligible on top of
  the ~$0.12/session.

**Consequence (accepted):** the report sees the transcript, **not the audio**, so vocal delivery
(pace, filler-word *sound*, conviction) is **not graded** here — unlike 002's audio-fed Delivery
dimension. All three chosen signals are **lexical** (readable from text), so this is acceptable.
Hedges are caught as *words*, not as vocal tone.

### 1. Ladder — headline + per-tier evidence profile (inherits 012)

012 is inherited wholesale: three tiers (**Lead Self / Lead Others / Lead the Business**), each read
`absent | emerging | demonstrated` on the one axis *owned + specific + first-person evidence*. Coarse
3-level scale, **not** the behavioral mode's 1–5, and **not** collapsed to a single placement.

Added around it:

- A **`headline`** — one advisory holistic sentence (e.g. *"strong owned evidence at Lead Self, but
  Lead Others only ever showed up second-hand, and Lead the Business was absent"*). The true analogue
  of 002's `interviewReady`: holistic, one line, **never a gate**. Deliberately **prose, not a
  `level` enum** — a single "you are a Lead Others candidate" field would resurrect the single
  placement 012 rejected and read as a hiring verdict.
- Each tier carries its **evidence**: a `note` (the coaching read) and a `quote` — a verbatim snippet
  from *the candidate's* side that earned the reading. Quotes matter more than in 002 because a
  ~10-minute transcript is too long to re-scan by hand. For an **`absent`** tier there is no quote
  (empty string); the `note` carries the coaching prompt ("you never surfaced org-level impact") —
  which 012 already framed as a prompt, not a verdict.

### 2. Probe decode — one entry per substantive interviewer question

The single most valuable artifact. One entry per substantive interviewer question (~5–6 per
session; pure back-channels like "go on" are excluded). Each entry is
*what this was really measuring → what you did → the senior move*:

- **`measuring`** — the hidden agenda behind the (often casual-sounding) question.
- **`whatYouDid`** — how the candidate actually handled it.
- **`seniorMove`** — the stronger *strategy* they missed. **Strategy, never a scripted answer** —
  002's "no full model answer" rule holds ("surface your scope-pushback story here", not the sentence
  to recite).
- **`frame`** — which of 012's six diminishing frames this turn deployed, or `"none"`. Ties the
  decode to the frame catalogue and to the scoreboard (§3) so they corroborate each other.

References the transcript by **paraphrase**, not verbatim interviewer quotes — the decode is about
the candidate's handling, and the interviewer's exact words already live in the stored transcript.

### 3. Frames scoreboard — the reframe tally

The mode's core trained behaviour: *when handed a diminishing frame, do you push back or cave?* The
decode (§2, detail) and flags (§4, the fails) both carry pieces of this, but neither gives the clean
scoreboard. So a dedicated **`framesFaced`** — one entry per frame the interviewer actually deployed,
`{ frame, reframed: bool }`. The UI (017) renders "reframed 1 of 3" from it.

**Count, not a score** — no reframe *rate/percentage* graded against a bar (same honesty rule as §4).
Deliberate three-altitude redundancy: decode = detail, flags = the acceptances, scoreboard = the
tally.

### 4. Anti-signal flags — hedges & "we vs I", computed by Gemini, no ratio

The granular transcript-level tells from 012 §4, surfaced as **flags with a quote, not scores**
("the tier profile *is* the score; anti-signals are the evidence why"). All computed by **Gemini over
the transcript** inside the single report call — **no client-side heuristic**: a raw pronoun count
can't tell "we shipped it" (fine, real team effort) from "we decided" (the tell, about the
candidate's own call); only reading for *ownership context* can.

Each flag: **`{ type, quote, note }`** — `type` one of 012's five families (`we-not-i`,
`hedging`, `unquantified`, `passivity`, `frame-acceptance`), `quote` the verbatim trigger, `note` a
one-line coaching read.

**No "we vs I" ratio number anywhere** (structural honesty, not just tonal). A "37% we / 63% I"
figure claims precision the report can't honestly hold and invites gaming a ratio; the signal instead
surfaces *as flags* — the specific moments "we" covered owned work — which is more honest and more
coachable. Echoes 002/012's caveat that these are advisory impressions, not hard metrics.

### 5. Closing — summary + fix-its, no holistic flag (inherits 002)

- **`overallSummary`** — 1–2 sentences. Distinct from the §1 `headline`: the headline is about *where
  on the ladder*; the summary is the holistic "how did this screen go" across all three signals.
- **`fixIts`** — 1–3 concrete, forward-looking **"next interview"** suggestions. **Strategy, not
  script**, per 002 ("go in with one story where you drove scope beyond your tickets and lead with
  it — you left Lead Others empty", never a sentence to recite).
- **Tone** — **direct but constructive**, identical to 002. Names the caving and the empty tiers
  plainly, always paired with the move that fixes them.
- **No holistic boolean flag** — no seniority analogue of `interviewReady`. A
  `readyForSeniorityScreen` boolean would be far more loaded/gameable and cuts against 012's
  coaching-lens-not-gate boundary. The `headline` sentence carries the holistic read without a
  pass/fail.

### 6. The JSON contract

Flat per ticket 001 — arrays of flat objects plus top-level strings (the shape 002 proved). `frame`
and flag `type` are **enums** (a `"none"` member is used rather than a nullable field, which isn't
clearly in Gemini's supported subset). One batch call, `response_format` **alone** (never with
`response_mime_type` — the 001/006 gotcha).

```json
{
  "headline": "Strong owned evidence at Lead Self, but Lead Others only showed up second-hand and Lead the Business was absent.",
  "ladder": [
    { "tier": "Lead Self",         "level": "demonstrated", "note": "...", "quote": "..." },
    { "tier": "Lead Others",       "level": "emerging",     "note": "...", "quote": "..." },
    { "tier": "Lead the Business", "level": "absent",       "note": "...", "quote": "" }
  ],
  "probeDecode": [
    {
      "measuring": "whether you shape direction or just take orders",
      "whatYouDid": "agreed and moved on — 'yeah, mostly I built what was speced'",
      "seniorMove": "this was bait to shrink you to Tier 1; surfacing your scope-pushback story would have reframed it",
      "frame": "Order-taker"
    }
  ],
  "framesFaced": [
    { "frame": "Order-taker",  "reframed": true  },
    { "frame": "Small-scope",  "reframed": false },
    { "frame": "False-modesty","reframed": false }
  ],
  "flags": [
    { "type": "we-not-i", "quote": "we decided to cut the feature", "note": "you owned this call — 'we' hides your decision" }
  ],
  "overallSummary": "A solid screen let down by caving under two diminishing frames and never surfacing org-level impact.",
  "fixIts": [
    "Go into the next screen with one story where you drove scope beyond your tickets, and lead with it.",
    "When an interviewer minimises your work, name the business outcome before agreeing."
  ]
}
```

**Enum domains:**
- `ladder[].tier`: `Lead Self | Lead Others | Lead the Business`
- `ladder[].level`: `absent | emerging | demonstrated`
- `probeDecode[].frame` & `framesFaced[].frame`: `Order-taker | Bystander | Small-scope | Luck |
  Too-junior | False-modesty` (+ `none` for `probeDecode` only)
- `flags[].type`: `we-not-i | hedging | unquantified | passivity | frame-acceptance`

### Handoff

- **017 (two-tab / live-conversation UX)** renders this contract: headline, three tier cards with
  quotes, the probe-decode list, the "reframed N of M" scoreboard, the flags, summary + fix-its.
- **014 (persona/protocol)** and this contract share 012's vocabulary; the decode's `frame` tags and
  the scoreboard assume 014 actually deploys frames it can be scored on.
- The **batch-over-transcript** shape means stored transcripts can be regraded — feeds the map's
  "persist & compare reports over time" fog.
