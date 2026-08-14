# Voice-based behavioral interview trainer

Record a spoken answer to a behavioral interview question, get structured coaching feedback
back, retry until you're happy.

This repo currently holds the **vertical slice** (wayfinder ticket 006): one hardcoded question,
no persistence, no auth. The spec and the decisions behind it live in [`wayfinder/`](wayfinder/) —
start at [`wayfinder/map.md`](wayfinder/map.md).

## Layout

| Path               | What it is                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| `packages/client`  | Vite + React + TS. Mic capture, WAV conversion, the practice screen.    |
| `packages/server`  | Hono + TS. Holds `GEMINI_API_KEY` and proxies the Gemini call.          |
| `packages/bank`    | `@starling/bank` — question trees (behavioral, technical, seniority).   |
| `wayfinder/`       | The map, tickets and research that specify the product.                 |

npm workspaces at the repo root link the three packages.

## Running it

You need a [Google AI Studio](https://aistudio.google.com/apikey) API key.

```sh
cp packages/server/.env.example packages/server/.env   # then put your key in it
npm install
```

Two processes, in two terminals:

```sh
npm run dev:server   # http://localhost:8787
npm run dev:client   # http://localhost:5173
```

Open http://localhost:5173 and allow microphone access. Vite proxies `/api` to the Hono
server, so the browser only ever talks to its own origin — and never sees the API key.

## How the audio gets there

MediaRecorder's default output isn't a format Gemini accepts, so the browser converts it before
sending: decode the recording → render it through a mono 16 kHz `OfflineAudioContext` → encode
16-bit WAV → base64 inline in the request. The reasoning is in
[ticket 007](wayfinder/tickets/007-audio-format-strategy.md); the server does no transcoding.

## Scripts

```sh
npm run check                         # client biome + typecheck; server + bank typecheck
npm run test                          # client + bank unit tests
npm run typecheck                     # all packages
npm run check -w @starling/client     # biome (format + lint) + typecheck
npm run fix -w @starling/client       # biome check --write
npm run build -w @starling/client     # typecheck + production build
npm run typecheck -w @starling/server
```

The client is formatted and linted by [Biome](https://biomejs.dev) — one dependency covering
TS, TSX, CSS and JSON. Its styles are CSS Modules named with BEM. The conventions and the
individual scripts are in [`packages/client/README.md`](packages/client/README.md). The server
has no formatter or linter yet.

Set `GEMINI_MODEL` in `packages/server/.env` to override the model — `gemini-3.5-flash` is the
documented fallback ([ticket 008](wayfinder/tickets/008-model-choice-vs-alternatives.md)).
