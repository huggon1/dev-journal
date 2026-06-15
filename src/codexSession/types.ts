export type CodexRawEvent = {
  index: number;
  lineNumber: number;
  timestamp?: string;
  type?: string;
  payloadType?: string;
  raw: unknown;
  rawLine: string;
};

export type SessionMetadata = {
  id?: string;
  timestamp?: string;
  cwd?: string;
  source?: string;
  threadSource?: string;
  modelProvider?: string;
};

export type UserTurn = {
  id: string;
  timestamp?: string;
  text: string;
  sourceEventIndex: number;
  images?: unknown[];
  localImages?: unknown[];
};

export type PrimaryConversationItem = {
  id: string;
  kind: "user" | "assistant";
  timestamp?: string;
  text: string;
  sourceEventIndex: number;
};

export type ExecutionDetail = {
  id: string;
  timestamp?: string;
  type: string;
  label: string;
  sourceEventIndex: number;
  callId?: string;
  name?: string;
  relatedCallName?: string;
  rawPayload: unknown;
};

export type ParseWarning = {
  lineNumber?: number;
  sourceEventIndex?: number;
  message: string;
};

export type SessionDocument = {
  metadata: SessionMetadata;
  rawEvents: CodexRawEvent[];
  userTurns: UserTurn[];
  primaryConversation: PrimaryConversationItem[];
  executionDetails: ExecutionDetail[];
  warnings: ParseWarning[];
};
