# Build scaffold — seniority / culture-fit interview mode

> **Superseded (2026-08-14).** Follow [`BUILD-unified-interview.md`](BUILD-unified-interview.md)
> instead. This doc is historical only.

This branch (`worktree-seniority-build`) is the **implementation** effort for the seniority mode.
The spec is the closed wayfinder map [`map-seniority-mode.md`](map-seniority-mode.md) (tickets
012–017); this scaffold turns it into a compiling, click-through skeleton with `TODO(NNN)` markers
tying every stub back to the ticket that specified it.

**It runs today** with mock data and no API key: `npm --prefix client run dev`, open the
**Seniority screen** tab, click Answer through the scripted interview, and land on a fully-rendered
mock report. Nothing calls Gemini yet.

## What's real vs stubbed

| Piece | File | State |
| --- | --- | --- |
| Two-tab shell, warn-on-switch | `client/src/AppShell.tsx` | **real** |
| Report contract types (015) | `client/src/seniority/report.ts` | **real** |
| Seed bank (016) | `client/src/seniority/seeds.ts` | **real** — five openings authored |
| Session phase machine (017) | `client/src/seniority/useInterviewSession.ts` | real machine, **mock script** |
| Start / Conversation / Report screens | `client/src/seniority/*.tsx` | **real UI**, stubbed inputs |
| Report generation (015) | `server/src/seniority.ts` | **mock report** |
| Live token endpoint (013) | `server/src/index.ts` `/api/live-token` | **501 stub** |

## Build order (fill the TODOs)

1. **`TODO(013)` — Live pipeline.** Implement `/api/live-token` (ephemeral token), then replace
   `MOCK_SCRIPT`/`submitAnswer` in `useInterviewSession.ts` with a real Live WebSocket: stream
   16 kHz PCM up, play native audio down, take input/output transcription for free. Wire the mic
   indicator + level meter in `ConversationScreen.tsx`. Reconnection stays invisible.
2. **`TODO(014)` — Interviewer.** Put the persona + protocol into the Live `systemInstruction`,
   seeded by `seed.opening`. Enforce the 15-min cap as a natural in-persona close.
3. ~~**`TODO(016)` — Seeds.** Author the five opening prompts against ticket 012's failure catalogue.~~
   Done — see `client/src/seniority/seeds.ts`.
4. **`TODO(015)` — Report.** Replace the mock in `server/src/seniority.ts` with a
   `gemini-3.6-flash` Interactions call, `response_format` = the flat SeniorityReport schema (never
   with `response_mime_type`). Prompt carries ticket 012's competency model.
5. **Persistence (017 §6).** Save each finished session (transcript + report JSON) to localStorage,
   mirroring the behavioral mode's ticket-010 shape. No history UI (deferred to fog).

## Checks

Same as the rest of the repo: `npm --prefix client run check` (Biome + tsc) and
`npm --prefix server run typecheck`.
