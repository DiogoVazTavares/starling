# Git workflow

Applies to humans and AI agents.

- **`main` is the trunk.** Always releasable. Never commit to it directly; never force-push, rebase, or reset it.
- **Each feature gets its own branch** off `main`: implement → review → optimize → human review → open PR.
- **PRs target `main`,** opened only after human review.
- **Do not use `git worktree`** unless told otherwise.
- Agents: don't push, force-push, or merge without being asked.
