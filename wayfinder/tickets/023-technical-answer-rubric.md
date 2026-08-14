# Technical answer rubric (Correctness · Completeness · Clarity)

- Type: wayfinder:grilling
- Status: closed
- Assignee: Auto (Cursor agent)
- Blocked by:
- Parent: wayfinder/map-unified-interview.md

## Question

Pin the **technical deep-dive** rubric for the unified end report:

- Three dimensions: **Correctness**, **Completeness**, **Clarity** (1–5 + note each? or per-tree
  summary only? — align with behavioral's 1–5 pattern from [`002`](../tickets/002-feedback-rubric.md)).
- JSON schema fragment for Gemini `response_format` (flat, Gemini-safe subset).
- System instruction tone: coach, not examiner; cite specific gaps (Altium transcript is a good
  fixture — REST acronym, event-loop micro/macrotask confusion, CORS "why").
- How technical scoring relates to **multi-part trees** (one score per tree vs per part).

Authoring inspiration: Renesas/Altium spoken technical portion (browser URL flow, REST, HTTP/S,
CORS, event loop) — not a fixed replay.

## Answer

Pinned 2026-08-14 via grilling. Mirrors [`002`](002-feedback-rubric.md) shape; changes
dimension names, definitions, and **scoring grain** (one block per **question tree**).

### Scoring grain

**One rubric block per question tree**, not per `Question`. Gemini scores the whole tree from
all recordings in that tree (main + selected follow-ups). Notes must name the concrete gap
(e.g. “CORS: you said what, not why”). Individual questions are evidence only — not separate
score cards. Keeps the end-report deep dive readable ([022](022-unified-end-report-contract.md)
nests one of these blocks per technical tree).

### Dimensions (each scored 1–5 + a short written note)

1. **Correctness** — facts and mechanisms are right for the questions asked (e.g. REST
   acronym, HTTP vs HTTPS, microtask vs macrotask). Wrong or half-right claims hurt this
   score.
2. **Completeness** — the answers cover the important parts of the main prompt and follow-ups,
   not a thin surface pass. Missing “why” (e.g. CORS) hurts here even when the “what” is
   right.
3. **Clarity** — order, precision of terms, and how easy the spoken answer is to follow.
   Jumbled or vague wording hurts even when the idea is roughly right.

**No Delivery dimension** on technical — pace/fillers stay a behavioral concern ([002](002-feedback-rubric.md)).

### Overall + actionability (same as 002)

- **`interviewReady`** — advisory holistic boolean. Guidance only — it never gates.
- **`overallSummary`** — one or two sentences.
- **`fixIts`** — 1–3 concrete, specific suggestions (cite the miss). **No full model answer**
  or lecture script — the user rebuilds in their own words.

### Tone

**Direct but constructive.** Coach, not examiner. Name the gap plainly, always pair with how
to fix it. Cite specific misses from this tree’s answers (Altium-style fixtures are good
prompt examples: wrong REST expansion; micro/macrotask mix-up; CORS “what” without “why”).
Empty / inaudible audio: say so in `overallSummary`, score what you can, set
`interviewReady` to false.

### Feedback JSON fragment (Gemini `response_format`; flat, Gemini-safe)

Same top-level shape as behavioral; only dimension names change. The **app** attaches
`treeId` (and category) when building the end report — the model does not invent ids.

```json
{
  "dimensions": [
    { "name": "Correctness",  "score": 4, "note": "..." },
    { "name": "Completeness", "score": 3, "note": "..." },
    { "name": "Clarity",      "score": 4, "note": "..." }
  ],
  "fixIts": ["...", "..."],
  "overallSummary": "...",
  "interviewReady": false
}
```

### System-instruction intent (for implementers)

Coach who scores Correctness / Completeness / Clarity 1–5 + note on the **whole tree’s**
spoken answers; returns `fixIts`, `overallSummary`, advisory `interviewReady`; cites
concrete gaps; never writes a model answer. Exact prompt text is an implementation detail
for the build effort — this ticket pins the contract and tone.

### Unblocks

[Unified end report contract](022-unified-end-report-contract.md) — technical deep-dive
section uses this fragment.
