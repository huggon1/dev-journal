import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { discoverCodexSessions } from "../../src/codexSession/discovery.js";

describe("discoverCodexSessions", () => {
  it("discovers active and archived Codex JSONL sessions from a Codex home", async () => {
    const codexHome = await mkdtemp(path.join(tmpdir(), "dev-journal-codex-home-"));
    const activeDir = path.join(codexHome, "sessions", "2026", "06", "15");
    const archivedDir = path.join(codexHome, "archived_sessions");
    await mkdir(activeDir, { recursive: true });
    await mkdir(archivedDir, { recursive: true });

    await writeFile(
      path.join(codexHome, "session_index.jsonl"),
      `${JSON.stringify({ id: "active-session", thread_name: "Active title", updated_at: "2026-06-15T12:00:00.000Z" })}\n`
    );
    await writeFile(
      path.join(activeDir, "rollout-2026-06-15T12-00-00-active.jsonl"),
      `${JSON.stringify({
        timestamp: "2026-06-15T12:00:00.000Z",
        type: "session_meta",
        payload: {
          id: "active-session",
          timestamp: "2026-06-15T12:00:00.000Z",
          cwd: "/repo",
          source: "exec"
        }
      })}\n`
    );
    await writeFile(
      path.join(archivedDir, "rollout-2026-06-14T12-00-00-archived.jsonl"),
      `${JSON.stringify({
        timestamp: "2026-06-14T12:00:00.000Z",
        type: "session_meta",
        payload: {
          id: "archived-session",
          timestamp: "2026-06-14T12:00:00.000Z",
          cwd: "/old-repo",
          source: "vscode"
        }
      })}\n`
    );

    const result = await discoverCodexSessions({ codexHome });
    const active = result.sessions.find((session) => session.id === "active-session");
    const archived = result.sessions.find((session) => session.id === "archived-session");

    assert.equal(result.sessions.length, 2);
    assert.equal(active?.title, "Active title");
    assert.equal(active?.archived, false);
    assert.equal(archived?.archived, true);
    assert.deepEqual(result.warnings, []);
  });
});
