import { Bot, ChevronRight, Code2, MessageSquareText, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { mockSession, type MockConversationBlock } from "./mockSession.js";

export function App() {
  const [activeTurn, setActiveTurn] = useState("turn-1");
  const [showRaw, setShowRaw] = useState(false);
  const userTurns = useMemo(() => mockSession.blocks.filter((block) => block.type === "user"), []);

  return (
    <main className="app-shell">
      <aside className="session-sidebar" aria-label="Session metadata">
        <div>
          <p className="eyebrow">Dev Journal</p>
          <h1>Session Review</h1>
          <p className="sidebar-copy">A clean review-first prototype for local Codex session history.</p>
        </div>

        <section className="meta-list" aria-label="Session details">
          <MetaRow label="Project" value={mockSession.project} />
          <MetaRow label="Started" value={mockSession.startedAt} />
          <MetaRow label="Source" value={mockSession.source} />
          <MetaRow label="Model" value={mockSession.model} />
          <MetaRow label="Status" value={mockSession.status} />
        </section>

        <button className="secondary-button" type="button">
          <RefreshCw size={16} />
          Refresh sessions
        </button>
      </aside>

      <section className="review-panel" aria-label="Clean session review">
        <header className="review-header">
          <div>
            <p className="eyebrow">Clean Review View</p>
            <h2>{mockSession.title}</h2>
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
