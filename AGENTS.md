# AGENTS.md

## Project

A voice-based behavioral interview trainer: you record a spoken answer to a behavioral
interview question and get structured coaching feedback back, retrying until you're happy.
`client/` is a Vite + React + TS app (mic capture, practice screen), `server/` is a Hono + TS
proxy to the Gemini API, and `wayfinder/` holds the spec, tickets, and research. See the
[README](./README.md) for setup and details.

## Git workflow

Applies to humans and AI agents.

- **`main` is the trunk.** Always releasable. Never commit to it directly; never force-push, rebase, or reset it.
- **Each feature gets its own branch** off `main`: implement → review → optimize → human review → open PR.
- **PRs target `main`,** opened only after human review.
- **Do not use `git worktree`** unless told otherwise.
- Agents: don't push, force-push, or merge without being asked.
