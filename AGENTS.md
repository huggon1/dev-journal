# Project Instructions

## GitHub Workflow

- Repository changes should be tracked through GitHub issues and pull requests.
- Each implementation branch should map to one issue and include the issue number in the branch name.
- If a request is still exploratory, use the session to shape the issue before creating an implementation branch.
- If a request is too broad for one branch, split or propose smaller issues before coding.

## Session Handoff

- End implementation sessions with a PR or with a clear reason why a PR is not ready.
- End review or CI-fix sessions by stating what was addressed and what remains unresolved.

## Git Conventions

- Name branches as `<type>/<issue-number>-<short-title>`, such as `chore/5-git-conventions`.
- Use concise conventional commit messages, such as `chore: document git conventions`.
- Use squash merge for pull requests unless the user explicitly asks otherwise.

## Maintaining This File

- Keep `AGENTS.md` short and actionable.
- Add instructions only for project-specific behavior that agents would not reliably do by default.
- Prefer direct commands or decision rules over background information.
- Do not use this file for product goals, task notes, or generic engineering advice.
