# Research: which `@google/genai` package/version to depend on

_Asset for ticket [009 — Which `@google/genai` package/version is the right one to depend on?](../tickets/009-genai-sdk-package-choice.md).
Sources are npm registry metadata, the `googleapis/js-genai` GitHub repo, the locally
installed SDK (`server/node_modules/@google/genai@2.14.0`), and Google's official docs
(checked July 2026)._

## TL;DR for the slice

- **`@google/genai` is the right — and now the only actively developed — package.** Both
  older alternatives are dead ends: `@google/generative-ai`'s GitHub repo is **archived**
  and its own description says *"This SDK is now deprecated, use the new unified Google
  GenAI SDK"*; `@google-cloud/vertexai`'s README carries an explicit notice that its
  Generative AI module **"will no longer be available after June 24, 2026"** — a date
  that has already passed.
- **Latest is `2.14.0`, published 2026-07-29** (the version already pinned). The `2.x` line
  ships roughly **weekly minor releases** (14 minors in ~12 weeks since `v2.0.0`). The
  `next` dist-tag (`2.9.0-rc.0`) is **stale** — it's older than current `latest`, so there is
  **no v3 in flight**. The only breaking change from v1→v2 was **scoped entirely to the
  Interactions API** (`outputs` → `steps`, `response_mime_type` → polymorphic
  `response_format`); Google's own release notes state `generateContent` was unaffected.
- **The Interactions API is GA on the surface this project uses** (Gemini Developer
  API / AI Studio key), as of June 2026, and Google now calls `generateContent`
  the "legacy" (but fully supported) path — the opposite framing from what ticket 006
  reactively assumed. **Caveat:** the identical API, documented on the Gemini Enterprise
  Agent Platform (Vertex) side, is still explicitly labeled **"an experimental API"** in
  docs dated 9 days more recent than the AI Studio GA announcement — a real, unresolved
  split worth flagging, not dismissing.
- **Recommend an exact pin, not a caret**: `"@google/genai": "2.14.0"`. This package has
  already broken this project once under `^1.x`; at a weekly-minor cadence, a caret left
  untouched for months is a guaranteed future surprise, and there's essentially no patch-only
  release tier that a tilde would meaningfully protect against.
- **Vertex AI changes the auth flags, not the package or the recommendation** — same
  `@google/genai`, same version — but it does change the Interactions-API stability
  picture (see above), so re-evaluate the Interactions-vs-`generateContent` call if this
  project ever switches off the AI Studio key.

## 1. Is `@google/genai` the current package, and how does it relate to the others?

Three packages exist in this space; only one is still actively developed.

| Package | Role | Status |
|---|---|---|
| **`@google/genai`** | Unified SDK for both the Gemini Developer API (AI Studio key) and the Gemini Enterprise Agent Platform (formerly "Vertex AI") | **Current — the only one still shipping new releases.** |
| `@google/generative-ai` | Original JS-only Gemini Developer API SDK | **Deprecated, repo archived.** |
| `@google-cloud/vertexai` | Original Vertex-specific SDK | **Deprecated, EOL date already passed.** |

**`@google/generative-ai`** (repo `google-gemini/generative-ai-js`):
- `gh api repos/google-gemini/generative-ai-js` returns `archived: true`, last push
  2025-12-02, and a repo **description** of *"This SDK is now deprecated, use the new
  unified Google GenAI SDK."*
- The repo's own README states: *"Please be advised that this repository is now
  considered legacy... Limited Maintenance: Development is now restricted to critical bug
  fixes only... End-of-Life Date: All support for this repository (including bug fixes)
  will permanently end on November 30, 2025."* That date has passed.
- npm confirms this in practice, not just in words: the latest published version,
  `0.24.1`, went out **2025-04-29** — over a year stale relative to today. The npm
  registry's `deprecated` flag on the package itself is *not* set (checked via
  `npm view @google/generative-ai deprecated` — empty), so don't rely on `npm install`
  warnings to catch this; the deprecation notice lives in the repo, not the registry
  metadata.

**`@google-cloud/vertexai`** (repo `googleapis/nodejs-vertexai`):
- Its npm README carries an explicit, dated notice (fetched from
  `registry.npmjs.org/@google-cloud/vertexai`): *"The `VertexAI` class and all its
  dependencies in the Vertex AI SDK are deprecated as of June 24, 2025 and will be removed
  on June 24, 2026. Please use the Google Gen AI SDK to access Gemini features."*
