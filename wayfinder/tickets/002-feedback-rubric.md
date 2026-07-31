# Design the feedback rubric

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

What does "good feedback" on a behavioral answer look like — the brain of the product?

- Which dimensions are scored/commented on? (e.g. STAR structure — Situation/Task/Action/
  Result; specificity & evidence; conciseness; relevance to the question; delivery: pace,
  filler words, confidence.)
- Is feedback scored (per-dimension scores / an overall bar) or purely qualitative?
- What defines "good enough" so the retry loop can end — a score threshold, a checklist all
  green, or purely the user's own judgment?
- Tone of the feedback: encouraging coach vs blunt hiring-manager? How direct?
- Output shape the LLM must return (feeds the prompt + UI feedback panel).

Deliverable: a written rubric + the feedback JSON shape, recorded in the ticket answer.

## Answer

### Dimensions (each scored 1–5 + a short written note)

1. **STAR structure** — clear Situation, Task, Action, Result; flags missing/weak parts.
2. **Specificity & ownership** — concrete details, metrics/outcomes, and "I" vs "we"
   (the candidate's *personal* contribution). The #1 failure mode is vagueness.
3. **Relevance to the question** — answered what was actually asked, without drifting.
4. **Delivery** — tone, pace, filler words, confidence, inferred from the audio.
   **Honesty caveat:** pace and filler-word judgments are approximate impressions, not
   hard metrics — the prompt must frame them as such (precise WPM/counts would need
   transcript + duration; out of scope for the rubric itself).

### Overall + actionability

- **`interviewReady`** — an advisory holistic boolean. **Guidance only — it never gates.**
  The user decides when an answer is good enough and navigates freely (see cross-cutting
  note below).
- **`overallSummary`** — one or two sentences.
- **`fixIts`** — 1–3 concrete, specific suggestions for the next attempt
  (e.g. "quantify the result", "cut the 30s of backstory"). **No full model answer** — keeps
  the user building their own words rather than parroting.

### Tone

**Direct but constructive.** Name weaknesses plainly, always paired with how to fix them —
a mentor who respects your time. Not a blunt hiring manager, not a soft cheerleader.

### Feedback JSON shape (fed to Gemini `response_format`; kept flat per ticket 001)

```json
{
  "dimensions": [
    { "name": "STAR structure",          "score": 4, "note": "..." },
    { "name": "Specificity & ownership", "score": 3, "note": "..." },
    { "name": "Relevance",               "score": 5, "note": "..." },
    { "name": "Delivery",                "score": 3, "note": "..." }
  ],
  "fixIts": ["...", "...", "..."],
  "overallSummary": "...",
  "interviewReady": false
}
```

An array of `{name, score, note}` (rather than deep nesting) stays within Gemini's supported
schema subset. This shape is the contract for the slice (006) and the prototype UI (005).

### Cross-cutting decision — free navigation (not a gate)

The user drives the loop: they judge "good enough" themselves and move to the **next/previous
question freely** — there is no "pass to unlock" progression. This is a product-flow decision
surfaced here; it informs the practice-screen prototype (005) and the question-bank/session
model (003). Beyond the slice, which uses a single hardcoded question.

### Fallback note (from ticket 008)

If audio-native feedback quality ever disappoints, the same rubric/JSON shape can be produced
from a transcript (via `gpt-4o-transcribe`/Deepgram) fed to a text LLM — the rubric is
model-agnostic. Not built now.
