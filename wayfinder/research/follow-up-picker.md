# Research: AI follow-up picker (batch, pool-only)

_Asset for ticket [021 — AI follow-up picker contract](../tickets/021-ai-follow-up-picker.md).
Sources are Google's primary Gemini docs (Interactions API, audio, structured output, Flex
inference) and local stack patterns from tickets 001/006/018/019. Checked August 2026._

## TL;DR for the pin

- **New thin endpoint** `POST /api/pick-follow-up`: current-answer **WAV audio** + tree context →
  `{ next: QuestionId | "done" }`. Model must **not** invent questions; server validates against
  the remaining pool.
- **Reuse the proven batch path:** `gemini-3.6-flash` + Interactions API + inline base64 WAV +
  `response_format` JSON schema (same as `/api/feedback`). Prefer **audio-in for the just-
  submitted answer**; pass **prior turns as text summaries** (question id + text). Do **not**
  wait for a transcript pipeline — none exists today (010 stores feedback only).
- **Picker ≠ scorer for end-report profiles.** Selection only. Scoring stays with per-attempt
  feedback (Behavioral drill) or the end report ([022](../tickets/022-unified-end-report-contract.md)).
- **Hard rules on the server** beat prompt hope: empty remaining → `done` with **no Gemini call**;
  filter already-asked ids; cap depth; force remaining `required` before `done`.
- **UX wait target ≈ 10 s** (grounded in measured ~9 s feedback). Soft client timeout ~25 s, then
  **deterministic fallback** — never invent a question, never stall the session.

## What the product already locked

From [map-unified-interview.md](../map-unified-interview.md) and closed [018](../tickets/018-unified-question-bank-schema.md):

| Fact | Implication for 021 |
| --- | --- |
| Written question on screen → spoken answer; no Live interviewer | Batch HTTP after each submit, like today's feedback |
| `QuestionTree = { main, followUps[] }` unordered pool | Picker chooses among remaining follow-up **ids** or ends the tree |
| `tags?`, `required?` on follow-ups | Soft hints + hard “must ask before done” |
| Empty `followUps: []` OK (behavioral trees today) | Local short-circuit: after main → `done` |
| `reportMode`: `endReport` vs `perAttempt` | Mid-session pick does **not** need full rubric JSON for most profiles |
| Audio: mono 16 kHz WAV (007); Interactions + inline (001/006) | Same media path as `requestFeedback` |

Glossary: root [`CONTEXT.md`](../../CONTEXT.md) — speakable unit is **Question**; bank entry is
**Question tree**; follow-up pool is unordered.

## Local patterns to mirror

### Feedback call (proven)

[`server/src/gemini.ts`](../../server/src/gemini.ts) already does the shape 021 should copy:

- `getClient()` + `MODEL` (`gemini-3.6-flash`)
- `interactions.create` with `system_instruction`, text + `{ type: 'audio', data, mime_type: 'audio/wav' }`
- `response_format: { type: 'text', mime_type: 'application/json', schema }` — **never** also set
  `response_mime_type` (verified in [gemini-audio.md](./gemini-audio.md))
- Parse `interaction.output_text`; throw `BadGeminiResponseError` on empty / bad JSON / schema miss
- HTTP: [`POST /api/feedback`](../../server/src/index.ts) → 400 validation, 413 oversized audio,
  502 unusable Gemini, 500 missing key

Measured vertical-slice latency ([006](../tickets/006-build-vertical-slice.md)): **≈ 9 s**
(8.8 s even for a 2 s clip — dominated by model time, not audio length). Cost: ~32 tokens/sec of
audio at text rates on 3.6-flash ([model-comparison.md](./model-comparison.md)).

### Bank contract (018)

```ts
interface Question {
  id: string;
  text: string;
  tags?: string[];
  required?: boolean; // follow-ups only; default false
}

interface QuestionTree {
  id: string;
  category: 'behavioral' | 'technical' | 'seniority';
  theme?: string;
  main: Question;
  followUps: Question[]; // unordered pool
}
```

Ids are stable strings (`${treeId}-main`, `${treeId}-<slug>`). Do not reuse a `Question.id`
across trees.

## Gemini facts that matter for picking

### Interactions + audio

Primary docs:

