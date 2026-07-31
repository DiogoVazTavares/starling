# Define the question bank

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

What questions does the user practice against, and where do they come from?

- Categories to cover (e.g. leadership, conflict, failure, teamwork, ambiguity, impact)?
- Roughly how many questions total for a useful bank?
- Source: hand-curated fixed list, categorized set, or LLM-generated on demand?
- Any tailoring to the user's target roles / seniority (SW engineering)?
- Data shape for a question (id, category, prompt text, optional follow-up probes)?
- For the slice: which single hardcoded question do we use?
- Note (from ticket 002): navigation is **free** (next/previous, no gating), so the session
  model doesn't need pass/lock state — just a way to move through questions.

Deliverable: the question-bank model + the slice's hardcoded question, in the ticket answer.

## Answer

### Categories (7)

**Leadership, conflict, failure/mistake, teamwork/collaboration, ambiguity, impact/results,
prioritization/time-management.** The standard behavioral-interview taxonomy. "Communication"
was deliberately left out as its own category — it overlaps with **delivery**, which the
rubric (ticket 002) already scores separately; a category should describe a *situation type*,
not a dimension of how it's told.

### Size

**3 questions per category → 21 total.** Enough variety that repeated practice sessions don't
repeat the same question, small enough to hand-curate with care rather than pad with filler.
Growing the bank later is cheap (append entries) — no reason to over-build up front.

### Source

**Hand-curated fixed list**, baked into the repo as static data. Not LLM-generated on demand:
generation adds cost, latency, and non-determinism (risk of duplicate/low-quality questions)
for no benefit at this scale, and a fixed list keeps categories stable and answerable later
("which category am I weak in").

### Tailoring

**SW-engineering flavored, not leveled.** Questions are written with software engineering as
the implicit context (code review, incidents, sprint planning, etc.) but aren't forked by
seniority (IC vs. staff vs. manager) — this is a personal tool for one target role, and
behavioral *questions* are largely seniority-agnostic even though answers aren't.

### Data shape

```ts
interface Question {
  id: string;         // stable slug, e.g. "conflict-code-review-pushback"
  category: Category; // one of the 7 categories, as a union type
  prompt: string;      // the "Tell me about a time..." text
}
```

No follow-up-probes field. A probe would be a scripted secondary question asked after the
initial answer (e.g. "what would you do differently?"), turning the single-shot record →
feedback → retry loop into a multi-turn flow — bigger scope than the current product. Additive
later if wanted; not a breaking change.

### Session model

No pass/lock state (per ticket 002's free-navigation decision) — just a way to move
next/previous through the 21 questions.

### The slice's hardcoded question

**Keep the existing question as-is:** *"Tell me about a time you had to give difficult
feedback to a colleague."* It already fits the `conflict` category cleanly and is proven
end-to-end (ticket 006) — no reason to touch working code to swap wording. It becomes
`conflict`'s first bank entry rather than a one-off.

### Scope note — spun off

Persisting attempt history (so retries can be reviewed as a "conversation," across sessions,
not just in-memory) came up during this ticket's interview but is materially separate scope
(storage architecture, first stateful requirement in the project) — captured as new ticket
[010](010-persist-attempt-history.md) instead of folded in here.

### Follow-on

This ticket defines the *model*, not the content — authoring the actual 21 question prompts
and wiring the bank into the client/server is a `wayfinder:task`, tracked as new ticket
[011](011-build-question-bank.md), blocked by this ticket.
