// src/components/AiChat.jsx
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Maximize2, XCircle, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";

function extractOrderId(text) {
  const full = text.match(/\b([0-9a-fA-F]{24})\b/);
  return full ? full[1] : null;
}

/* ── Markdown components ── */
const markdownComponents = {
  p:      ({ children }) => <p className="kb-md-p">{children}</p>,
  strong: ({ children }) => <strong className="kb-md-strong">{children}</strong>,
  em:     ({ children }) => <em className="kb-md-em">{children}</em>,
  ul:     ({ children }) => <ul className="kb-md-ul">{children}</ul>,
  ol:     ({ children }) => <ol className="kb-md-ol">{children}</ol>,
  li:     ({ children }) => <li className="kb-md-li">{children}</li>,
  a:      ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="kb-md-a">
      {children}
    </a>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="kb-md-code-inline">{children}</code>
    ) : (
      <pre className="kb-md-pre"><code>{children}</code></pre>
    ),
  blockquote: ({ children }) => (
    <blockquote className="kb-md-blockquote">{children}</blockquote>
  ),
  h1: ({ children }) => <p className="kb-md-h">{children}</p>,
  h2: ({ children }) => <p className="kb-md-h">{children}</p>,
  h3: ({ children }) => <p className="kb-md-h3">{children}</p>,
  hr: () => <hr className="kb-md-hr" />,
};