- [Audio understanding | Gemini API](https://ai.google.dev/gemini-api/docs/audio)
- [Audio understanding — Interactions API](https://ai.google.dev/gemini-api/docs/interactions/audio)

Relevant limits (same as ticket 001 research):

- Inline audio OK under **20 MB** total request; Files API only above that.
- Formats include **WAV** (`audio/wav`).
- **32 tokens / second** of audio; max **9.5 hours** per prompt (irrelevant here).
- Documented capabilities include transcription, emotion detection, etc. — enough to judge whether
  an answer already covered a follow-up topic **without a separate STT step**.

### Structured output / enum classification

Primary docs:

- [Structured outputs — Interactions API](https://ai.google.dev/gemini-api/docs/interactions/structured-output)
- [Interactions breaking changes (May 2026)](https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026)

Facts:

- Configure `response_format` with `type: "text"`, `mime_type: "application/json"`, and a
  **JSON Schema** (or Zod). Only a **subset** of JSON Schema is supported — keep the picker
  schema **flat**.
- `string` supports **`enum`** for classification tasks — ideal for “pick one of these ids or
  done.”
- `null` is allowed via `"type": ["string", "null"]` if needed; prefer a single enum field
  including a sentinel `"done"` so the schema itself forbids invented ids.
- Model card: `gemini-3.6-flash` supports **Structured outputs** and **Audio** input
  ([models/gemini-3.6-flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash)).

### Latency tiers (do not use Flex for mid-session picks)

From [Flex inference — Interactions API](https://ai.google.dev/gemini-api/docs/flex-inference):

| Tier | Latency target | Fit for picker? |
| --- | --- | --- |
| **Standard** (default) | Seconds to minutes | **Yes** — mid-session wait |
| Priority | Low (seconds), higher cost | Optional later if Standard feels slow |
| Flex | **1–15 minutes**, sheddable | **No** — user waits on screen |
| Batch | Up to 24 h async | **No** |

Use the default Standard tier. Docs recommend **10+ minute** client timeouts only for Flex
queues — irrelevant here; use a short soft timeout instead (see Failure modes).

## API shape (recommended contract)

### Endpoint

`POST /api/pick-follow-up` on the Hono server (same auth / key story as `/api/feedback`).

### Request JSON

```ts
/** One prior Question already answered in this tree (this session). */
interface PickerHistoryEntry {
  questionId: string;
  questionText: string;
  /** Optional short note from a prior pick; omit if none. */
  coverageNote?: string;
}

interface PickFollowUpRequest {
  treeId: string;
  /** Question the candidate just answered (main or a follow-up). */
  answeredQuestionId: string;
  /** Base64 mono 16 kHz WAV of the just-submitted answer. */
  audioBase64: string;
  /**
   * Remaining candidates the model may choose from.
   * Client (or server after bank lookup) MUST already exclude asked ids.
   * Each entry carries text + tags + required for the prompt.
   */
  candidates: Array<{
    id: string;
    text: string;
    tags?: string[];
    required?: boolean;
  }>;
  /** Earlier answers in this tree only (not the whole session). */
  history: PickerHistoryEntry[];
  /**
   * How many follow-ups already asked after main in this tree.
   * Used with maxFollowUps (server default).
   */
  followUpsAsked: number;
}
```

**Who owns the bank lookup?** Prefer the **client** to resolve the tree from `@starling/bank`
(or today's bank module) and send `candidates` + `history`, matching today's thin server that
does not import the question list for `/api/feedback`. The server still **re-validates** that
`next` ∈ `candidates ∪ {"done"}` — never trusts the model alone.

Alternative ( equally fine once `packages/bank` exists): server loads `QUESTION_BANK` by
`treeId` and builds candidates itself. Same response contract either way.

### Response JSON

```ts
type PickFollowUpResponse =
  | { next: 'done' }
  | {
      next: string; // must be one of the request candidates' ids
      /** One short sentence: why this follow-up (debug / optional UI). */
      reason?: string;
    };
```

Keep `reason` optional and short. Do **not** put rubric scores, fix-its, or `interviewReady` on
this response — that belongs to feedback (drill) or [022](../tickets/022-unified-end-report-contract.md).

### Gemini `response_format` schema (per request)

Build the enum **dynamically** from remaining candidate ids so structured output constrains the
choice:

```ts
const pickerSchema = {
  type: 'object',
  properties: {
    next: {
      type: 'string',
      enum: [...candidateIds, 'done'],
      description:
        'Id of the next follow-up from the remaining pool, or "done" if no further question is needed.',
    },
    reason: {
      type: 'string',
      description: 'One short sentence explaining the choice.',
    },
  },
  required: ['next'],
} as const;
```

Parse like `parseFeedback`: reject empty `output_text`, non-JSON, or `next` outside the enum
(defense in depth if the API ever softens enum enforcement).

### Prompt sketch (system + user)

- **System:** You are an interview conductor. You only pick from the given pool or end the tree.
  You never invent questions or paraphrase new ones.
- **User text:** Just-answered question text; list of candidates (`id`, `text`, `tags`,
  `required`); history of prior questions in the tree; rules (prefer probing weak/uncovered
  areas; skip topics already covered well; prefer `required` before finishing; respect depth).
- **Input parts:** that text + current-answer audio (same pattern as `requestFeedback`).

## Model call: audio vs text; one call vs two

### Audio for the current answer — recommended

| Option | Cost / latency | Quality for picking | Fit |
| --- | --- | --- | --- |
| **Inline WAV of just-submitted answer** (like 001) | ~same order as feedback (~9 s); audio billed at text rates on 3.6-flash | Hears gaps, vagueness, topic coverage directly | **Recommended** |
| Text-only from a transcript | Faster / cheaper **if** transcript already exists | Needs a prior STT step | **Not available today** — 008 fallback unbuilt; 010 stores no transcript |
| Re-send **all** prior audios each pick | Cost and latency grow with depth | Marginal gain over history text | **Reject** |

**Pin:** current answer as **audio**; prior turns as **text** (`questionId` + `questionText`,
optional `coverageNote`). Do not block 021 on a transcript pipeline.

### Combine score + pick in one call?

| Profile `reportMode` | Recommendation |
| --- | --- |
| `endReport` (most profiles) | **Separate picker-only call.** No mid-session scores in the UI; full scoring is 022's job. Combining would invent a mid-session rubric contract and add schema weight. |
| `perAttempt` (Behavioral drill) | Today pools are **empty** → **no Gemini pick** (local `done`). If pools are authored later: keep **`/api/feedback`** as today, then call pick **or** short-circuit. Combining feedback+pick is optional later optimization, not v1. |

**Do not** fold end-report scoring into the picker. Ticket 022 owns that surface.

## Selection rules (server + prompt)

Apply **server-side before and after** the model. The prompt states intent; the server enforces
invariants.

### Before calling Gemini

1. Resolve remaining = pool − already asked (never re-ask the same `Question.id`).
2. If remaining is **empty** → return `{ next: "done" }` **without** a model call.
3. If `followUpsAsked >= maxFollowUps` **and** no remaining `required: true` → `{ next: "done" }`
   without a model call.
4. If `followUpsAsked >= maxFollowUps` **but** required remain → **do not** call Gemini; pick
   the next required deterministically (stable sort by `id`) — or still call Gemini **only among
   required**. Prefer deterministic: cheaper and predictable.

**Recommended default:** `maxFollowUps = 2` (main + up to 2 follow-ups). Enough for depth;
keeps full-session profiles (6–8 trees) from exploding wall-clock time. Authoring tickets
025/026 can size pools larger; the cap limits **asked** depth, not pool size.

### Soft rules for the prompt (model judgment)

- Skip a follow-up if the just-answered audio **already covered** that topic well.
- Prefer a follow-up that **probes a weak or missing** angle (use `tags` as hints, e.g.
  `ownership`, `preflight`, `why`).
- Prefer `required: true` candidates before optional ones when finishing is under consideration.
- Prefer going **deeper** on a weak answer over jumping to an unrelated optional tag.
- If the answer was empty / inaudible / off-topic, prefer a clarifying `required` or a broad
  depth tag; still only from the pool.

### After the model responds

1. If `next === "done"` but remaining includes `required: true` → **override**: pick the first
   remaining required (stable by `id`).
2. If `next` is not in remaining and not `"done"` → **invalid** → deterministic fallback
   (below).
3. Otherwise accept.

### Empty pool / exhausted / only required left

| Situation | Behavior |
| --- | --- |
| `followUps: []` after main | `{ next: "done" }`, no Gemini |
| Pool exhausted (all asked) | `{ next: "done" }`, no Gemini |
| Only optional left and depth cap hit | `{ next: "done" }` |
| Only required left (any depth) | Ask required next (model or deterministic) |
| Depth cap + required left | Ask required; ignore cap for required |

## Latency budget

| Signal | Number | Source |
| --- | --- | --- |
| Measured feedback round-trip | **≈ 9 s** (8.8 s for a 2 s clip) | Ticket [006](../tickets/006-build-vertical-slice.md) |
| Audio token rate | 32 tokens/s | [Audio docs](https://ai.google.dev/gemini-api/docs/audio) |
| Flex tier | 1–15 min | [Flex inference](https://ai.google.dev/gemini-api/docs/flex-inference) — avoid |

**UX target:** treat the between-parts wait like today's feedback wait — **about 10 seconds**,
with a clear progress state on screen (ticket [020](../tickets/020-unified-session-flow-ux.md)
owns the UI copy). Soft client/server timeout **~25 s**; on timeout use fallback and continue.
Do not promise Live-like sub-second turns — the map forbids Live as the session driver.

Wall-clock note for session design: e.g. 6 trees × (1 main + 2 follow-ups) × ~10 s pick ≈
**up to ~3 minutes** of pure wait across a session if every step hits the model. Empty-pool and
pre-call short-circuits cut that a lot for behavioral trees. Depth cap exists partly for this.

## Failure modes

Align with existing `/api/feedback` status codes where possible.

| Failure | Server | Client |
| --- | --- | --- |
| Missing / bad body, empty audio | **400** | Show error; stay on current Question; allow re-submit |
| Audio too large | **413** | Same as feedback |
| Missing `GEMINI_API_KEY` | **500** | Block with config message |
| Gemini transport / timeout / 5xx from API | **502** | **Deterministic fallback** (below); toast optional |
| Empty / non-JSON / schema-invalid `output_text` | **502** (`BadGeminiResponseError`) | Same fallback |
| Model returns id not in candidates | Treat as bad response → **502** or coerce in server | Prefer **server coerce** to fallback so the client always gets 200 with a safe `next` |

### Deterministic fallback (never invent)

When Gemini fails or returns garbage:

1. If any remaining `required: true` → pick first by stable `id` sort.
2. Else if remaining optional and under `maxFollowUps` → pick first by stable `id` sort.
3. Else → `{ next: "done" }`.

Rationale: continue the session with a pre-authored question or end the tree. **Never**
synthesize new question text. Optional: log `reason: "fallback"` server-side for debugging.

### Idempotency / double-submit

If the client retries the same answered turn, server should return a consistent pick for the
same `answeredQuestionId` + history, or the client should ignore a second response after it has
already advanced. Prefer client-side “in flight” lock (020 UX).

## Implications for sibling tickets

1. **020 (session UX)** — between submit and next Question, show a wait state sized for ~10 s;
   on failure, advance via fallback without a dead end.
2. **022 (end report)** — picker does not emit scores; store audio (or later transcripts) for the
   end-report call separately.
3. **025 / 026 (authoring)** — write pools with useful `tags` and mark must-ask probes
   `required: true`; size pools > `maxFollowUps` so the model has choice.
4. **008 transcript fallback** — still unneeded for picking if audio-in stays.

## Sources

- [Audio understanding | Gemini API](https://ai.google.dev/gemini-api/docs/audio)
- [Audio understanding — Interactions API](https://ai.google.dev/gemini-api/docs/interactions/audio)
- [Structured outputs — Interactions API](https://ai.google.dev/gemini-api/docs/interactions/structured-output)
- [Interactions API breaking changes (May 2026)](https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026)
- [Flex inference — Interactions API](https://ai.google.dev/gemini-api/docs/flex-inference)
- [gemini-3.6-flash model card](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash)
- Local: [gemini-audio.md](./gemini-audio.md), [model-comparison.md](./model-comparison.md),
  [`server/src/gemini.ts`](../../server/src/gemini.ts), [`server/src/index.ts`](../../server/src/index.ts),
  tickets [001](../tickets/001-gemini-audio-api.md), [006](../tickets/006-build-vertical-slice.md),
  [018](../tickets/018-unified-question-bank-schema.md), [019](../tickets/019-interview-profile-config.md)

---

## Recommended pin

Copy into ticket 021 **Answer**:

1. **API shape** — `POST /api/pick-follow-up` with
   `{ treeId, answeredQuestionId, audioBase64, candidates[], history[], followUpsAsked }` →
   `{ next: QuestionId | "done", reason? }`. Build Gemini JSON schema with
   `next.enum = [...candidateIds, "done"]`. Validate server-side. No scores on this endpoint.

2. **Model call** — Same stack as feedback: `gemini-3.6-flash`, Interactions API, inline WAV for
   the **current** answer, text for pool + history. **No** transcript prerequisite. **Picker-only**
   for `endReport` profiles; do not combine with 022 scoring. Behavioral drill with empty pool:
   local `{ next: "done" }` (no call). Standard tier only — never Flex.

3. **Selection rules** — Server short-circuit empty remaining / depth cap; never re-ask an id;
   `maxFollowUps = 2` default; `required` must be asked before `done` (override model if needed);
   tags are soft hints in the prompt; weak → deeper probe, covered → skip.

4. **Latency** — Target UX wait **~10 s** (grounded in ~9 s measured feedback). Soft timeout
   ~25 s then fallback.

5. **Failures** — Invalid / empty / timeout → deterministic fallback: next remaining `required`,
   else first remaining optional under cap, else `done`. Never invent questions; never block the
   session on Gemini.
