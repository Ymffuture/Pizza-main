// src/components/AiChat.jsx
// KotaBot — floating AI chat bubble for KotaBites
// Drop <AiChat /> into App.jsx (inside AuthProvider) and it appears on every page.

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";

/* ── Utility: detect order ID in text ─────────────────────────────────────── */
function extractOrderId(text) {
  // Full 24-char MongoDB ObjectId
  const full = text.match(/\b([0-9a-fA-F]{24})\b/);
  if (full) return full[1];
  return null;
}

/* ── Message bubble ─────────────────────────────────────────────────────────── */
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`kb-ai-bubble-row ${isUser ? "kb-ai-bubble-user" : "kb-ai-bubble-bot"}`}>
      {!isUser && (
        <div className="kb-ai-avatar kb-ai-avatar-bot">
          <Bot className="w-3.5 h-3.5" />
        </div>
      )}
      <div className={`kb-ai-bubble ${isUser ? "kb-ai-bubble-u" : "kb-ai-bubble-b"}`}>
        {msg.content}
      </div>
      {isUser && (
        <div className="kb-ai-avatar kb-ai-avatar-user">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */
export default function AiChat() {
  const { isAuth } = useAuth();
  const params = useParams();
  const pageOrderId = params?.id || null;  // if on /order/:id page

  const [open, setOpen]         = useState(false);
  const [minimised, setMin]     = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [contextId, setCtxId]   = useState(pageOrderId);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Yebo! 👋 I'm KotaBot. I can help you track an order, suggest something lekker to eat, or pass on any feedback. What can I do for you?",
    },
  ]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && !minimised) inputRef.current?.focus();
  }, [open, minimised]);

  // Sync order context when navigating to /order/:id
  useEffect(() => {
    if (pageOrderId) setCtxId(pageOrderId);
  }, [pageOrderId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Detect order ID in message and use as context
    const detectedId = extractOrderId(text);
    if (detectedId) setCtxId(detectedId);

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axiosClient.post("/ai/chat", {
        messages: updated,
        order_id: detectedId || contextId || null,
      });

      setMessages([...updated, { role: "assistant", content: data.reply }]);
      if (!open) setUnread((u) => u + 1);
    } catch (err) {
      const errMsg =
        err?.response?.status === 401
          ? "Please sign in to chat with KotaBot."
          : "Eish, something went wrong. Try again in a moment.";
      setMessages([...updated, { role: "assistant", content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setMin(false);
    setUnread(0);
  };

  // Don't render if not authenticated (optional — remove this if you want public access)
  // if (!isAuth) return null;

  return (
    <>
      <style>{styles}</style>

      {/* ── Floating button ── */}
      {!open && (
        <button className="kb-ai-fab" onClick={handleOpen} aria-label="Open KotaBot">
          <MessageCircle className="w-6 h-6" />
          <span className="kb-ai-fab-label">KotaBot</span>
          {unread > 0 && <span className="kb-ai-unread">{unread}</span>}
        </button>
      )}

      {/* ── Chat window ── */}
      {open && (
        <div className={`kb-ai-window${minimised ? " kb-ai-minimised" : ""}`}>

          {/* Header */}
          <div className="kb-ai-header">
            <div className="kb-ai-header-left">
              <div className="kb-ai-header-icon">
                <Bot className="w-4 h-4" style={{ color: "#0e0700" }} />
              </div>
              <div>
                <p className="kb-ai-header-name">KotaBot</p>
                <p className="kb-ai-header-sub">
                  {loading ? (
                    <span className="kb-ai-typing">typing…</span>
                  ) : (
                    "AI assistant · always on"
                  )}
                </p>
              </div>
            </div>
            <div className="kb-ai-header-actions">
              <button
                className="kb-ai-icon-btn"
                onClick={() => setMin((m) => !m)}
                title={minimised ? "Expand" : "Minimise"}
              >
                {minimised ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                className="kb-ai-icon-btn kb-ai-close-btn"
                onClick={() => setOpen(false)}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!minimised && (
            <>
              <div className="kb-ai-messages">
                {messages.map((m, i) => (
                  <Bubble key={i} msg={m} />
                ))}
                {loading && (
                  <div className="kb-ai-bubble-row kb-ai-bubble-bot">
                    <div className="kb-ai-avatar kb-ai-avatar-bot">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="kb-ai-bubble kb-ai-bubble-b kb-ai-typing-bubble">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              {messages.length === 1 && (
                <div className="kb-ai-quick-row">
                  {[
                    "Track my order",
                    "What's on the menu?",
                    "Recommend something",
                    "Leave feedback",
                  ].map((q) => (
                    <button
                      key={q}
                      className="kb-ai-quick-chip"
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input row */}
              <div className="kb-ai-input-row">
                <input
                  ref={inputRef}
                  className="kb-ai-input"
                  placeholder={isAuth ? "Ask KotaBot anything…" : "Sign in to chat"}
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
                <button
                  className="kb-ai-send-btn"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 kb-ai-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  /* FAB */
  .kb-ai-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 9998;
    display: flex; align-items: center; gap: 8px;
    background: #DA291C;
    color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 13px;
    padding: 13px 20px; border-radius: 50px;
    box-shadow: 0 8px 28px rgba(218,41,28,0.55), 0 0 0 2px rgba(255,199,44,0.25);
    transition: all 0.25s;
    animation: kbAiFabIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .kb-ai-fab:hover { transform: scale(1.06); background: #b91c1c; }
  .kb-ai-fab-label { letter-spacing: 0.04em; }
  .kb-ai-unread {
    position: absolute; top: -6px; right: -6px;
    min-width: 20px; height: 20px; border-radius: 50px;
    background: #FFC72C; color: #0e0700;
    font-size: 11px; font-weight: 900;
    display: flex; align-items: center; justify-content: center; padding: 0 5px;
    animation: kbPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes kbAiFabIn {
    from { opacity: 0; transform: translateY(20px) scale(0.85); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes kbPop {
    from { transform: scale(0); }
    to   { transform: scale(1); }
  }

  /* Window */
  .kb-ai-window {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    width: min(380px, calc(100vw - 32px));
    background: #1a0e00;
    border: 1px solid rgba(255,199,44,0.15);
    border-radius: 22px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,199,44,0.06);
    display: flex; flex-direction: column;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    overflow: hidden;
    animation: kbWindowIn 0.3s cubic-bezier(0.34,1.2,0.64,1);
    max-height: calc(100vh - 48px);
  }
  .kb-ai-minimised { height: auto !important; }
  @keyframes kbWindowIn {
    from { opacity: 0; transform: translateY(16px) scale(0.96); }
    to   { opacity: 1; transform: none; }
  }

  /* Header */
  .kb-ai-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px;
    background: linear-gradient(135deg, rgba(218,41,28,0.18) 0%, rgba(255,199,44,0.06) 100%);
    border-bottom: 1px solid rgba(255,199,44,0.1);
    flex-shrink: 0;
  }
  .kb-ai-header-left { display: flex; align-items: center; gap: 10px; }
  .kb-ai-header-icon {
    width: 34px; height: 34px;
    background: #FFC72C; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 0 16px rgba(255,199,44,0.35);
  }
  .kb-ai-header-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 17px; letter-spacing: 2px; color: #fff8e7; line-height: 1;
  }
  .kb-ai-header-sub { font-size: 10px; color: rgba(255,248,231,0.42); font-weight: 600; margin-top: 1px; }
  .kb-ai-typing { color: #FFC72C; animation: kbBlink 1s ease infinite; }
  @keyframes kbBlink { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .kb-ai-header-actions { display: flex; align-items: center; gap: 4px; }
  .kb-ai-icon-btn {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(255,248,231,0.06); border: 1px solid rgba(255,199,44,0.12);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,248,231,0.5); cursor: pointer; transition: all 0.18s;
  }
  .kb-ai-icon-btn:hover { color: #fff8e7; border-color: rgba(255,199,44,0.3); }
  .kb-ai-close-btn:hover { background: rgba(218,41,28,0.25); color: #DA291C; border-color: rgba(218,41,28,0.3); }

  /* Messages */
  .kb-ai-messages {
    flex: 1; overflow-y: auto; padding: 14px 14px 6px;
    display: flex; flex-direction: column; gap: 10px;
    max-height: 340px; min-height: 160px;
    scrollbar-width: thin; scrollbar-color: rgba(255,199,44,0.18) transparent;
  }
  .kb-ai-messages::-webkit-scrollbar { width: 4px; }
  .kb-ai-messages::-webkit-scrollbar-thumb { background: rgba(255,199,44,0.18); border-radius: 4px; }

  .kb-ai-bubble-row { display: flex; align-items: flex-end; gap: 7px; }
  .kb-ai-bubble-user { flex-direction: row-reverse; }
  .kb-ai-bubble-bot  { flex-direction: row; }

  .kb-ai-avatar {
    width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .kb-ai-avatar-bot  { background: rgba(255,199,44,0.15); color: #FFC72C; }
  .kb-ai-avatar-user { background: rgba(218,41,28,0.2); color: #DA291C; }

  .kb-ai-bubble {
    max-width: 78%; padding: 9px 13px; border-radius: 14px;
    font-size: 13px; font-weight: 500; line-height: 1.55;
    white-space: pre-wrap; word-break: break-word;
  }
  .kb-ai-bubble-b {
    background: rgba(255,248,231,0.06);
    border: 1px solid rgba(255,199,44,0.1);
    color: #fff8e7;
    border-bottom-left-radius: 4px;
  }
  .kb-ai-bubble-u {
    background: #DA291C;
    color: white;
    border-bottom-right-radius: 4px;
    box-shadow: 0 2px 10px rgba(218,41,28,0.3);
  }

  /* Typing indicator */
  .kb-ai-typing-bubble {
    display: flex; align-items: center; gap: 5px;
    padding: 10px 14px;
  }
  .kb-ai-typing-bubble span {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,199,44,0.6);
    animation: kbDot 1.2s ease infinite;
  }
  .kb-ai-typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
  .kb-ai-typing-bubble span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes kbDot { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }

  /* Quick chips */
  .kb-ai-quick-row {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 6px 14px 10px; flex-shrink: 0;
  }
  .kb-ai-quick-chip {
    padding: 5px 11px; border-radius: 50px;
    background: rgba(255,199,44,0.07);
    border: 1px solid rgba(255,199,44,0.2);
    color: rgba(255,248,231,0.7);
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: all 0.18s; font-family: 'Plus Jakarta Sans', sans-serif;
    white-space: nowrap;
  }
  .kb-ai-quick-chip:hover {
    background: rgba(255,199,44,0.15); color: #fff8e7;
    border-color: rgba(255,199,44,0.4);
  }

  /* Input row */
  .kb-ai-input-row {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px 14px; flex-shrink: 0;
    border-top: 1px solid rgba(255,199,44,0.08);
  }
  .kb-ai-input {
    flex: 1; background: rgba(255,248,231,0.05);
    border: 1.5px solid rgba(255,199,44,0.12); border-radius: 12px;
    padding: 9px 13px; color: #fff8e7;
    font-size: 13px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none; transition: border-color 0.2s;
  }
  .kb-ai-input:focus { border-color: rgba(255,199,44,0.4); }
  .kb-ai-input::placeholder { color: rgba(255,248,231,0.3); }
  .kb-ai-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .kb-ai-send-btn {
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    background: #DA291C; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: white; transition: all 0.18s;
    box-shadow: 0 3px 12px rgba(218,41,28,0.4);
  }
  .kb-ai-send-btn:hover:not(:disabled) { background: #b91c1c; transform: scale(1.05); }
  .kb-ai-send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  @keyframes kbSpin { to { transform: rotate(360deg); } }
  .kb-ai-spin { animation: kbSpin 0.75s linear infinite; }

  @media (max-width: 480px) {
    .kb-ai-window { right: 12px; bottom: 12px; width: calc(100vw - 24px); }
    .kb-ai-fab    { right: 12px; bottom: 12px; }
  }
`;
