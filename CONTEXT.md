# Dev Journal

Dev Journal helps users review and understand AI-assisted development work through a dashboard of related but independent panels.

## Product Direction

Dev Journal is a review and insight dashboard for AI-assisted development work.

The first milestone is a local-first Session Panel for Codex session review. The product may later add independent panels such as GitHub issues, pull requests, commits, CI, local worktrees, skills, prompts, or analysis reports.

The MVP should support Codex session history across local platforms before introducing other data sources or product areas.

## Language

**Panel**:
A top-level product area for exploring one kind of development information, such as Codex sessions or GitHub activity. Panels may link related information across sources, but they do not require a single shared object model.
_Avoid_: Unified record, single timeline

**Session**:
A coding-agent interaction shown through the session-focused panel. In the MVP, Codex session viewing is the first supported source.
_Avoid_: Conversation, chat

**Session Panel MVP**:
The first product milestone for Dev Journal, focused on rich review of local Codex sessions as one panel within the broader dashboard.
_Avoid_: Dev Journal MVP, full dashboard MVP

**Session Review**:
The primary MVP use case: browse, search, navigate, and visually inspect the original Codex session content. Analysis may build on top of session review, but it is not the first-layer experience.
_Avoid_: Raw log dump, automatic summary first

**Analysis Workflow**:
An optional, user-selected process that runs against a session to produce a specific report, such as outcome analysis, friction analysis, or learning-gap analysis.
_Avoid_: Built-in mandatory summary, one-size-fits-all analysis

**User Turn**:
A message or instruction from the user within a session. User turns are the primary navigation anchors for the Session Review experience.
_Avoid_: Message as navigation unit, automatic task segment as MVP navigation unit

**Session Panel MVP Success**:
Users can open a local web UI, have it discover local Codex session history, and click into a session to review it through readable rendering, search, and user-turn navigation.
_Avoid_: Manual log import as the primary flow, analysis-first MVP

**Local First**:
The MVP reads Codex session history from the current machine and avoids sync, import/export, cloud account access, or remote history aggregation.
_Avoid_: Cloud sync, remote dashboard, multi-device history

**Codex-only Source**:
The MVP only discovers and renders local Codex session history, while supporting the local filesystem conventions needed across Windows, macOS, Linux, and WSL.
_Avoid_: Multi-agent importers, generic chat transcript viewer

**History Path Override**:
A manual fallback that lets the user point Dev Journal at a Codex history directory when automatic discovery fails.
_Avoid_: Required manual import, source selection workflow

**Incomplete Session**:
A session that may still be written or cannot be fully parsed yet. The MVP may show incomplete sessions with a clear warning, but it does not provide real-time tailing or live status.
_Avoid_: Live session monitor, blocking the session list on partial parse failures

**Review-first UI**:
The Session Panel should prioritize a clean ChatGPT-like reading experience, with developer metadata used as supporting context rather than the primary surface.
_Avoid_: Raw log viewer, debug console, metadata-first dashboard

**Primary Conversation**:
The default reading layer for a session, emphasizing user turns and the agent's final user-facing responses.
_Avoid_: Interleaving every tool call and intermediate note into the main reading flow

**Execution Detail**:
Tool calls, command outputs, intermediate progress notes, and other step-by-step agent activity preserved for inspection but collapsed or visually separated by default.
_Avoid_: Hidden data, unstructured JSON dump, always-expanded tool output

**Clean Review View**:
The default session rendering that separates primary conversation from execution detail for easier reading.
_Avoid_: Raw event stream as the default UI

**Raw View**:
A secondary debugging view for inspecting the original session events when parsing or rendering needs verification.
_Avoid_: Primary review experience
