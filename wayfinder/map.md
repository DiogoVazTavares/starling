<!-- label: wayfinder:map -->

# Map: Voice-based behavioral interview trainer

## Destination

A build-ready spec for a browser-based behavioral-interview practice tool, **plus a thin
vertical slice** that proves the risky path end-to-end for one hardcoded question:
record a spoken answer → send audio to Gemini → get structured feedback → retry until happy.

## Notes

- **This map carries execution for the vertical slice** — overriding wayfinder's plan-only
  default. Everything *outside* the slice stays as spec (decisions), not built code.
- Platform: **web app** (browser). Mic via MediaRecorder.
- Slice pipeline: MediaRecorder → audio blob → **Gemini multimodal** → structured feedback.
  Transcribe-then-text-LLM is the documented fallback, not the slice path.
- Gemini (Vertex AI) is an org-approved model. This is a personal project.
- Skills to consult when resolving tickets: `/grilling`, `/domain-modeling`, `/prototype`,
  `/research`, `/impeccable` (UI), `/prototype` for the slice.

### Local-markdown tracker convention

No issue tracker is configured, so this map uses the local-markdown fallback:
- The map is this file (`wayfinder/map.md`), labelled `wayfinder:map`.
- Tickets are `wayfinder/tickets/NNN-slug.md`, each a child of this map.
- **Type**: `wayfinder:<research|prototype|grilling|task>` in the ticket header.
- **Claim**: set `Assignee:` in the ticket header before doing any work (empty = unclaimed).
- **Blocking**: `Blocked by:` header lists ticket numbers. A ticket is *unblocked* when all
  its blockers are `Status: closed`. The **frontier** = open + unblocked + unassigned.
- **Resolve**: append an `## Answer` section, set `Status: closed`, add a line to
  Decisions-so-far below.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- [Gemini audio-input API](tickets/001-gemini-audio-api.md) — `gemini-3.6-flash` via the
  Interactions API takes **inline base64** audio + returns JSON via `response_format`; a
  short answer is tiny/cheap. **WebM/Opus isn't accepted** → new format-strategy ticket (007).
  Full notes: [research/gemini-audio.md](research/gemini-audio.md).
- [Model choice: Gemini vs alternatives](tickets/008-model-choice-vs-alternatives.md) —
  **keep `gemini-3.6-flash`** (only option with audio-in + JSON-schema out + text-rate audio
  pricing); `gemini-3.5-flash` is the fallback. Gemma (30s cap, self-host) and OpenAI
  `gpt-audio` (no structured output) don't fit. Full notes:
  [research/model-comparison.md](research/model-comparison.md).
- [Decide browser-audio → Gemini-accepted format strategy](tickets/007-audio-format-strategy.md)
  — **client-side WAV, decode-then-encode**: MediaRecorder default → `decodeAudioData` →
  render through a **mono/16 kHz `OfflineAudioContext`** → **hand-rolled 16-bit WAV encoder**
  (no dep) → base64 inline. Server stays a thin proxy (no ffmpeg). ~5.8 MB for 3 min, well
  under 20 MB. Built browser-agnostic, verified on Chrome. **Unblocks 006.**
- [Design the feedback rubric](tickets/002-feedback-rubric.md) — 4 dimensions (STAR,
  specificity/ownership, relevance, delivery) scored **1–5 + note**, plus **1–3 fix-its**, an
  overall summary, and an **advisory** `interviewReady` flag (never gates — user judges & moves
  freely). Tone: direct but constructive. Defines the feedback JSON contract for 005 & 006.
- [Which `@google/genai` package/version to depend on](tickets/009-genai-sdk-package-choice.md) —
  keep **`@google/genai`** (the only live Gemini JS SDK; `@google/generative-ai` is archived and
  `@google-cloud/vertexai`'s Gen-AI module is past its removal date), **pin it exactly to
  `2.14.0`** (near-weekly minors, one patch release ever — a caret already broke this project),
  and **stay on the Interactions API**, which went GA in June 2026 — `generateContent` is now the
  *legacy* path, the reverse of what 006 assumed. Vertex is the same package but still calls
  Interactions "experimental" → re-check if that route is taken. Full notes:
  [research/genai-sdk.md](research/genai-sdk.md).
- [Web app stack + secure the Gemini key](tickets/004-stack-and-key.md) — **Vite + React + TS**
  client, **Hono + TS** server; `GEMINI_API_KEY` server-side only, browser calls `/api/feedback`
  which proxies to Gemini. Vite proxies `/api` → Hono in local dev (no CORS). Deploy deferred to fog.
- [Build the vertical slice](tickets/006-build-vertical-slice.md) — **✅ the risky path is proven.**
  Record → mono/16 kHz WAV in-browser → inline base64 → Gemini → rubric feedback → retry, working
  end-to-end in Chrome on a real spoken answer. Audio-native feedback quality is good enough to
  **keep the audio path** (008's transcribe-then-text fallback stays unbuilt). ~9 s per attempt.
  Code lives in `client/` + `server/`. One gotcha cost the first run: **never set
  `response_mime_type` alongside `response_format`** — see [research/gemini-audio.md](research/gemini-audio.md).
- [Define the question bank](tickets/003-question-bank.md) — **7 categories** (leadership,
  conflict, failure/mistake, teamwork/collaboration, ambiguity, impact/results,
  prioritization/time-management) **× 3 = 21 questions**, hand-curated fixed list, SW-flavored
  but not leveled by seniority. Shape: `{ id, category, prompt }`, no probes. Slice's existing
  question kept as-is, folded in as `conflict`'s first entry. Content authoring + wiring is a
  separate task (011); attempt-history persistence spun off as its own ticket (010).
- [Author the question bank + wire it into the app](tickets/011-build-question-bank.md) —
  **built.** `client/src/questions.ts` holds the 21-question bank; `client/src/App.tsx`
  navigates it (Previous/Next, clamped at both ends — no wrap-around). Category is in the data
  shape but not shown in the UI yet (deferred to 005). Verified end-to-end in a running dev
  server; `tsc -b`/`oxlint`/`vite build` all clean.

## Open tickets

<!-- the frontier: open + unblocked + unassigned -->

- [005 — Prototype the practice-screen UX](tickets/005-prototype-practice-ux.md) — unassigned.
- [010 — Persist attempt history across sessions](tickets/010-persist-attempt-history.md) —
  unassigned.

## Not yet specified

<!-- in-scope fog; graduates into tickets as the frontier advances -->

- Comparing attempts over time / surfacing improvement trends.
- Deployment / hosting (client static host + Hono on a Node host or serverless, with the
  Gemini key as a host secret). Deferred from ticket 004 — the slice runs locally.

## Out of scope

<!-- ruled beyond the destination; never graduates -->

- Turning this into a multi-user or distributable product — this is a personal tool.
