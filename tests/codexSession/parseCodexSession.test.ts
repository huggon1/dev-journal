import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCodexSessionJsonl } from "../../src/codexSession/index.js";

describe("parseCodexSessionJsonl", () => {
  it("builds a renderable session model from representative Codex JSONL records", () => {
    const jsonl = [
      JSON.stringify({
        timestamp: "2026-06-15T00:00:00Z",
        type: "session_meta",
        payload: {
          id: "session-1",
          timestamp: "2026-06-15T00:00:00Z",
          cwd: "/repo",
          source: "exec",
          thread_source: "local",
          model_provider: "openai"
        }
      }),
      JSON.stringify({
        timestamp: "2026-06-15T00:00:01Z",
        type: "event_msg",
        payload: {
          type: "user_message",
          client_id: "client-1",
          message: "Build the parser",
          images: [],
          local_images: [],
          text_elements: []
        }
      }),
      JSON.stringify({
        timestamp: "2026-06-15T00:00:02Z",
        type: "response_item",
        payload: {
          type: "function_call",
          name: "shell_command",
          call_id: "call-1",
          arguments: "{\"command\":\"npm test\"}"
        }
      }),
      JSON.stringify({
        timestamp: "2026-06-15T00:00:03Z",
        type: "response_item",
        payload: {
          type: "function_call_output",
          call_id: "call-1",
          output: "ok"
        }
      }),
      JSON.stringify({
        timestamp: "2026-06-15T00:00:04Z",
        type: "response_item",
        payload: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "Parser is ready." }]
        }
      }),
      JSON.stringify({
        timestamp: "2026-06-15T00:00:05Z",
        type: "response_item",
        payload: {
          type: "reasoning",
          summary: []
        }
      })
    ].join("\n");

    const parsed = parseCodexSessionJsonl(jsonl);

    assert.deepEqual(parsed.metadata, {
      id: "session-1",
      timestamp: "2026-06-15T00:00:00Z",
      cwd: "/repo",
      source: "exec",
      threadSource: "local",
      modelProvider: "openai"
    });
    assert.equal(parsed.rawEvents.length, 6);
    assert.equal(parsed.userTurns.length, 1);
    assert.equal(parsed.userTurns[0]?.text, "Build the parser");
    assert.equal(parsed.userTurns[0]?.sourceEventIndex, 1);
    assert.deepEqual(
      parsed.primaryConversation.map((item) => ({ kind: item.kind, text: item.text })),
      [
        { kind: "user", text: "Build the parser" },
        { kind: "assistant", text: "Parser is ready." }
      ]
    );
    assert.deepEqual(
      parsed.executionDetails.map((detail) => ({
        type: detail.type,
        label: detail.label,
        callId: detail.callId,
        name: detail.name,
        relatedCallName: detail.relatedCallName
      })),
      [
        {
          type: "function_call",
          label: "function call",
          callId: "call-1",
          name: "shell_command",
          relatedCallName: undefined
        },
        {
          type: "function_call_output",
          label: "function call output",
          callId: "call-1",
          name: undefined,
          relatedCallName: "shell_command"
        },
        {
          type: "reasoning",
          label: "reasoning",
          callId: undefined,
          name: undefined,
          relatedCallName: undefined
        }
      ]
    );
    assert.deepEqual(parsed.warnings, []);
  });

  it("surfaces malformed lines as parse warnings while preserving valid records", () => {
    const jsonl = [
      JSON.stringify({
        timestamp: "2026-06-15T00:00:01Z",
        type: "event_msg",
        payload: { type: "user_message", message: "Keep going" }
      }),
      "{not-json"
    ].join("\n");

    const parsed = parseCodexSessionJsonl(jsonl);

    assert.equal(parsed.userTurns.length, 1);
    assert.deepEqual(parsed.warnings, [{ lineNumber: 2, message: "Could not parse JSONL record." }]);
  });
});
