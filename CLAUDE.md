# CLAUDE.md

Guidance for Claude / AI agents working in this repo.

## Git workflow

The full Git workflow is defined in [AGENTS.md](./AGENTS.md). Read it before
making any changes. Summary of the rules that matter most:

- **`main` is the trunk** and is always releasable. Never commit directly to it,
  and never force-push, rebase, or reset it.
- **Every feature gets its own branch off `main`.** On that branch you:
  implement → review → optimize → get **human review** → then open a PR.
- **PRs always target `main`.** Open the PR only after a human has reviewed the
  work on the branch.
- **Do NOT use `git worktree`** unless a maintainer explicitly tells you to.
  Work directly in the primary checkout on a feature branch.
- **Do not push, force-push, or merge without explicit instruction.** Commit or
  push only when asked.

See [AGENTS.md](./AGENTS.md) for branch naming, the workflow diagram, and PR
conventions.