- Google Cloud's own migration guide
  ([Vertex AI SDK migration guide](https://cloud.google.com/vertex-ai/generative-ai/docs/deprecations/genai-vertexai-sdk))
  confirms the same date independently: *"The Generative AI module in the Vertex AI SDK is
  deprecated and will no longer be available after June 24, 2026,"* and its migration table
  names `@google-cloud/vertexai` specifically, listing `google-genai` /
  `@google/genai` as the replacement with "full feature parity."
- **That removal date has already passed** as of this research (July 2026).
- The `googleapis/nodejs-vertexai` GitHub repo is still active (pushed as recently as
  2026-07-29) but has been **repurposed**: it now hosts a narrower, newer package,
  `@google-cloud/agentplatform` (first published 2026-05-13, currently `0.10.0` — still
  pre-1.0), which handles prompt/dataset management, not model calls. Its own README
  tells you to call `models.generateContent()` via **`@google/genai`** for the actual
  model call — i.e. even the successor repo defers to `@google/genai` as the SDK for
  talking to Gemini.

**Migration story:** there is no live "should we pick a different package" question —
`@google/genai` is where all current and future Gemini JS/TS development happens, for
both backends, per Google's own migration docs.

## 2. Latest version, release cadence, and v1 → v2 breaking changes

- `npm view @google/genai dist-tags` → `{ next: '2.9.0-rc.0', latest: '2.14.0' }`.
  `2.14.0` published **2026-07-29** (per `npm view @google/genai time`), the day before this
  research. The already-pinned `^2.14.0` is current.
- **`next` is stale, not a live v3 preview.** `2.9.0-rc.0` was published 2026-06-16 and was
  superseded by the stable `2.9.0` three days later (2026-06-19); `next` was simply never
  moved forward. There is no v3 pre-release in flight — the "`next` tag showed
  `2.9.0-rc.0` at install time" observation in the ticket was a snapshot of an already-old
  tag, not a sign of imminent v3 churn.
- **Cadence since v2.0.0** (2026-05-07) through `2.14.0` (2026-07-29): 14 minor releases in
  ~12 weeks — close to weekly. Only one patch release exists in the entire `2.x` line
  (`2.0.1`, immediately after `2.0.0`); every release since has bumped the minor. This is a
  fast-moving package by any reasonable definition, even though it's past v2 GA.
- **v1 → v2 breaking changes** (from the [v2.0.0 GitHub release notes](https://github.com/googleapis/js-genai/releases/tag/v2.0.0)):
  > `⚠ BREAKING CHANGES - Interactions Only`
  > `Note: The breaking changes are only in interactions. GenerateContent usage in unaffected.`

  Specifically: the `outputs` array was replaced by a `steps` array; the old
  `response_mime_type` field was deprecated in favor of a new polymorphic
  `response_format`; and SSE event names were renamed (`interaction.start` →
  `interaction.created`, etc.). Full before/after detail lives in Google's
  [Interactions breaking-changes migration guide (May 2026)](https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026),
  which also states the **legacy Interactions schema was removed on June 8, 2026** — already
  past. `server/src/gemini.ts` already uses the new shape (`response_format:
  { type, mime_type, schema }`, no reliance on `outputs`), so it is unaffected by any of
  this.
- **Net read:** v2 is the current, sole major version, with `generateContent` rock-solid
  across the whole v1→v2 transition, but the package as a whole — and specifically the
  Interactions corner — is still evolving at a real clip. "GA" here means "stable enough to
  recommend for new projects," not "frozen."

## 3. Is the Interactions API stable?

Yes, on the surface this project actually uses — with one real caveat on the Vertex side.

- **Explicit GA statement**, from
  [ai.google.dev's Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
  (page last updated 2026-07-21, and repeated as a site-wide banner):
  > "The Interactions API is now generally available. We recommend using this API for
  > access to all the latest features and models."
  >
  > "The Interactions API is the best way to build with Gemini models and agents. As of
  > June 2026, it is Generally Available and recommended for all new projects. While it is
  > now considered legacy, the original `generateContent` API remains fully supported."

  This flips the assumption in the ticket: it's not that Interactions is the risky new
  thing and `generateContent` is the safe fallback — Google now frames it the other way,
  and states plainly: *"Going forward, all new models, multimodal capabilities, tools, and
  agentic features will launch on the Interactions API."*
- **The installed SDK's own type declarations don't flag it as unstable.** Grepping
  `server/node_modules/@google/genai/dist/genai.d.ts` for `@experimental`/`@preview`/`Beta`
  turns up plenty of hits — but they're all elsewhere: built-in MCP support, the SDK's
  tuning implementation, embedding batch jobs, Vertex dataset-destination fields. Neither
  the `GeminiNextGenInteractions` class (what `client.interactions` returns) nor the
  `output_text` field carries any such annotation. `output_text`'s only doc comment is:
  *"Concatenated text from the last model output... Note: this is added by the SDK."*
- **`output_text` is documented, first-party sugar, not an implementation accident.** The
  breaking-changes guide itself uses it in its "recommended" code sample: *"Response access
  (Recommended sugar): `console.log(interaction.output_text)`,"* with a pointer to a
  dedicated "SDK convenience properties" section (alongside `output_image`,
  `output_audio`) in the overview docs.
- **`response_format: { type, mime_type, schema }` is the current, non-deprecated shape** —
  it's the exact replacement introduced by the May 2026 breaking change for the old
  `response_mime_type` field, not a leftover about to be removed.
- **The real caveat — this isn't uniform across backends.** The parallel doc for the same
  API on the Vertex side,
  [Interactions API | Gemini Enterprise Agent Platform](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/interactions-api)
  (last updated 2026-07-17 — *more recent* than the AI-Studio-side GA page), states
  plainly: *"The Interactions API is an experimental API that allows developers to build
  generative AI applications using generative models and agents hosted on Gemini
  Enterprise Agent Platform,"* and exposes it at a `v1beta1` REST path. Its own streaming
  example still shows `interaction.status_update`, an event type the Developer-API
  breaking-changes guide says was already replaced back in May 2026 — a sign the
  Vertex-side docs (and possibly the underlying behavior) haven't caught up to the
  Developer-API's GA schema. **Could not verify** whether this is purely a docs-lag issue
  or reflects an actual behavioral difference on Vertex; treat it as an open question if
  this project ever moves off the AI Studio key.
- **What staying on `generateContent` would cost, if chosen instead:** per the same
  overview page, `generateContent` currently has a few things Interactions doesn't yet:
  `video_metadata` (video clipping/frame-rate control), the Batch API, Python automatic
  function calling, explicit caching, and custom safety settings. None of these are used
  by this project's audio-feedback flow, so there's no real cost to staying on Interactions
  for the AI Studio path specifically.

## 4. Pinning strategy

**Recommendation: exact pin, no caret or tilde.**

```json
"@google/genai": "2.14.0"
```

Reasoning:
- This is a personal project that may sit untouched for months and then get picked back up
  with `npm install`. A caret (`^2.14.0`) already caused a real incident: `^1.x` silently
  resolved to `1.52.0`, whose model union stopped at `gemini-3.1-*` and whose Interactions
  API had no `output_text` — the exact failure mode an unattended caret produces.
- At a near-weekly minor-release cadence, "wait a few months, then `npm install`" with a
  caret range means resolving to a version that didn't exist when the code was last tested,
  written, and understood — with no changelog review in between.
- A tilde (`~2.14.0`) would only guard against minor bumps, but this package barely uses
  patch releases at all in the `2.x` line (one patch, `2.0.1`, ever) — every other release
  bumps the minor. A tilde here offers close to zero practical protection over a caret; the
  only range that actually freezes behavior is an exact version.
- Pair the exact pin with a committed lockfile (`server/package-lock.json`) so `npm ci`
  reproduces the exact same install after a dormancy period, and treat any future bump as a
  deliberate, reviewed action (check `npm view @google/genai versions`/CHANGELOG, skim the
  intervening release notes for Interactions-specific changes) rather than something semver
  resolves automatically.

## 5. Does this change under Vertex AI?

**Package and version: no. Stability picture for Interactions: possibly, yes.**

- The **same `@google/genai` package and version** serves both backends. The installed
  SDK's own README shows Vertex/Enterprise initialization as a same-package option
  (`new GoogleGenAI({ enterprise: true, project, location })` or the older
  `{ vertexai: true, ... }`), and Google's own
  [Gemini Developer API vs. Gemini Enterprise Agent Platform](https://ai.google.dev/gemini-api/docs/migrate-to-cloud)
  guide shows the identical `@google/genai` import and `models.generateContent` call for
  both, differing only in the constructor options. The SDK's type declarations
  (`dist/genai.d.ts`) even show the terminology migration in progress: `enterprise?:
  boolean` is documented as *"recommended instead"* of the older `vertexai?: boolean` flag
  — both work, `enterprise` is the forward-looking name, mirroring the
  "Vertex AI" → "Gemini Enterprise Agent Platform" rebrand.
- **Interactions API existence:** yes, it exists on the Vertex/Enterprise side too (see
  §3) — but per the Google Cloud reference doc dated 2026-07-17, it is still explicitly
  labeled **"an experimental API"** there, at a `v1beta1` path, versus GA on the AI Studio
  side per docs dated four days later. This is the one place where "does the answer change
  under Vertex" is a real yes: **if this project ever switches from the AI Studio key to
  Vertex AI/Gemini Enterprise Agent Platform auth (the org-approved route per ticket 001),
  re-open the Interactions-vs-`generateContent` question for that path specifically** —
  don't assume the AI-Studio-side GA verdict carries over.
- **`@google-cloud/vertexai` is not an option either way.** Its Generative AI module's
  documented removal date (June 24, 2026) has already passed; `@google/genai` with
  `enterprise: true` is the only supported route into Vertex/Enterprise now, per Google
  Cloud's own migration guide (§1).

## Recommendation

- **Package:** keep `@google/genai` — it's the only actively developed SDK for Gemini in
  JS/TS, for both AI Studio and Vertex/Enterprise Agent Platform. High confidence; confirmed
  by primary sources on both deprecated alternatives (archived repo + repo-description
  deprecation notice for `@google/generative-ai`; dated, explicit EOL notice from two
  independent Google sources for `@google-cloud/vertexai`).
- **Version:** pin exactly to **`2.14.0`** (the current true `latest`, published 2026-07-29)
  — drop the caret in `server/package.json`. High confidence this is the right pinning
  *strategy* for a dormant personal project; the exact version will of course drift as the
  package keeps shipping weekly, so treat any future bump as deliberate, reviewed work.
- **API surface:** stay on the **Interactions API** (`client.interactions.create`,
  `response_format`, `output_text`) for the current AI-Studio-key setup — it's GA, it's
  where Google says new features land first, and nothing it currently lacks
  (video metadata, Batch API, custom safety settings, etc.) matters for this project.
  Medium-high confidence — the one real unresolved thread is the Vertex-side docs still
  calling the identical API "experimental" a few days after the AI-Studio side declared it
  GA; that's a genuine, dated discrepancy in Google's own material, not a guess on my part,
  and it's reason enough to re-check this specific question if the project ever moves to
  Vertex auth rather than assuming the answer travels with the package.

## Implications for the map

1. **Ticket 009 can close** with: keep `@google/genai`, re-pin `server/package.json` from
   `^2.14.0` to exact `2.14.0`, keep the Interactions API for the AI-Studio-key path.
2. **If ticket 001's "Vertex AI, org-approved route" is ever picked up**, treat the
   Interactions-vs-`generateContent` choice as needing a fresh, Vertex-specific check —
   the Gemini Enterprise Agent Platform's own reference docs (as of 2026-07-17) still call
   Interactions "experimental" there, unlike the AI-Studio-side GA status this project
   currently relies on.
3. **Worth a note wherever dependency-update process gets documented** (if it ever does for
   this personal project): bumping `@google/genai` should mean actually reading the
   intervening release notes for Interactions-specific breaking changes, not just running
   `npm update` — this package has already demonstrated it will make breaking changes to
   that surface inside what looks like routine version churn.

## Sources

- [googleapis/js-genai — GitHub repo](https://github.com/googleapis/js-genai)
- [js-genai v2.0.0 release notes](https://github.com/googleapis/js-genai/releases/tag/v2.0.0)
- [@google/genai — npm registry](https://registry.npmjs.org/@google/genai) (via `npm view` / raw registry JSON)
- [@google/generative-ai — npm registry](https://registry.npmjs.org/@google/generative-ai)
- [google-gemini/generative-ai-js — GitHub repo](https://github.com/google-gemini/generative-ai-js) (archived; repo description states deprecation)
- [@google-cloud/vertexai — npm registry](https://registry.npmjs.org/@google-cloud/vertexai) (README deprecation notice)
- [googleapis/nodejs-vertexai — GitHub repo](https://github.com/googleapis/nodejs-vertexai) (now hosts `@google-cloud/agentplatform`)
- [@google-cloud/agentplatform — npm registry](https://registry.npmjs.org/@google-cloud/agentplatform)
- [Interactions API | Gemini API — ai.google.dev](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Interactions API: Breaking changes migration guide (May 2026) — ai.google.dev](https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026)
- [Gemini Developer API vs. Gemini Enterprise Agent Platform — ai.google.dev](https://ai.google.dev/gemini-api/docs/migrate-to-cloud)
- [Interactions API | Gemini Enterprise Agent Platform — docs.cloud.google.com](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/interactions-api)
- [Vertex AI SDK migration guide (deprecations) — cloud.google.com](https://cloud.google.com/vertex-ai/generative-ai/docs/deprecations/genai-vertexai-sdk)
- Local install: `server/node_modules/@google/genai/{package.json,README.md,dist/genai.d.ts}` (v2.14.0)
