# Working with Git in this repo

This document defines how we work with Git. It applies to human contributors and
AI agents alike. Follow it exactly unless a maintainer tells you otherwise.

## Trunk

- **`main` is the trunk.** It is always the integration branch and should always
  be releasable.
- **Never commit directly to `main`.** All changes land on `main` through a pull
  request.
- **Never force-push, rebase, or reset `main`.**

## Feature workflow

Every new piece of work follows the same path:

1. **Branch off `main`.** Create a new branch for the feature. Keep one branch
   per logical feature or fix.
2. **Implement** the code on that branch.
3. **Review** the code (self-review / agent review).
4. **Optimize** — clean up, simplify, and refine the implementation.
5. **Human review.** A human reviews the work on the branch.
6. **Open a PR** once the human is satisfied. The PR is the output of the branch.

```
main ──┬────────────────────────────────────────► (always releasable)
       │
       └── feature/<name>  implement → review → optimize → human review → PR ──► main
```

## Branch naming

Use short, descriptive, kebab-case names, optionally prefixed by type:

- `feature/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`

## Pull requests

- **PRs always target `main`.**
- Open the PR only after the human review step.
- Keep PRs scoped to a single feature so they stay easy to review.
- The PR description should explain **what** changed and **why**.

## Do NOT use Git worktrees

- **Do not use `git worktree`** for work in this repo unless a maintainer
  explicitly tells you to.
- Work directly in the primary checkout on a feature branch.

## Rules for AI agents

- Do not push to `main`, force-push, or merge without explicit instruction.
- Do not create Git worktrees.
- Create a feature branch before making changes; open a PR targeting `main`.
- Commit or push only when asked, unless the task explicitly authorizes it.