/* ── Cancel confirmation card shown inside chat ── */
function CancelCard({ cancelResult, onDismiss }) {
  if (!cancelResult) return null;

  if (cancelResult.success) {
    return (
      <div className="kb-cancel-card kb-cancel-success">
        <CheckCircle className="w-4 h-4" style={{ color: "#4ade80", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p className="kb-cancel-title">Order Cancelled</p>
          <p className="kb-cancel-sub">Order #{cancelResult.short_id} has been cancelled successfully.</p>
        </div>
        <button className="kb-cancel-dismiss" onClick={onDismiss}>×</button>
      </div>
    );
  }

  return (
    <div className="kb-cancel-card kb-cancel-fail">
      <XCircle className="w-4 h-4" style={{ color: "#f87171", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p className="kb-cancel-title">Couldn&apos;t Cancel</p>
        <p className="kb-cancel-sub">{cancelResult.reason ?? "Something went wrong."}</p>
      </div>
      <button className="kb-cancel-dismiss" onClick={onDismiss}>×</button>
    </div>
  );
}

/* ── Message bubble ── */
function Bubble({ msg, onCancelConfirm, cancellingId }) {
  const isUser = msg.role === "user";
  return (
    <div className={`kb-ai-bubble-row ${isUser ? "kb-ai-bubble-user" : "kb-ai-bubble-bot"}`}>
      {!isUser && (
        <div className="kb-ai-avatar kb-ai-avatar-bot">
          <Bot className="w-3.5 h-3.5" />
        </div>
      )}
      <div className={`kb-ai-bubble ${isUser ? "kb-ai-bubble-u" : "kb-ai-bubble-b"}`}>
        {isUser ? (
          msg.content
        ) : (
          <>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {msg.content}
            </ReactMarkdown>

            {/* Cancel confirmation button — shown when bot asks to confirm */}
            {msg.pendingCancelId && (
              <div className="kb-confirm-row">
                <p className="kb-confirm-text">Confirm cancellation?</p>
                <div className="kb-confirm-btns">
                  <button
                    className="kb-confirm-yes"
                    disabled={cancellingId === msg.pendingCancelId}
                    onClick={() => onCancelConfirm(msg.pendingCancelId)}
                  >
                    {cancellingId === msg.pendingCancelId ? (
                      <Loader2 className="w-3 h-3 kb-ai-spin" />
                    ) : (
                      "Yes, cancel it"
                    )}
                  </button>
                  <button
                    className="kb-confirm-no"
                    onClick={() => onCancelConfirm(null)}
                  >
                    No, keep it
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {isUser && (
        <div className="kb-ai-avatar kb-ai-avatar-user">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function AiChat() {
  const { isAuth } = useAuth();
  const params = useParams();
  const pageOrderId = params?.id || null;

  const [open, setOpen]           = useState(false);
  const [minimised, setMin]       = useState(false);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [unread, setUnread]       = useState(0);
  const [contextId, setCtxId]     = useState(pageOrderId);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelResult, setCancelResult] = useState(null);
  const [messages, setMessages]   = useState([
    {
      role: "assistant",
      content:
        "Yebo! 👋 I'm **KotaBot**. I can help you:\n- 🔍 Track an order\n- ❌ Cancel an order\n- 🍔 Suggest something lekker\n- 💬 Pass on feedback\n\nWhat can I do for you?",
    },
  ]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open && !minimised) inputRef.current?.focus(); }, [open, minimised]);
  useEffect(() => { if (pageOrderId) setCtxId(pageOrderId); }, [pageOrderId]);

  /* ── Handle cancel confirmation from bubble button ── */
  const handleCancelConfirm = async (orderId) => {
    if (!orderId) {
      // User clicked "No, keep it" — just remove pendingCancelId from all messages
      setMessages((prev) =>
        prev.map((m) => ({ ...m, pendingCancelId: undefined }))
      );
      return;
    }

    setCancellingId(orderId);
    try {
      const { data } = await axiosClient.post("/ai/cancel-order", { order_id: orderId });
      setCancelResult(data);
      setMessages((prev) =>
        prev.map((m) => ({ ...m, pendingCancelId: undefined }))
      );
      // Add a bot confirmation message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ Done! Order **#${data.short_id}** has been cancelled. Sorry to see it go — hope to serve you again soon! 🙏`,
        },
      ]);
    } catch (err) {
      const reason =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        "Could not cancel order. Please try again.";
      setCancelResult({ success: false, reason });
      setMessages((prev) =>
        prev.map((m) => ({ ...m, pendingCancelId: undefined }))
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const detectedId = extractOrderId(text);
    if (detectedId) setCtxId(detectedId);

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setCancelResult(null);

    // Strip leading assistant messages before sending — Gemini requires user first
    const firstUserIdx = updated.findIndex((m) => m.role === "user");
    const apiMessages = firstUserIdx >= 0 ? updated.slice(firstUserIdx) : updated;

    try {
      const { data } = await axiosClient.post("/ai/chat", {
        messages: apiMessages,
        order_id: detectedId || contextId || null,
      });

      const botMsg = {
        role: "assistant",
        content: data.reply,
      };

      // If the backend auto-cancelled (KotaBot used the [CANCEL_ORDER:...] tag),
      // surface the result directly.
      if (data.cancel_result) {
        setCancelResult(data.cancel_result);
      }

      // If the reply asks the user to confirm, attach the pending cancel ID
      // so the bubble renders the confirm/deny buttons.
      // We detect confirmation intent by checking if cancel_result is absent but
      // the reply mentions confirming a cancel — use the contextId or detectedId.
      const pendingId = !data.cancel_result
        ? (() => {
            // Look for "confirm" + cancel intent phrasing + a known order ID
            const lowerReply = data.reply.toLowerCase();
            const wantConfirm =
              (lowerReply.includes("cancel") && lowerReply.includes("confirm")) ||
              lowerReply.includes("sure you want to cancel");
            if (!wantConfirm) return undefined;
            // Use the order ID the user mentioned or the active context
            return detectedId || contextId || undefined;
          })()
        : undefined;

      if (pendingId) {
        botMsg.pendingCancelId = pendingId;
      }

      setMessages([...updated, botMsg]);
      if (!open) setUnread((u) => u + 1);
    } catch (err) {
      const errMsg =
        err?.response?.status === 401
          ? "Please **sign in** to chat with KotaBot."
          : "Eish, something went wrong. Try again in a moment.";
      setMessages([...updated, { role: "assistant", content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => { setOpen(true); setMin(false); setUnread(0); };

  return (
    <>
      <style>{styles}</style>

      {/* FAB */}
      {!open && (
        <button className="kb-ai-fab" onClick={handleOpen} aria-label="Open KotaBot">
          <MessageCircle className="w-6 h-6" />
          <span className="kb-ai-fab-label">KotaBot</span>
          {unread > 0 && <span className="kb-ai-unread">{unread}</span>}
        </button>
      )}

      {/* Chat window */}
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
                  {loading
                    ? <span className="kb-ai-typing">typing…</span>
                    : "AI assistant · always on"}
                </p>
              </div>
            </div>
            <div className="kb-ai-header-actions">
              <button className="kb-ai-icon-btn" onClick={() => setMin((m) => !m)}
                title={minimised ? "Expand" : "Minimise"}>
                {minimised ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button className="kb-ai-icon-btn kb-ai-close-btn" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Cancel result banner */}
              {cancelResult && (
                <CancelCard
                  cancelResult={cancelResult}
                  onDismiss={() => setCancelResult(null)}
                />
              )}

              {/* Messages */}
              <div className="kb-ai-messages">
                {messages.map((m, i) => (
                  <Bubble
                    key={i}
                    msg={m}
                    onCancelConfirm={handleCancelConfirm}
                    cancellingId={cancellingId}
                  />
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

              {/* Quick chips */}
              {messages.length === 1 && (
                <div className="kb-ai-quick-row">
                  {[
                    "Track my order",
                    "Cancel an order",
                    "What's on the menu?",
                    "Leave feedback",
                  ].map((q) => (
                    <button
                      key={q}
                      className="kb-ai-quick-chip"
                      onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
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
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  /* ── FAB ── */
  .kb-ai-fab {
    position:fixed; bottom:24px; right:24px; z-index:9998;
    display:flex; align-items:center; gap:8px;
    background:#DA291C; color:white; border:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px;
    padding:13px 20px; border-radius:50px;
    box-shadow:0 8px 28px rgba(218,41,28,0.55),0 0 0 2px rgba(255,199,44,0.25);
    transition:all 0.25s; animation:kbAiFabIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .kb-ai-fab:hover { transform:scale(1.06); background:#b91c1c; }
  .kb-ai-unread {
    position:absolute; top:-6px; right:-6px;
    min-width:20px; height:20px; border-radius:50px;
    background:#FFC72C; color:#0e0700;
    font-size:11px; font-weight:900;
    display:flex; align-items:center; justify-content:center; padding:0 5px;
    animation:kbPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes kbAiFabIn { from{opacity:0;transform:translateY(20px) scale(0.85)} to{opacity:1;transform:none} }
  @keyframes kbPop { from{transform:scale(0)} to{transform:scale(1)} }

  /* ── Window ── */
  .kb-ai-window {
    position:fixed; bottom:24px; right:24px; z-index:9999;
    width:min(400px,calc(100vw - 32px));
    background:#1a0e00; border:1px solid rgba(255,199,44,0.15); border-radius:22px;
    box-shadow:0 24px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(255,199,44,0.06);
    display:flex; flex-direction:column;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
    overflow:hidden; animation:kbWindowIn 0.3s cubic-bezier(0.34,1.2,0.64,1);
    max-height:calc(100vh - 48px);
  }
  .kb-ai-minimised { height:auto !important; }
  @keyframes kbWindowIn { from{opacity:0;transform:translateY(16px) scale(0.96)} to{opacity:1;transform:none} }

  /* ── Header ── */
  .kb-ai-header {
    display:flex; align-items:center; justify-content:space-between; padding:14px 16px;
    background:linear-gradient(135deg,rgba(218,41,28,0.18) 0%,rgba(255,199,44,0.06) 100%);
    border-bottom:1px solid rgba(255,199,44,0.1); flex-shrink:0;
  }
  .kb-ai-header-left { display:flex; align-items:center; gap:10px; }
  .kb-ai-header-icon {
    width:34px; height:34px; background:#FFC72C; border-radius:10px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    box-shadow:0 0 16px rgba(255,199,44,0.35);
  }
  .kb-ai-header-name { font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:2px; color:#fff8e7; line-height:1; }
  .kb-ai-header-sub  { font-size:10px; color:rgba(255,248,231,0.42); font-weight:600; margin-top:1px; }
  .kb-ai-typing      { color:#FFC72C; animation:kbBlink 1s ease infinite; }
  @keyframes kbBlink { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .kb-ai-header-actions { display:flex; align-items:center; gap:4px; }
  .kb-ai-icon-btn {
    width:30px; height:30px; border-radius:8px;
    background:rgba(255,248,231,0.06); border:1px solid rgba(255,199,44,0.12);
    display:flex; align-items:center; justify-content:center;
    color:rgba(255,248,231,0.5); cursor:pointer; transition:all 0.18s;
  }
  .kb-ai-icon-btn:hover { color:#fff8e7; border-color:rgba(255,199,44,0.3); }
  .kb-ai-close-btn:hover { background:rgba(218,41,28,0.25); color:#DA291C; border-color:rgba(218,41,28,0.3); }

  /* ── Cancel result banner ── */
  .kb-cancel-card {
    display:flex; align-items:flex-start; gap:10px;
    margin:10px 12px 0; padding:10px 13px; border-radius:12px;
    border:1px solid; flex-shrink:0; animation:kbWindowIn 0.25s ease;
  }
  .kb-cancel-success { background:rgba(74,222,128,0.08); border-color:rgba(74,222,128,0.25); }
  .kb-cancel-fail    { background:rgba(248,113,113,0.08); border-color:rgba(248,113,113,0.25); }
  .kb-cancel-title   { font-size:12px; font-weight:800; color:#fff8e7; }
  .kb-cancel-sub     { font-size:11px; color:rgba(255,248,231,0.55); margin-top:2px; }
  .kb-cancel-dismiss { background:none; border:none; color:rgba(255,248,231,0.4); cursor:pointer; font-size:16px; line-height:1; padding:0 0 0 4px; flex-shrink:0; }
  .kb-cancel-dismiss:hover { color:#fff8e7; }

  /* ── Cancel confirm buttons inside bubble ── */
  .kb-confirm-row { margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,199,44,0.12); }
  .kb-confirm-text { font-size:11px; font-weight:700; color:rgba(255,248,231,0.6); margin-bottom:8px; }
  .kb-confirm-btns { display:flex; gap:8px; }
  .kb-confirm-yes {
    flex:1; display:flex; align-items:center; justify-content:center; gap:5px;
    background:#DA291C; color:white; border:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:11px;
    padding:8px 12px; border-radius:8px; transition:all 0.18s;
  }
  .kb-confirm-yes:hover:not(:disabled) { background:#b91c1c; }
  .kb-confirm-yes:disabled { opacity:0.55; cursor:not-allowed; }
  .kb-confirm-no {
    flex:1; background:rgba(255,248,231,0.06); border:1px solid rgba(255,199,44,0.15);
    color:rgba(255,248,231,0.6); cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:11px;
    padding:8px 12px; border-radius:8px; transition:all 0.18s;
  }
  .kb-confirm-no:hover { color:#fff8e7; border-color:rgba(255,199,44,0.3); }

  /* ── Messages scroll area ── */
  .kb-ai-messages {
    flex:1; overflow-y:auto; padding:14px 14px 6px;
    display:flex; flex-direction:column; gap:10px;
    max-height:360px; min-height:160px;
    scrollbar-width:thin; scrollbar-color:rgba(255,199,44,0.18) transparent;
  }
  .kb-ai-messages::-webkit-scrollbar { width:4px; }
  .kb-ai-messages::-webkit-scrollbar-thumb { background:rgba(255,199,44,0.18); border-radius:4px; }

  /* ── Bubble rows ── */
  .kb-ai-bubble-row { display:flex; align-items:flex-end; gap:7px; }
  .kb-ai-bubble-user { flex-direction:row-reverse; }
  .kb-ai-bubble-bot  { flex-direction:row; }
  .kb-ai-avatar {
    width:26px; height:26px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
  }
  .kb-ai-avatar-bot  { background:rgba(255,199,44,0.15); color:#FFC72C; }
  .kb-ai-avatar-user { background:rgba(218,41,28,0.2);  color:#DA291C; }
  .kb-ai-bubble {
    max-width:80%; padding:10px 14px; border-radius:14px;
    font-size:13px; font-weight:500; line-height:1.6; word-break:break-word;
  }
  .kb-ai-bubble-b {
    background:rgba(255,248,231,0.06); border:1px solid rgba(255,199,44,0.1);
    color:#fff8e7; border-bottom-left-radius:4px;
  }
  .kb-ai-bubble-u {
    background:#DA291C; color:white; border-bottom-right-radius:4px;
    box-shadow:0 2px 10px rgba(218,41,28,0.3);
  }

  /* ── Markdown styles ── */
  .kb-md-p  { margin:0 0 6px 0; }
  .kb-md-p:last-child { margin-bottom:0; }
  .kb-md-strong { color:#FFC72C; font-weight:800; }
  .kb-md-em     { color:rgba(255,248,231,0.75); font-style:italic; }
  .kb-md-ul, .kb-md-ol { margin:6px 0; padding-left:18px; display:flex; flex-direction:column; gap:3px; }
  .kb-md-li { font-size:13px; line-height:1.5; color:#fff8e7; }
  .kb-md-ul .kb-md-li { list-style:disc; }
  .kb-md-ol .kb-md-li { list-style:decimal; }
  .kb-md-a { color:#FFC72C; text-decoration:underline; text-underline-offset:2px; font-weight:600; }
  .kb-md-a:hover { color:#fff8e7; }
  .kb-md-code-inline { background:rgba(255,199,44,0.12); border:1px solid rgba(255,199,44,0.2); color:#FFC72C; font-family:monospace; font-size:12px; padding:1px 5px; border-radius:5px; }
  .kb-md-pre { background:rgba(0,0,0,0.35); border:1px solid rgba(255,199,44,0.12); border-radius:8px; padding:10px 12px; margin:6px 0; overflow-x:auto; font-size:11px; font-family:monospace; color:#fff8e7; line-height:1.6; }
  .kb-md-blockquote { border-left:3px solid #FFC72C; padding:4px 10px; margin:6px 0; background:rgba(255,199,44,0.06); border-radius:0 6px 6px 0; color:rgba(255,248,231,0.75); font-style:italic; font-size:12px; }
  .kb-md-h  { font-weight:800; color:#FFC72C; font-size:14px; margin:4px 0 2px; }
  .kb-md-h3 { font-weight:700; color:#fff8e7; font-size:13px; margin:4px 0 2px; }
  .kb-md-hr { border:none; border-top:1px solid rgba(255,199,44,0.15); margin:8px 0; }

  /* ── Typing dots ── */
  .kb-ai-typing-bubble { display:flex; align-items:center; gap:5px; padding:10px 14px; }
  .kb-ai-typing-bubble span { width:6px; height:6px; border-radius:50%; background:rgba(255,199,44,0.6); animation:kbDot 1.2s ease infinite; }
  .kb-ai-typing-bubble span:nth-child(2) { animation-delay:0.2s; }
  .kb-ai-typing-bubble span:nth-child(3) { animation-delay:0.4s; }
  @keyframes kbDot { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }

  /* ── Quick chips ── */
  .kb-ai-quick-row { display:flex; flex-wrap:wrap; gap:6px; padding:6px 14px 10px; flex-shrink:0; }
  .kb-ai-quick-chip {
    padding:5px 11px; border-radius:50px;
    background:rgba(255,199,44,0.07); border:1px solid rgba(255,199,44,0.2);
    color:rgba(255,248,231,0.7); font-size:11px; font-weight:700; cursor:pointer;
    transition:all 0.18s; font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap;
  }
  .kb-ai-quick-chip:hover { background:rgba(255,199,44,0.15); color:#fff8e7; border-color:rgba(255,199,44,0.4); }

  /* ── Input row ── */
  .kb-ai-input-row {
    display:flex; align-items:center; gap:8px; padding:10px 12px 14px; flex-shrink:0;
    border-top:1px solid rgba(255,199,44,0.08);
  }
  .kb-ai-input {
    flex:1; background:rgba(255,248,231,0.05); border:1.5px solid rgba(255,199,44,0.12);
    border-radius:12px; padding:9px 13px; color:#fff8e7;
    font-size:13px; font-weight:500; font-family:'Plus Jakarta Sans',sans-serif;
    outline:none; transition:border-color 0.2s;
  }
  .kb-ai-input:focus { border-color:rgba(255,199,44,0.4); }
  .kb-ai-input::placeholder { color:rgba(255,248,231,0.3); }
  .kb-ai-input:disabled { opacity:0.5; cursor:not-allowed; }
  .kb-ai-send-btn {
    width:38px; height:38px; border-radius:11px; flex-shrink:0;
    background:#DA291C; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:white; transition:all 0.18s; box-shadow:0 3px 12px rgba(218,41,28,0.4);
  }
  .kb-ai-send-btn:hover:not(:disabled) { background:#b91c1c; transform:scale(1.05); }
  .kb-ai-send-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
  @keyframes kbSpin { to { transform:rotate(360deg); } }
  .kb-ai-spin { animation:kbSpin 0.75s linear infinite; }

  @media (max-width:480px) {
    .kb-ai-window { right:12px; bottom:12px; width:calc(100vw - 24px); }
    .kb-ai-fab    { right:12px; bottom:12px; }
  }
`;
