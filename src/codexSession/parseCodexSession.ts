import type {
  CodexRawEvent,
  ExecutionDetail,
  ParseWarning,
  PrimaryConversationItem,
  SessionDocument,
  SessionMetadata,
  UserTurn
} from "./types.js";

type JsonObject = Record<string, unknown>;

export function parseCodexSessionJsonl(jsonl: string): SessionDocument {
  const metadata: SessionMetadata = {};
  const rawEvents: CodexRawEvent[] = [];
  const userTurns: UserTurn[] = [];
  const primaryConversation: PrimaryConversationItem[] = [];
  const executionDetails: ExecutionDetail[] = [];
  const warnings: ParseWarning[] = [];
  const callsById = new Map<string, string>();

  const lines = jsonl.split(/\r?\n/);

  for (const [lineIndex, rawLine] of lines.entries()) {
    const lineNumber = lineIndex + 1;
    if (!rawLine.trim()) {
      continue;
    }

    const parsed = parseLine(rawLine, lineNumber, warnings);
    if (!parsed) {
      continue;
    }

    const payload = asObject(parsed.payload);
    const rawEvent: CodexRawEvent = {
      index: rawEvents.length,
      lineNumber,
      timestamp: asString(parsed.timestamp),
      type: asString(parsed.type),
      payloadType: asString(payload?.type),
      raw: parsed,
      rawLine
    };
    rawEvents.push(rawEvent);

    if (rawEvent.type === "session_meta" && payload) {
      applySessionMetadata(metadata, payload);
      continue;
    }

    if (rawEvent.type === "event_msg" && payload?.type === "user_message") {
      const text = extractUserMessageText(payload);
      const userTurn: UserTurn = {
        id: `user-turn-${userTurns.length + 1}`,
        timestamp: rawEvent.timestamp,
        text,
        sourceEventIndex: rawEvent.index,
        images: asArray(payload.images),
        localImages: asArray(payload.local_images)
      };
      userTurns.push(userTurn);
      primaryConversation.push({
        id: `primary-${primaryConversation.length + 1}`,
        kind: "user",
        timestamp: rawEvent.timestamp,
        text,
        sourceEventIndex: rawEvent.index
      });
      continue;
    }

    if (rawEvent.type === "response_item" && payload?.type === "message") {
      const role = asString(payload.role);
      const text = extractContentText(payload.content, role === "assistant" ? "output_text" : "input_text");

      if (role === "assistant" && text) {
        primaryConversation.push({
          id: `primary-${primaryConversation.length + 1}`,
          kind: "assistant",
          timestamp: rawEvent.timestamp,
          text,
          sourceEventIndex: rawEvent.index
        });
      } else {
        executionDetails.push(makeExecutionDetail(rawEvent, payload, `message:${role ?? "unknown"}`));
      }
      continue;
    }

    if (payload?.type === "function_call") {
      const callId = asString(payload.call_id);
      const name = asString(payload.name);
      if (callId && name) {
        callsById.set(callId, name);
      }
      executionDetails.push(makeExecutionDetail(rawEvent, payload, "function call", callId, name));
      continue;
    }

    if (payload?.type === "function_call_output") {
      const callId = asString(payload.call_id);
      executionDetails.push(
        makeExecutionDetail(rawEvent, payload, "function call output", callId, undefined, callId ? callsById.get(callId) : undefined)
      );
      continue;
    }

    if (payload?.type) {
      executionDetails.push(makeExecutionDetail(rawEvent, payload, String(payload.type)));
      continue;
    }

    executionDetails.push(makeExecutionDetail(rawEvent, payload ?? parsed, rawEvent.type ?? "unknown"));
  }

  return {
    metadata,
    rawEvents,
    userTurns,
    primaryConversation,
    executionDetails,
    warnings
  };
}

function parseLine(rawLine: string, lineNumber: number, warnings: ParseWarning[]): JsonObject | undefined {
  try {
    const parsed = JSON.parse(rawLine) as unknown;
    const parsedObject = asObject(parsed);
    if (!parsedObject) {
      warnings.push({ lineNumber, message: "Expected a JSON object record." });
      return undefined;
    }
    return parsedObject;
  } catch {
    warnings.push({ lineNumber, message: "Could not parse JSONL record." });
    return undefined;
  }
}

function applySessionMetadata(metadata: SessionMetadata, payload: JsonObject): void {
  metadata.id = asString(payload.id) ?? metadata.id;
  metadata.timestamp = asString(payload.timestamp) ?? metadata.timestamp;
  metadata.cwd = asString(payload.cwd) ?? metadata.cwd;
  metadata.source = asString(payload.source) ?? metadata.source;
  metadata.threadSource = asString(payload.thread_source) ?? metadata.threadSource;
  metadata.modelProvider = asString(payload.model_provider) ?? metadata.modelProvider;
}

function extractUserMessageText(payload: JsonObject): string {
  const message = asString(payload.message);
  if (message) {
    return message;
  }

  return extractTextElements(payload.text_elements);
}

function extractContentText(content: unknown, preferredType: "input_text" | "output_text"): string {
  const parts = asArray(content) ?? [];
  return parts
    .map((part) => asObject(part))
    .filter((part): part is JsonObject => Boolean(part))
    .filter((part) => part.type === preferredType)
    .map((part) => asString(part.text) ?? "")
    .filter(Boolean)
    .join("\n");
}

function extractTextElements(value: unknown): string {
  const parts = asArray(value) ?? [];
  return parts
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      const object = asObject(part);
      return object ? asString(object.text) ?? asString(object.content) ?? "" : "";
    })
    .filter(Boolean)
    .join("\n");
}

function makeExecutionDetail(
  rawEvent: CodexRawEvent,
  rawPayload: unknown,
  label: string,
  callId?: string,
  name?: string,
  relatedCallName?: string
): ExecutionDetail {
  return {
    id: `detail-${rawEvent.index + 1}`,
    timestamp: rawEvent.timestamp,
    type: rawEvent.payloadType ?? rawEvent.type ?? "unknown",
    label,
    sourceEventIndex: rawEvent.index,
    callId,
    name,
    relatedCallName,
    rawPayload
  };
}

function asObject(value: unknown): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}
