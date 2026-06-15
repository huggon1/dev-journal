export type MockExecutionDetail = {
  id: string;
  title: string;
  meta: string;
  body: string;
};

export type MockConversationBlock =
  | {
      id: string;
      type: "user";
      title: string;
      text: string;
      time: string;
    }
  | {
      id: string;
      type: "assistant";
      title: string;
      text: string;
      time: string;
      details?: MockExecutionDetail[];
    };

export type MockSession = {
  title: string;
  project: string;
  startedAt: string;
  source: string;
  model: string;
  status: string;
  blocks: MockConversationBlock[];
  rawPreview: string;
};

export const mockSession: MockSession = {
  title: "Define Codex session review MVP",
  project: "dev-journal",
  startedAt: "Jun 15, 2026 21:04",
  source: "Codex local JSONL",
  model: "GPT-5 Codex",
  status: "Prototype data",
  blocks: [
    {
      id: "turn-1",
      type: "user",
      title: "User turn 1",
      time: "21:04",
      text: "I want a local-first dashboard that can review Codex session history through a clean web interface."
    },
    {
      id: "assistant-1",
      type: "assistant",
      title: "Agent response",
      time: "21:06",
      text:
        "The MVP should focus on Session Review: discover local Codex sessions, show them in a simple list, and render an opened session in a clean review view with user-turn navigation.",
      details: [
        {
          id: "detail-1",
          title: "Tool call: inspect repository",
          meta: "shell_command completed",
          body: "Read AGENTS.md, CONTEXT.md, and docs/product/vision-and-mvp.md to align the prototype with the confirmed product language."
        },
        {
          id: "detail-2",
          title: "Intermediate note",
          meta: "progress update",
          body: "Execution detail remains available for inspection but should not interrupt the primary reading flow."
        }
      ]
    },
    {
      id: "turn-2",
      type: "user",
      title: "User turn 2",
      time: "21:12",
      text: "The main view should highlight user prompts and final agent answers. Tool calls and internal progress should be folded away by default."
    },
    {
      id: "assistant-2",
      type: "assistant",
      title: "Agent response",
      time: "21:14",
      text:
        "The review view should separate Primary Conversation from Execution Detail. User turns become the navigation anchors, while execution details are folded sections between final answers.",
      details: [
        {
          id: "detail-3",
          title: "Parser shape",
          meta: "response_item function_call_output",
          body: "ExecutionDetail keeps raw payload references so the Raw View can explain parser and rendering behavior later."
        }
      ]
    }
  ],
  rawPreview: `{
  "timestamp": "2026-06-15T13:04:00Z",
  "type": "event_msg",
  "payload": {
    "type": "user_message",
    "message": "Prototype the review UI"
  }
}`
};
