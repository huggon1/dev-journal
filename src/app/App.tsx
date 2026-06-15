import { Bot, ChevronRight, Code2, MessageSquareText, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { mockSession, type MockConversationBlock } from "./mockSession.js";

type SessionSummary = {
  id: string;
  title: string;
  startedAt?: string;
  updatedAt?: string;
  cwd?: string;
  source?: string;
  archived: boolean;
  parseWarningCount: number;
};

type DiscoveryResponse = {
  codexHome?: string;
  searchedRoots?: string[];
  sessions: SessionSummary[];
  warnings: string[];
};

export function App() {
  const [activeTurn, setActiveTurn] = useState("turn-1");
  const [showRaw, setShowRaw] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const userTurns = useMemo(() => mockSession.blocks.filter((block) => block.type === "user"), []);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];

  async function loadSessions() {
    setIsLoading(true);
    setLoadError(undefined);
    try {
      const response = await fetch("/api/sessions");
      if (!response.ok) {
        throw new Error(`Discovery failed with status ${response.status}`);
      }
      const data = (await response.json()) as DiscoveryResponse;
      setSessions(data.sessions);
      setWarnings(data.warnings ?? []);
      setSelectedSessionId((current) => current ?? data.sessions[0]?.id);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load sessions");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <main className="app-shell">
      <aside className="session-sidebar" aria-label="Session list">
        <div>
          <p className="eyebrow">Dev Journal</p>
          <h1>Session Review</h1>
          <p className="sidebar-copy">Local Codex sessions discovered from this machine.</p>
        </div>

        <button className="secondary-button" type="button" onClick={() => void loadSessions()} disabled={isLoading}>
          <RefreshCw size={16} />
          {isLoading ? "Scanning..." : "Refresh sessions"}
        </button>

        {loadError ? <p className="status-message error">{loadError}</p> : null}
        {warnings.length ? <p className="status-message">{warnings[0]}</p> : null}

        <section className="session-list" aria-label="Discovered sessions">
          {sessions.map((session) => (
            <button
              className={selectedSession?.id === session.id ? "session-card active" : "session-card"}
              key={session.id}
              type="button"
              onClick={() => setSelectedSessionId(session.id)}
            >
              <span>{session.archived ? "Archived" : "Local session"}</span>
              <strong>{session.title}</strong>
              <small>{formatDate(session.updatedAt ?? session.startedAt)}</small>
            </button>
          ))}
          {!isLoading && !sessions.length && !loadError ? <p className="status-message">No local Codex sessions found.</p> : null}
        </section>
      </aside>

      <section className="review-panel" aria-label="Clean session review">
        <header className="review-header">
          <div>
            <p className="eyebrow">Clean Review View</p>
            <h2>{selectedSession?.title ?? mockSession.title}</h2>
            <p className="review-subtitle">
              {selectedSession
                ? `${formatDate(selectedSession.updatedAt ?? selectedSession.startedAt)} · ${selectedSession.cwd ?? "Unknown workspace"}`
                : "Mock review content shown until parsed-session integration lands."}
            </p>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input placeholder="Search this session" aria-label="Search this session" />
          </label>
        </header>

        <div className="conversation-flow">
          {mockSession.blocks.map((block) => (
            <ConversationBlock key={block.id} block={block} isActive={activeTurn === block.id} />
          ))}
        </div>
      </section>

      <aside className="turn-rail" aria-label="User turn navigation">
        <div className="rail-section">
          <p className="eyebrow">User Turns</p>
          <nav className="turn-list">
            {userTurns.map((turn, index) => (
              <button
                className={activeTurn === turn.id ? "turn-link active" : "turn-link"}
                key={turn.id}
                type="button"
                aria-label={`Jump to user turn ${index + 1}`}
                onClick={() => setActiveTurn(turn.id)}
              >
                <span>{index + 1}</span>
                <p>{turn.text}</p>
              </button>
            ))}
          </nav>
        </div>

        <div className="rail-section">
          <button className="raw-toggle" type="button" onClick={() => setShowRaw((value) => !value)}>
            <Code2 size={16} />
            {showRaw ? "Hide Raw View" : "Show Raw View"}
          </button>
          {showRaw ? <pre className="raw-preview">{mockSession.rawPreview}</pre> : null}
        </div>
      </aside>
    </main>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value?: string): string {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function ConversationBlock({ block, isActive }: { block: MockConversationBlock; isActive: boolean }) {
  const icon = block.type === "user" ? <MessageSquareText size={18} /> : <Bot size={18} />;

  return (
    <article className={isActive ? `conversation-block ${block.type} active` : `conversation-block ${block.type}`} id={block.id}>
      <div className="message-avatar" aria-hidden="true">
        {icon}
      </div>
      <div className="message-content">
        <header className="message-header">
          <span>{block.title}</span>
          <time>{block.time}</time>
        </header>
        <p>{block.text}</p>
        {block.type === "assistant" && block.details?.length ? (
          <div className="detail-stack">
            {block.details.map((detail) => (
              <details key={detail.id} className="execution-detail">
                <summary>
                  <span>
                    <ChevronRight size={16} />
                    {detail.title}
                  </span>
                  <em>{detail.meta}</em>
                </summary>
                <p>{detail.body}</p>
              </details>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
