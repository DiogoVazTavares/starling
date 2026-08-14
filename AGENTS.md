# AGENTS.md

# Starling

A voice-based behavioral interview trainer: you record a spoken answer to a behavioral
interview question and get structured coaching feedback back, retrying until you're happy.
The name nods to the starling — a bird that masters its voice through repeated imitation and
practice, just as you rehearse and refine your spoken answers here. See the
[README](./README.md) for setup and details.

## Git workflow

Applies to humans and AI agents.

- **`main` is the trunk.** Always releasable. Never commit to it directly; never force-push, rebase, or reset it.
- **Each feature gets its own branch** off `main`: implement → review → optimize → human review → open PR.
- **PRs target `main`,** opened only after human review.
- **Do not use `git worktree`** unless told otherwise.

## Miscellaneous 

Talk in ASD-STE100 Simplified Technical English
