# Choose web app stack + secure the Gemini key

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

What do we build the web app with, and how do we call Gemini without leaking the key?

- Frontend/framework: Next.js (frontend + API routes in one), or plain React (Vite) + a
  small separate backend? Weigh against how the Gemini key must stay server-side.
- Where the audio → Gemini call runs (server route / serverless function) — the browser
  must never hold the key.
- Local dev + eventual deploy target (e.g. Vercel), and how secrets are provided.
- Language/runtime for the backend piece (Node/TS assumed — confirm).
- Minimal shape that satisfies the slice without over-building for the fog.

Deliverable: the chosen stack + the key-handling approach, recorded in the ticket answer.

## Answer

### Stack

- **Frontend:** Vite + React + **TypeScript**. Handles mic recording (MediaRecorder) and
  rendering the feedback JSON (rubric shape from ticket 002).
- **Backend:** **Hono** on the Node runtime, **TypeScript**. A small server whose job is to
  hold the Gemini key and proxy the audio call.
- Two folders in the repo, e.g. `client/` (Vite) and `server/` (Hono).

### Key handling (the whole point of having a backend)

- `GEMINI_API_KEY` lives in **`server/.env`** (gitignored), read via `process.env` — the
  `@google/genai` SDK picks it up. **The browser never sees the key.**
- Flow: browser records audio → `POST /api/feedback` (multipart or base64 body) with the
  audio + the question → **backend** calls `gemini-3.6-flash` (Interactions API, inline
  base64, `response_format` = rubric schema) → backend returns the feedback JSON to the
  browser. All Gemini traffic is server-side.
- Add `.env` / `.env.local` to `.gitignore`; commit a `.env.example` with the key name only.

### Local dev

- Two processes: Vite dev server (`:5173`) + Hono server (e.g. `:8787`).
- Vite's `server.proxy` forwards `/api/*` → the Hono port, so the browser calls same-origin
  `/api/...` and there's **no CORS** to configure.

### Deploy — deferred (fog)

The slice runs **locally** (the two dev processes above), so deploy is out of the slice's
path and moved to the map's **Not yet specified**. When needed: client as static hosting +
Hono on a Node host or serverless function, with `GEMINI_API_KEY` as a host secret.

### Confirms

- The audio-format work (007) is independent: whatever supported format we land on is what
  the browser sends to `/api/feedback`. This stack doesn't constrain that choice.
