import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { discoverCodexSessions, readCodexSessionByKey } from "../../src/codexSession/discovery.js";

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
    await writeFile(path.join(activeDir, "rollout-2026-06-15T13-00-00-partial.jsonl"), "{not-json}\n");

    const result = await discoverCodexSessions({ codexHome });
    const active = result.sessions.find((session) => session.id === "active-session");
    const archived = result.sessions.find((session) => session.id === "archived-session");
    const partial = result.sessions.find((session) => session.id === "rollout-2026-06-15T13-00-00-partial");

    assert.equal(result.sessions.length, 3);
    assert.equal(active?.title, "Active title");
    assert.equal(active?.archived, false);
    assert.equal(typeof active?.key, "string");
    assert.equal(archived?.archived, true);
    assert.equal(partial?.parseWarningCount, 1);
    assert.deepEqual(result.warnings, []);

    const detail = await readCodexSessionByKey(active!.key, { codexHome });
    assert.equal(detail?.summary.id, "active-session");
    assert.equal(detail?.document.metadata.cwd, "/repo");
  });

  it("can discover sessions from a manual history path override", async () => {
    const codexHome = await mkdtemp(path.join(tmpdir(), "dev-journal-codex-override-"));
    const sessionsDir = path.join(codexHome, "sessions");
    await mkdir(sessionsDir, { recursive: true });
    await writeFile(
      path.join(sessionsDir, "override-session.jsonl"),
      `${JSON.stringify({
        timestamp: "2026-06-15T12:00:00.000Z",
        type: "session_meta",
        payload: {
          id: "override-session",
          timestamp: "2026-06-15T12:00:00.000Z",
          cwd: "/override",
          source: "exec"
        }
      })}\n`
    );

    const result = await discoverCodexSessions({ historyPath: sessionsDir });

    assert.equal(result.historyPath, path.resolve(sessionsDir));
    assert.equal(result.searchedRoots.length, 1);
    assert.equal(result.sessions.length, 1);
    assert.equal(result.sessions[0]?.id, "override-session");
  });
});
