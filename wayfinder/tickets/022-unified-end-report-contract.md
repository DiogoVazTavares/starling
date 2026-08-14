# Unified end report contract (summary + category deep dives)

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz
- Blocked by:
- Parent: wayfinder/map-unified-interview.md

## Question

Pin the **one end report** JSON contract for full-session profiles:

1. **Session summary** — headline, overall performance, top fix-its (cross-category).
2. **Deep dives** — one section per category present in the session:
   - **Behavioral** — reuse [`002`](../tickets/002-feedback-rubric.md) dimensions per tree or
     aggregated.
   - **Technical** — per [023](023-technical-answer-rubric.md).
   - **Seniority** — migrate [`015`](../tickets/015-seniority-report-contract.md) *content* to
     **renamed schema** from map Notes: `scopeEvidence`, `questionBreakdown` (`realQuestion`,
     `yourAnswer`, `strongerMove`), `pushbackMoments`, `wordingIssues`; plain UI labels; **no
     frame tags in UI**.

Also pin:

- Single Gemini call vs one call per category (cost/latency/quality trade-off).
- Inputs: all session audio, transcripts, tree/part metadata, profile id.
- Behavioral drill profile **opts out** — still uses per-attempt feedback from 002, not this
  contract.

Depends on technical rubric [023](023-technical-answer-rubric.md).

## Answer

Pinned 2026-08-14 via grilling. One **end report** for profiles with `reportMode: endReport`.
Behavioral drill (`perAttempt`) does **not** use this contract — still 002 after each attempt.

### Call pipeline (three layers)

Not one mega-call. Category is on the **tree** ([018](018-unified-question-bank-schema.md)); a
tree is never mixed-category.

1. **Per-tree audio calls** (parallel) — each behavioral tree → [002](002-feedback-rubric.md);
   each technical tree → [023](023-technical-answer-rubric.md). App attaches `treeId`, category,
   title/theme. Do **not** batch all behavioral or all technical trees into one call (schema
   stability + retry scope).
2. **Seniority session audio call** (parallel with 1; skip if no seniority trees) — all
   seniority answers in the session (main + picked follow-ups) as audio, plus question text /
   order metadata. Returns the renamed 015 deep-dive object below.
3. **Summary text call last** — inputs are **prior score JSON only** (no second audio pass),
   each block tagged with `treeId`, category, title/theme. Returns the session summary.
   Always runs for `endReport` profiles.

Stack: Interactions + `response_format` (flat, Gemini-safe), same as 001/002/009.

### Assembled end-report object (UI contract)

```json
{
  "summary": {
    "headline": "…",
    "overallSummary": "…",
    "topFixIts": ["…", "…"]
  },
  "deepDives": {
    "behavioral": [
      {
        "treeId": "…",
        "title": "…",
        "dimensions": [ /* 002 */ ],
        "fixIts": ["…"],
        "overallSummary": "…",
        "interviewReady": false
      }
    ],
    "technical": [
      {
        "treeId": "…",
        "title": "…",
        "dimensions": [ /* 023 */ ],
        "fixIts": ["…"],
        "overallSummary": "…",
        "interviewReady": false
      }
    ],
    "seniority": { /* renamed 015 — omit key if no seniority trees */ }
  }
}
```

- UI order: **summary first**, then deep dives only for categories present.
- Empty category → omit key (or `[]` for behavioral/technical).
- **No** session-level `interviewReady` — advisory flags stay on per-tree 002/023 blocks only.

### Session summary (layer 3)

| Field | Role |
|-------|------|
| `headline` | One advisory line across the whole session — not a pass/fail |
| `overallSummary` | 1–2 sentences on how the session went across categories present |
| `topFixIts` | 1–3 cross-category “next interview” moves; strategy, not scripts |

### Seniority deep dive (layer 2) — 015 content, renamed schema

```json
{
  "headline": "…",
  "scopeEvidence": [
    { "tier": "self", "level": "strong", "note": "…", "quote": "…" },
    { "tier": "team", "level": "partial", "note": "…", "quote": "…" },
    { "tier": "business", "level": "notShown", "note": "…", "quote": "" }
  ],
  "questionBreakdown": [
    {
      "realQuestion": "…",
      "yourAnswer": "…",
      "strongerMove": "…",
      "frame": "Order-taker"
    }
  ],
  "pushbackMoments": [
    { "frame": "Order-taker", "reframed": true }
  ],
  "wordingIssues": [
    { "type": "we-not-i", "quote": "…", "note": "…" }
  ],
  "overallSummary": "…",
  "fixIts": ["…", "…"]
}
```

Rename map from 015: `ladder`→`scopeEvidence`, `probeDecode`→`questionBreakdown`
(`measuring`→`realQuestion`, `whatYouDid`→`yourAnswer`, `seniorMove`→`strongerMove`),
`framesFaced`→`pushbackMoments`, `flags`→`wordingIssues`; tier enums → `self`/`team`/`business`;
level enums → `notShown`/`partial`/`strong`.

**Enums (unchanged domains, new names where noted):**
- `tier`: `self | team | business`
- `level`: `notShown | partial | strong`
- `frame`: 012’s six (+ `none` on `questionBreakdown` only)
- `wordingIssues[].type`: `we-not-i | hedging | unquantified | passivity | frame-acceptance`

**UI:** plain English labels only (Self / Team / Business; Not shown / Partial / Strong;
“Pushback moments”). **`frame` stays in JSON for tally/decode corroboration; never shown as
tag names in the UI.**

Seniority keeps its own `overallSummary` + `fixIts` (section-local). Session `topFixIts` stay
cross-category. Still **no** seniority `interviewReady` (coaching lens, not a gate — 012/015).

Content rules inherit 015: quotes on tiers, strategy not scripts, Gemini computes wording
issues (no client pronoun heuristic).

### Handoff

- [020](020-unified-session-flow-ux.md) renders this object (summary → deep dives).
- Build effort wires the three-layer call pipeline; exact prompts are implementation detail.
