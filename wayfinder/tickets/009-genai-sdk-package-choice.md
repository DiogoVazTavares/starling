# Which `@google/genai` package/version is the right one to depend on?

- Type: wayfinder:research
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

The slice (006) currently pins `@google/genai@^2.14.0`, chosen reactively: `^1.x` resolved to
1.52.0, whose model union stopped at `gemini-3.1-*` and whose Interactions API had no
`output_text`. That was a fix, not a decision. Establish the actual answer:

- **Is `@google/genai` the right package at all?** How does it relate to the older
  `@google/generative-ai`, and to the Vertex AI client libraries (`@google-cloud/vertexai`)?
  Which are current, which are deprecated, and what's the migration story?
- **What is the latest version**, and what is the release cadence / stability signal? Is v2 GA or
  still moving? Are there v3 pre-releases (`next` tag showed `2.9.0-rc.0` at install time)?
- **Is the Interactions API stable** (`client.interactions.create`, `response_format`,
  `output_text`), or preview-tier surface that could break under us?
- **What should we pin?** Caret, tilde or exact — weighed against a personal project that may sit
  untouched for months and must still work when picked back up.
- Does the answer change if we ever move from an AI Studio API key to Vertex AI (the
  org-approved route noted in ticket 001)?

Deliverable: the recommendation recorded in the ticket answer, with the reasoning captured in
`wayfinder/research/genai-sdk.md` alongside the existing research assets.

## Answer

**Keep `@google/genai`, pin it exactly to `2.14.0`, stay on the Interactions API.** Full
reasoning and citations: [research/genai-sdk.md](../research/genai-sdk.md).

### Package — `@google/genai`, and there is no live alternative

It's the only actively developed Gemini SDK for JS/TS, and it serves **both** backends.
Both alternatives are dead ends, on the record:

- `@google/generative-ai` — GitHub repo **archived**, its description reading "This SDK is now
  deprecated, use the new unified Google GenAI SDK". Last npm publish `0.24.1`, April 2025.
  **Its npm `deprecated` flag is not set**, so `npm install` will not warn you — the notice
  lives only in the repo.
- `@google-cloud/vertexai` — its README says the Generative AI module "will be removed on
  June 24, 2026", a date **already passed**, and Google Cloud's migration guide names
  `@google/genai` as the full-parity replacement.

### Version — exact pin, not a caret

`"@google/genai": "2.14.0"` (applied; lockfile regenerated, server still typechecks).

`2.x` ships **near-weekly minors** — 14 in ~12 weeks — and has exactly **one** patch release in
the whole line (`2.0.1`). So a tilde would protect against almost nothing, and a caret on a
project that sits dormant for months resolves to a version that didn't exist when the code was
last understood. That is precisely how this project got bitten already (`^1.x` → `1.52.0`,
no `output_text`, model union stopping at `gemini-3.1-*`). Future bumps should be deliberate,
with the intervening release notes actually read.

The `next` dist-tag (`2.9.0-rc.0`) is **stale, not a v3 preview** — it predates the current
`latest` and was superseded by stable `2.9.0` three days after publication. No v3 is in flight.

### API surface — Interactions, and ticket 006 had this backwards

Interactions went **GA in June 2026**, and Google now labels `generateContent` the "legacy"
(though fully supported) path, stating all new models and multimodal capabilities land on
Interactions first. The v1→v2 breaking changes were scoped *entirely* to Interactions
(`outputs` → `steps`, `response_mime_type` → polymorphic `response_format`), and
`server/src/gemini.ts` already uses the post-change shape. `output_text` is documented
first-party sugar, not an accident. Nothing Interactions currently lacks (video metadata,
Batch API, explicit caching, custom safety settings) matters to this project.

### The one unresolved thread — Vertex

The **package and version are identical** under Vertex; only the constructor changes
(`enterprise: true`, which the SDK documents as "recommended instead" of the older
`vertexai: true` — mirroring the "Vertex AI" → "Gemini Enterprise Agent Platform" rebrand).

But the *stability picture* does not travel with the package. The Gemini Enterprise Agent
Platform reference docs — dated **more recently** than the AI Studio GA announcement — still
call the identical Interactions API **"an experimental API"** at a `v1beta1` path, with
streaming examples using event names the Developer-API guide says were replaced back in May
2026. Whether that's docs lag or real behavioural drift **could not be verified**. So: if
ticket 001's org-approved Vertex route is ever picked up, re-open the
Interactions-vs-`generateContent` question **for that path specifically** rather than assuming
this ticket's verdict carries over.
