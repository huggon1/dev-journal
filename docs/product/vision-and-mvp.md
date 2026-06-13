# Dev Journal Vision and MVP

## Product Positioning

Dev Journal is a local-first dashboard for reviewing and understanding AI-assisted development work.

The product should be organized as independent panels. Each panel explores one kind of development information, such as Codex sessions, GitHub activity, prompts, skills, or future analysis reports. Panels may link to related information, but the product should not force every source into one unified record model.

## Core Pain Point

AI-assisted development creates valuable process information, but that information is hard to review after the fact. The useful context is scattered across session transcripts, tool calls, command outputs, issues, pull requests, commits, review comments, and local files.

The first product goal is to make local Codex sessions easy to find, read, search, and navigate.

## MVP: Session Panel

The first milestone is the Session Panel MVP.

It should provide a polished review experience for local Codex session history. The MVP should feel closer to a clean ChatGPT-style reading interface than a raw log viewer or debug console.

## Primary User Flow

1. The user opens a local web UI.
2. Dev Journal automatically discovers local Codex session history.
3. The user sees a simple session list.
4. The user opens a session.
5. The session is shown in a clean review view.
6. The user can search the session and jump between user turns.
7. The user can inspect folded execution details when needed.

## MVP Scope

- Discover local Codex session history on the current machine.
- Support Windows, macOS, Linux, and WSL path conventions where practical.
- Provide a manual history path override when automatic discovery fails.
- Show a session list using a simple default ordering, such as reverse chronological order.
- Render sessions through a clean review view.
- Emphasize the primary conversation: user turns and final user-facing agent responses.
- Preserve tool calls, command outputs, progress notes, and intermediate agent activity as execution detail.
- Collapse or visually separate execution detail by default.
- Support session search.
- Support user-turn navigation.
- Provide manual refresh.
- Provide a secondary raw view for debugging parser or renderer issues.
- Show incomplete or partially parsed sessions with a clear warning instead of blocking the whole list.

## Non-goals

- No real-time session tailing or live auto-refresh.
- No cloud sync.
- No remote account access.
- No import/export workflow.
- No multi-device history aggregation.
- No GitHub aggregation in the MVP.
- No Skill management.
- No Prompt management.
- No Codex configuration management.
- No analysis-first experience.
- No generic chat transcript importer.
- No support for non-Codex coding agents in the MVP.

## Later Directions

Analysis should be added as optional workflows that run against a selected session. Different workflows may produce different reports, such as outcome analysis, friction analysis, or learning-gap analysis.

Future panels may cover GitHub activity, skills, prompts, worktrees, or other project context. These should remain independent product areas that can link to sessions without becoming part of the Session Panel MVP.

## First Implementation Issues

- Discover Codex session history across supported local platforms.
- Parse Codex session events into a renderable session model.
- Build the session list page.
- Build the clean session review view.
- Add user-turn navigation.
- Add search within a session.
- Add folded execution detail rendering.
- Add manual history path override.
- Add raw view for debugging.
