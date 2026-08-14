# AI follow-up picker contract (batch, pool-only)

- Type: wayfinder:research
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: 018
- Parent: wayfinder/map-unified-interview.md

## Question

After each submitted audio part, Gemini **picks the next follow-up** from the tree's pre-authored
pool — or decides the tree is **done** for this session. It must **not** invent new questions.

Pin:

- API shape: inputs (question tree id, part id, audio or transcript?, pool metadata, session
  history so far) → output (next part id | `done`).
- Model call: same batch Interactions + audio-in as behavioral [`001`](../tickets/001-gemini-audio-api.md),
  or text-only if a transcript is available from a prior step?
- Rules: skip follow-ups already covered well; go deeper on weak answers; max depth per tree;
  fallback when pool is exhausted.
- Latency budget between parts (user waits on screen — target UX).
- Failure modes: picker returns invalid id, Gemini timeout — what does the client do?

Depends on bank schema from [018](018-unified-question-bank-schema.md).

## Answer

Pinned 2026-08-14 via research. Full notes:
[wayfinder/research/follow-up-picker.md](../research/follow-up-picker.md).

### API shape

`POST /api/pick-follow-up` (same thin Hono + key story as `/api/feedback`):

```ts
interface PickerHistoryEntry {
  questionId: string;
  questionText: string;
  coverageNote?: string;
}

interface PickFollowUpRequest {
  treeId: string;
  answeredQuestionId: string;
  audioBase64: string; // mono 16 kHz WAV of the just-submitted answer
  candidates: Array<{
    id: string;
    text: string;
    tags?: string[];
    required?: boolean;
  }>;
  history: PickerHistoryEntry[]; // this tree only; prior turns as text
  followUpsAsked: number;
}

type PickFollowUpResponse =
  | { next: 'done' }
  | { next: string; reason?: string }; // next ∈ candidate ids
```

Client resolves the tree from the bank and sends remaining `candidates` (already excluding
asked ids). Server builds Gemini `response_format` with
`next.enum = [...candidateIds, "done"]` and **re-validates** `next`. No scores, fix-its, or
`interviewReady` on this endpoint — that stays with per-attempt feedback (drill) or
[022](022-unified-end-report-contract.md).

### Model call

Same stack as [001](001-gemini-audio-api.md) / `requestFeedback`: `gemini-3.6-flash`,
Interactions API, inline WAV for the **current** answer, text for pool + history. **No**
transcript prerequisite (STT fallback still unbuilt). **Picker-only** — do not combine with
end-report scoring. Empty pool → local `{ next: "done" }` with **no** Gemini call. Standard
tier only (never Flex).

### Selection rules

Server enforces; prompt states intent:

1. Never re-ask a `Question.id`.
2. Empty remaining → `done` (no call).
3. Default **`maxFollowUps = 2`** (main + up to two follow-ups). Cap limits asked depth, not
   pool size.
4. Cap hit and no remaining `required` → `done` (no call). Cap hit with `required` left →
   ask required next (deterministic by stable `id` sort); required **overrides** the cap.
5. Soft prompt rules: skip topics already covered well; probe weak/missing angles; use `tags`
   as hints; prefer `required` before finishing.

After the model: if it returns `done` while `required` remain → **override** to the first
remaining required.

### Latency

UX wait target **≈ 10 s** (grounded in measured ~9 s feedback on 006). Soft timeout **~25 s**,
then fallback. Progress UI is [020](020-unified-session-flow-ux.md).

### Failures

Invalid id / empty / non-JSON / Gemini timeout → **deterministic fallback** on the server
(prefer coerce to a safe 200): (1) first remaining `required` by `id`, (2) else first
remaining optional under cap, (3) else `done`. **Never invent** question text. **Never** stall
the session on Gemini. Infra/config errors keep the existing feedback status codes (400 / 413 /
500).

Unblocks mid-session loop on [020](020-unified-session-flow-ux.md). Authoring
[025](025-author-technical-trees-altium.md) / [026](026-convert-seniority-seeds-to-trees.md):
size pools above the depth cap; mark must-ask probes `required: true`; use useful `tags`.
