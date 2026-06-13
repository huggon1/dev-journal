# Project Instructions

## Start Each Session

- Identify the active GitHub issue, pull request, branch, or requested phase before changing files.
- If the user asks for repository changes without an issue, create or draft the issue first.
- Convert the request into a concrete deliverable and verification target.
- Ask only for information that blocks a correct implementation.

## Planning Work

- Produce or update a GitHub issue with the problem, scope, acceptance criteria, and proposed branch name.
- If the request is too broad for one implementation branch, propose smaller issue scopes before coding.
- Keep planning output focused on decisions needed for the next implementation session.

## Implementation Work

- Work on one issue branch at a time.
- Name branches with the issue number and task type, such as `feature/12-short-title`, `fix/12-short-title`, or `chore/12-short-title`.
- Keep code changes limited to the active issue.
- Prefer existing project conventions over new patterns.
- Run the relevant checks available in the project before handing off.

## Review And CI Work

- For PR review comments, inspect unresolved threads, address actionable feedback, and push fixes to the same branch.
- For failing CI, inspect the failing check or log before changing code.
- Report which comments or failures were addressed and which remain unresolved.

## Pull Request Handoff

- Open or update the PR for the active issue branch.
- Link the PR to its issue.
- Include the change summary, verification performed, and known risks or follow-up work.
