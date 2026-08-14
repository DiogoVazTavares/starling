# Define unified question bank schema (trees + categories)

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by:
- Parent: wayfinder/map-unified-interview.md

## Question

Pin the **one bank** data shape for unified Starling:

- Top-level **categories** for v1: `behavioral` | `technical` | `seniority`.
- A **tree** = one bank entry: main prompt + a **follow-up pool** (pre-authored parts, not
  generated live). One **audio recording per part** (main counts as a part).
- How parts are identified (`id`, order hints, `required` vs `optional` in pool, tags for the
  follow-up picker).
- How existing assets fold in: 21 behavioral prompts from [`011`](../tickets/011-build-question-bank.md)
  (flat → trees with empty or minimal pools?), seniority **seeds** from [`016`](../tickets/016-scenario-role-seeding.md)
  (openers → tree mains?), Altium technical topics as new trees (authoring is ticket 025).
- TypeScript types location (`client/src/` vs shared) and naming.

Deliverable: a pinned `{ id, category, … }` contract with at least one example tree per category,
ready for 021 (follow-up picker) and 025/026 (authoring) to build on.

## Answer

Pinned 2026-08-14 via grilling. Speakable unit is **`Question`** (not “part”). Bank entry is
**`QuestionTree`**. Package: **`@starling/bank`**.

### Contract

```ts
type InterviewCategory = 'behavioral' | 'technical' | 'seniority';

type BehavioralTheme =
  | 'leadership'
  | 'conflict'
  | 'failure'
  | 'teamwork'
  | 'ambiguity'
  | 'impact'
  | 'prioritization';

interface Question {
  id: string;
  text: string;           // written on screen; one audio answer
  tags?: string[];        // picker hints; default []
  required?: boolean;     // follow-ups only; default false. Main is always asked.
}

interface QuestionTree {
  id: string;
  category: InterviewCategory;
  theme?: BehavioralTheme | string; // use BehavioralTheme when category === 'behavioral'
  main: Question;
  followUps: Question[];  // unordered pool; picker (021) chooses — no order field
}

declare const QUESTION_BANK: QuestionTree[];
```

**Shape:** `main` + `followUps` (split fields). Same `Question` type in both.

**Ids**

| Entity | Rule | Example |
|--------|------|---------|
| Tree | kebab, unique in bank | `conflict-difficult-feedback` |
| Main | `${treeId}-main` | `conflict-difficult-feedback-main` |
| Follow-up | `${treeId}-<slug>` | `tech-cors-why-exists` |
| Behavioral trees | Keep today’s 21 question ids as **tree** ids | history can map |

Do not reuse a `Question.id` across trees.

**Home:** `packages/bank` published as `@starling/bank` (types + `QUESTION_BANK`). Target monorepo
layout is `packages/{client,server,bank}`; **only the bank package is pinned here**. Moving
`client/` and `server/` is ticket [027](027-monorepo-packages-layout.md).

### Fold existing assets

| Source | Decision |
|--------|----------|
| 21 behavioral (`client/src/questions.ts`) | **B1:** one tree each; `theme` = old category; `main.text` = old `prompt`; `followUps: []` until pools are authored |
| 5 seniority seeds (016 / `SEED_BANK`) | **S1:** one tree each; rewrite seed as **fixed on-screen** `main.text` (not Live “Open by inviting…” instructions); pools in [026](026-convert-seniority-seeds-to-trees.md) |
| Technical / Altium | Empty until [025](025-author-technical-trees-altium.md) |

### Example trees (one per category)

```ts
// Behavioral — empty pool OK for Behavioral drill
{
  id: 'conflict-difficult-feedback',
  category: 'behavioral',
  theme: 'conflict',
  main: {
    id: 'conflict-difficult-feedback-main',
    text: 'Tell me about a time you had to give difficult feedback to a colleague.',
  },
  followUps: [],
}

// Seniority — main wording is illustrative; 026 owns final text + pool
{
  id: 'seniority-proud-of',
  category: 'seniority',
  main: {
    id: 'seniority-proud-of-main',
    text: 'Tell me about a piece of work you are genuinely proud of.',
  },
  followUps: [
    {
      id: 'seniority-proud-of-scope',
      text: 'What was the scope of that work — just your tasks, or something that affected the team or business?',
      tags: ['scope', 'tier-reach'],
    },
    {
      id: 'seniority-proud-of-own-role',
      text: 'What did you personally own versus what others owned?',
      tags: ['ownership', 'we-not-i'],
      required: true,
    },
  ],
}

// Technical — illustrative; 025 owns the real Altium-inspired set
{
  id: 'tech-cors',
  category: 'technical',
  main: {
    id: 'tech-cors-main',
    text: 'What is CORS, and why do browsers enforce it?',
  },
  followUps: [
    {
      id: 'tech-cors-why-exists',
      text: 'Why does CORS exist — what attack or failure mode is it preventing?',
      tags: ['why', 'security'],
      required: true,
    },
    {
      id: 'tech-cors-simple-vs-preflight',
      text: 'When does a browser send a preflight request, versus a simple request?',
      tags: ['preflight', 'depth'],
    },
  ],
}
```

### Unblocks

021 (picker), 025 (technical authoring), 026 (seniority trees). Glossary: root `CONTEXT.md`.
