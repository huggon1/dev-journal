import { Bot, ChevronRight, Code2, MessageSquareText, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { ExecutionDetail, PrimaryConversationItem, SessionDocument } from "../codexSession/types.js";

type SessionSummary = {
  key: string;
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

type SessionDetailResponse = {
  summary: SessionSummary;
  document: SessionDocument;
};

type SearchTarget = {
  anchor: string;
  kind: "conversation" | "execution";
  text: string;
};

export function App() {
  const [activeAnchor, setActiveAnchor] = useState<string>();
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState<string>();
  const [sessionDocument, setSessionDocument] = useState<SessionDocument>();
  const [detailError, setDetailError] = useState<string>();
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const selectedSession = sessions.find((session) => session.key === selectedSessionKey) ?? sessions[0];
  const conversationItems = sessionDocument?.primaryConversation ?? [];
  const executionDetails = sessionDocument?.executionDetails.slice(0, 80) ?? [];
  const userTurns = sessionDocument?.userTurns ?? [];
  const rawPreview = useMemo(() => JSON.stringify(sessionDocument?.rawEvents.slice(0, 25) ?? [], null, 2), [sessionDocument]);
  const searchResults = useMemo(
    () => buildSearchTargets(searchQuery, conversationItems, executionDetails),
    [conversationItems, executionDetails, searchQuery]
  );
  const activeSearchTarget = activeSearchIndex >= 0 ? searchResults[activeSearchIndex] : undefined;

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
      setSelectedSessionKey((current) => current ?? data.sessions[0]?.key);
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

  useEffect(() => {
    if (!selectedSession?.key) {
      setSessionDocument(undefined);
      return;
    }

    async function loadSelectedSession(key: string) {
      setIsDetailLoading(true);
      setDetailError(undefined);
      setShowRaw(false);
      try {
        const response = await fetch(`/api/sessions/${encodeURIComponent(key)}`);
        if (!response.ok) {
          throw new Error(`Session load failed with status ${response.status}`);
        }
        const data = (await response.json()) as SessionDetailResponse;
        setSessionDocument(data.document);
        setSearchQuery("");
        setActiveSearchIndex(-1);
        setActiveAnchor(data.document.userTurns[0] ? eventAnchor(data.document.userTurns[0].sourceEventIndex) : undefined);
      } catch (error) {
        setSessionDocument(undefined);
        setDetailError(error instanceof Error ? error.message : "Could not load session");
      } finally {
        setIsDetailLoading(false);
      }
    }

    void loadSelectedSession(selectedSession.key);
  }, [selectedSession?.key]);

  useEffect(() => {
    const firstResult = searchResults[0];
    setActiveSearchIndex(firstResult ? 0 : -1);
    if (firstResult && searchQuery.trim()) {
      setActiveAnchor(firstResult.anchor);
      requestAnimationFrame(() => document.getElementById(firstResult.anchor)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  }, [searchQuery, searchResults.length]);

  function activateAnchor(anchor: string) {
    setActiveAnchor(anchor);
    requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function activateSearchResult(index: number) {
    const result = searchResults[index];
    if (!result) {
      return;
    }

    setActiveSearchIndex(index);
    activateAnchor(result.anchor);
  }

  function goToSearchResult(direction: -1 | 1) {
    if (!searchResults.length) {
      return;
    }

    const nextIndex = (activeSearchIndex + direction + searchResults.length) % searchResults.length;
    activateSearchResult(nextIndex);
  }

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
              className={selectedSession?.key === session.key ? "session-card active" : "session-card"}
              key={session.key}
              type="button"
              onClick={() => setSelectedSessionKey(session.key)}
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
            <h2>{selectedSession?.title ?? "Session Review"}</h2>
            <p className="review-subtitle">
              {selectedSession
                ? `${formatDate(selectedSession.updatedAt ?? selectedSession.startedAt)} - ${selectedSession.cwd ?? "Unknown workspace"}`
                : "Select a discovered Codex session to review its parsed conversation."}
            </p>
          </div>
          <div className="search-controls">
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="Search this session"
                aria-label="Search this session"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <div className="search-actions" aria-live="polite">
              <span>{searchQuery ? `${searchResults.length ? activeSearchIndex + 1 : 0}/${searchResults.length}` : "No search"}</span>
              <button type="button" onClick={() => goToSearchResult(-1)} disabled={!searchResults.length}>
                Prev
              </button>
              <button type="button" onClick={() => goToSearchResult(1)} disabled={!searchResults.length}>
                Next
              </button>
            </div>
          </div>
        </header>

        {detailError ? <p className="status-message error">{detailError}</p> : null}
        {sessionDocument?.warnings.length ? (
          <p className="status-message">{sessionDocument.warnings.length} parse warning(s) found in this session.</p>
        ) : null}
        {isDetailLoading ? <p className="status-message">Loading session detail...</p> : null}

        <div className="conversation-flow">
          {conversationItems.map((item) => (
            <ParsedConversationBlock
              key={item.id}
              item={item}
              isActive={activeAnchor === eventAnchor(item.sourceEventIndex)}
              isSearchActive={activeSearchTarget?.anchor === eventAnchor(item.sourceEventIndex)}
              searchQuery={searchQuery}
            />
          ))}
          {!isDetailLoading && selectedSession && !conversationItems.length ? (
            <p className="status-message">No primary conversation messages were parsed for this session.</p>
          ) : null}
          {!isDetailLoading && !selectedSession ? <p className="status-message">No session selected.</p> : null}
        </div>

        {executionDetails.length ? (
          <section className="execution-panel" aria-label="Execution detail">
            <p className="eyebrow">Execution Detail</p>
            <div className="detail-stack">
              {executionDetails.map((detail) => (
                <ExecutionDetailBlock
                  key={detail.id}
                  detail={detail}
                  isSearchActive={activeSearchTarget?.anchor === detailAnchor(detail)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <aside className="turn-rail" aria-label="User turn navigation">
        <div className="rail-section">
          <p className="eyebrow">User Turns</p>
          <nav className="turn-list">
            {userTurns.length ? null : <p className="status-message">No user turns parsed yet.</p>}
            {userTurns.map((turn, index) => (
              <button
                className={activeAnchor === eventAnchor(turn.sourceEventIndex) ? "turn-link active" : "turn-link"}
                key={turn.id}
                type="button"
                aria-label={`Jump to user turn ${index + 1}`}
                onClick={() => activateAnchor(eventAnchor(turn.sourceEventIndex))}
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
          {showRaw ? <pre className="raw-preview">{rawPreview}</pre> : null}
        </div>
      </aside>
    </main>
  );
}

function ParsedConversationBlock({
  item,
  isActive,
  isSearchActive,
  searchQuery
}: {
  item: PrimaryConversationItem;
  isActive: boolean;
  isSearchActive: boolean;
  searchQuery: string;
}) {
  const icon = item.kind === "user" ? <MessageSquareText size={18} /> : <Bot size={18} />;
  const anchor = eventAnchor(item.sourceEventIndex);

  return (
    <article
      className={[
        "conversation-block",
        item.kind,
        isActive ? "active" : "",
        isSearchActive ? "search-active" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      id={anchor}
    >
      <div className="message-avatar" aria-hidden="true">
        {icon}
      </div>
      <div className="message-content">
        <header className="message-header">
          <span>{item.kind === "user" ? "User turn" : "Agent response"}</span>
          <time>{formatDate(item.timestamp)}</time>
        </header>
        <p>{renderHighlightedText(item.text || "(empty message)", searchQuery)}</p>
      </div>
    </article>
  );
}

function ExecutionDetailBlock({ detail, isSearchActive }: { detail: ExecutionDetail; isSearchActive: boolean }) {
  return (
    <details className={isSearchActive ? "execution-detail search-active" : "execution-detail"} id={detailAnchor(detail)}>
      <summary>
        <span>
          <ChevronRight size={16} />
          {detail.label}
        </span>
        <em>{detail.name ?? detail.relatedCallName ?? detail.type}</em>
      </summary>
      <pre>{JSON.stringify(detail.rawPayload, null, 2)}</pre>
    </details>
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

function eventAnchor(sourceEventIndex: number): string {
  return `event-${sourceEventIndex}`;
}

function detailAnchor(detail: ExecutionDetail): string {
  return `execution-${detail.id}`;
}

function buildSearchTargets(
  searchQuery: string,
  conversationItems: PrimaryConversationItem[],
  executionDetails: ExecutionDetail[]
): SearchTarget[] {
  const query = normalizeSearch(searchQuery);
  if (!query) {
    return [];
  }

  const conversationTargets = conversationItems
    .filter((item) => normalizeSearch(item.text).includes(query))
    .map((item) => ({
      anchor: eventAnchor(item.sourceEventIndex),
      kind: "conversation" as const,
      text: item.text
    }));

  const executionTargets = executionDetails
    .filter((detail) => normalizeSearch([detail.label, detail.name, detail.relatedCallName, detail.type].filter(Boolean).join(" ")).includes(query))
    .map((detail) => ({
      anchor: detailAnchor(detail),
      kind: "execution" as const,
      text: [detail.label, detail.name, detail.relatedCallName, detail.type].filter(Boolean).join(" ")
    }));

  return [...conversationTargets, ...executionTargets];
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function renderHighlightedText(text: string, searchQuery: string) {
  const query = searchQuery.trim();
  if (!query) {
    return text;
  }

  const lowerText = text.toLocaleLowerCase();
  const lowerQuery = query.toLocaleLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = lowerText.indexOf(lowerQuery);

  while (matchIndex >= 0) {
    if (matchIndex > cursor) {
      parts.push(text.slice(cursor, matchIndex));
    }

    const end = matchIndex + query.length;
    parts.push(<mark key={`${matchIndex}-${end}`}>{text.slice(matchIndex, end)}</mark>);
    cursor = end;
    matchIndex = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts.length ? parts : text;
}
