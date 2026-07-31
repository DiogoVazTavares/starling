# Voice-based behavioral interview trainer

Record a spoken answer to a behavioral interview question, get structured coaching feedback
back, retry until you're happy.

This repo currently holds the **vertical slice** (wayfinder ticket 006): one hardcoded question,
no persistence, no auth. The spec and the decisions behind it live in [`wayfinder/`](wayfinder/) —
start at [`wayfinder/map.md`](wayfinder/map.md).

## Layout

| Path         | What it is                                                           |
| ------------ | -------------------------------------------------------------------- |
| `client/`    | Vite + React + TS. Mic capture, WAV conversion, the practice screen. |
| `server/`    | Hono + TS. Holds `GEMINI_API_KEY` and proxies the Gemini call.       |
| `wayfinder/` | The map, tickets and research that specify the product.              |

## Running it

You need a [Google AI Studio](https://aistudio.google.com/apikey) API key.

```sh
cp server/.env.example server/.env   # then put your key in it
npm --prefix server install
npm --prefix client install
```

Two processes, in two terminals:

```sh
npm --prefix server run dev   # http://localhost:8787
npm --prefix client run dev   # http://localhost:5173
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
npm --prefix client run check       # format + lint + stylelint + typecheck
npm --prefix client run format      # prettier --write
npm --prefix client run build       # typecheck + production build
npm --prefix server run typecheck
```

The client is formatted by Prettier and linted by oxlint + Stylelint; its styles are CSS Modules
named with BEM. The conventions and the individual scripts are in
[`client/README.md`](client/README.md). The server has no formatter or linter yet.

Set `GEMINI_MODEL` in `server/.env` to override the model — `gemini-3.5-flash` is the
documented fallback ([ticket 008](wayfinder/tickets/008-model-choice-vs-alternatives.md)).
