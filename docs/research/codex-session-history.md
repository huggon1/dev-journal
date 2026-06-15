# Local Codex Session History

## Purpose

This note records the local Codex history structure observed for the Session Panel MVP. It is intended to unblock the parser/model work in issue #13 without committing private transcript content.

## Discovery Locations

Codex stores local state under `CODEX_HOME`, which defaults to `~/.codex`.

Observed on Windows:

- `%USERPROFILE%\.codex\sessions\YYYY\MM\DD\*.jsonl`
- `%USERPROFILE%\.codex\archived_sessions\*.jsonl`
- `%USERPROFILE%\.codex\session_index.jsonl`

Also observed:

- `%LOCALAPPDATA%\codex\clis`

The `%LOCALAPPDATA%\codex` tree was present, but the session history records were under `%USERPROFILE%\.codex`.

Expected cross-platform defaults:

- Windows: `%USERPROFILE%\.codex`
- macOS: `~/.codex`
- Linux: `~/.codex`
- WSL: the Linux user's `~/.codex`

Implementation should check `CODEX_HOME` first. If unset, use the platform default. The MVP should also provide a manual history path override.

## File Layout

Active session transcripts are JSONL files grouped by date:

```text
~/.codex/sessions/
  2026/
    06/
      15/
        rollout-YYYY-MM-DDTHH-MM-SS-<id>.jsonl
```

Archived session transcripts are JSONL files in a flat directory:

```text
~/.codex/archived_sessions/
  rollout-YYYY-MM-DDTHH-MM-SS-<id>.jsonl
```

`session_index.jsonl` exists at the Codex home root. In the local sample it contained one JSON object per line with these keys:

- `id`
- `thread_name`
- `updated_at`

The index is useful for title/update metadata, but it did not include transcript file paths in the observed sample. The app should not depend on it as the only discovery source.

## JSONL Record Shape

Observed transcript records used a common top-level shape:

```json
{
  "timestamp": "...",
  "type": "...",
  "payload": {}
}
```

Observed top-level `type` values:

- `session_meta`
- `turn_context`
- `event_msg`
- `response_item`

## Session Metadata

`session_meta` records had payload keys including:

- `id`
- `timestamp`
- `cwd`
- `originator`
- `cli_version`
- `source`
- `thread_source`
- `model_provider`
- `base_instructions`
- `dynamic_tools`

Useful list/detail metadata:

- session id
- timestamp
- working directory
- source/thread source
- model provider

## Turn Context

`turn_context` records had payload keys including:

- `turn_id`
- `cwd`
- `workspace_roots`
- `current_date`
- `timezone`
- `approval_policy`
- `sandbox_policy`
- `permission_profile`
- `model`
- `personality`
- `collaboration_mode`
- `summary`

Useful parser behavior:

- Use `turn_id` to associate later events with an active turn when possible.
- Preserve workspace and environment metadata for detail views, but do not make it primary conversation content.

## User Turns

Observed user-facing user input appeared as `event_msg` records with payload `type` set to `user_message`.

Observed `user_message` payload keys:

- `type`
- `client_id`
- `message`
- `images`
- `local_images`
- `text_elements`

Parser recommendation:

- Treat `event_msg` / `user_message` as the primary source for User Turn anchors.
- Preserve image/local image metadata for later rendering, but text review can start from `message` and/or `text_elements`.

## Primary Conversation

Observed assistant/user/developer messages also appeared as `response_item` records with payload `type` set to `message`.

Observed `message` payload keys:

- `type`
- `role`
- `content`

Observed message roles:

- `user`
- `assistant`
- `developer`

Observed content item types:

- `input_text`
- `output_text`

Parser recommendation:

- Use `event_msg` / `user_message` for user turns.
- Use assistant `response_item` / `message` records with `output_text` content for final user-facing assistant responses.
- Treat developer/system-like messages as supporting context, not Primary Conversation, unless product requirements change.

## Execution Detail

Observed execution-related payload types included:

- `function_call`
- `function_call_output`
- `custom_tool_call`
- `custom_tool_call_output`
- `web_search_call`
- `web_search_end`
- `tool_search_call`
- `tool_search_output`
- `patch_apply_end`
- `reasoning`
- `token_count`
- `task_started`
- `task_complete`
- `turn_aborted`

Observed `function_call` payload keys:

- `type`
- `name`
- `arguments`
- `call_id`

Observed `function_call_output` payload keys:

- `type`
- `call_id`
- `output`

Parser recommendation:

- Preserve function/tool calls and outputs as Execution Detail.
- Pair calls and outputs by `call_id` when available.
- Collapse or visually separate Execution Detail by default.
- Preserve reasoning records as Execution Detail. Some reasoning records may contain summaries and encrypted content; do not assume full reasoning text is available.

## Raw View

The Raw View should be able to inspect the original JSONL records for a session.

Implementation recommendation:

- Keep a raw event reference or raw JSON payload available after parsing.
- Avoid transforming away unknown fields.
- Unknown record types should be preserved as raw events and surfaced as unsupported Execution Detail rather than causing a parser failure.

## Incomplete Or Partially Parsed Sessions

Sessions may be actively written or contain records the parser does not understand.

Implementation recommendation:

- Parse JSONL line-by-line.
- Treat malformed trailing lines as partial-session warnings when the file appears recently modified.
- Do not let one bad session block the session list.
- Keep parse warnings on the session model for UI display.

## Privacy Notes

This research intentionally records only:

- file and directory patterns
- field names
- event type names
- parser recommendations

It does not include private transcript content, thread names, prompts, command outputs, or raw session JSON.

## Parser Work Unblocked

Issue #13 can start with these model concepts:

- `SessionMetadata`
- `RawEvent`
- `SessionEvent`
- `UserTurn`
- `PrimaryConversationItem`
- `ExecutionDetail`
- `ParseWarning`
- `SessionDocument`

The parser should start with Codex JSONL support only, but isolate discovery and parser boundaries so platform path differences and future format changes are localized.
