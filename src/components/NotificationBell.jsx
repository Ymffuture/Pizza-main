// src/components/NotificationBell.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, X, CheckCheck, Info, AlertTriangle,
  Star, Zap, Megaphone, RefreshCw, BellOff,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const TYPE_CFG = {
  info:        { Icon: Info,          color: "#60a5fa", bg: "rgba(96,165,250,0.14)",  border: "rgba(96,165,250,0.25)"  },
  warning:     { Icon: AlertTriangle, color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.25)"  },
  promo:       { Icon: Star,          color: "#FFC72C", bg: "rgba(255,199,44,0.12)",  border: "rgba(255,199,44,0.25)"  },
  update:      { Icon: Zap,           color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
  maintenance: { Icon: AlertTriangle, color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.25)"  },
  urgent:      { Icon: Megaphone,     color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
};
const DEFAULT_CFG = TYPE_CFG.info;

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { isAuth } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]     = useState(false);
  const [loading, setLoad]  = useState(false);
  const panelRef = useRef(null);
  const btnRef   = useRef(null);

  const unread = notifications.filter(n => !n.is_read).length;

  const load = useCallback(async () => {
    if (!isAuth) return;
    setLoad(true);
    try {
      const { data } = await axiosClient.get("/notifications/my");
      setNotifications(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoad(false); }
  }, [isAuth]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const fn = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  const markRead = async (id) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    await Promise.allSettled(ids.map(id => axiosClient.patch(`/notifications/${id}/read`)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (!isAuth) return null;

  return (
    <>
      <style>{css}</style>
      <div className="nb-root">

        {/* Bell button */}
        <button
          ref={btnRef}
          className={`nb-btn${open ? " nb-btn-open" : ""}${unread > 0 ? " nb-btn-has-unread" : ""}`}
          onClick={() => { setOpen(o => !o); }}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          {unread > 0
            ? <Bell style={{ width: 18, height: 18 }} className="nb-bell-ring" />
            : <Bell style={{ width: 18, height: 18 }} />}
          {unread > 0 && (
            <span className="nb-badge">{unread > 9 ? "9+" : unread}</span>
          )}
        </button>

        {/* Panel */}
        {open && (
          <div ref={panelRef} className="nb-panel z-[999]" role="dialog" aria-label="Notifications">

            {/* Header */}
            <div className="nb-panel-hd">
              <div className="nb-panel-hd-left">
                <span className="nb-panel-title">Notifications</span>
                {unread > 0 && (
                  <span className="nb-panel-unread-pill">{unread} new</span>
                )}
              </div>
              <div className="nb-panel-hd-actions">
                {unread > 0 && (
                  <button className="nb-mark-all" onClick={markAllRead} title="Mark all as read">
                    <CheckCheck style={{ width: 13, height: 13 }} />
                    All read
                  </button>
                )}
                <button
                  className={`nb-refresh${loading ? " nb-refresh-spin" : ""}`}
                  onClick={load}
                  title="Refresh"
                >
                  <RefreshCw style={{ width: 13, height: 13 }} />
                </button>
                <button className="nb-close" onClick={() => setOpen(false)} title="Close">
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="nb-panel-body">
              {loading && notifications.length === 0 ? (
                <div className="nb-empty">
                  <div className="nb-dots">
                    <span /><span /><span />
                  </div>
                  <p>Loading…</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="nb-empty">
                  <div className="nb-empty-icon">
                    <BellOff style={{ width: 26, height: 26, color: "rgba(255,248,231,0.2)" }} />
                  </div>
                  <p className="nb-empty-title">You're all caught up</p>
                  <p className="nb-empty-sub">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg   = TYPE_CFG[n.type] ?? DEFAULT_CFG;
                  const NIcon = cfg.Icon;
                  return (
                    <div
                      key={n.id}
                      className={`nb-item${n.is_read ? " nb-item-read" : " nb-item-unread"}`}
                      onClick={() => !n.is_read && markRead(n.id)}
                      role={n.is_read ? undefined : "button"}
                      tabIndex={n.is_read ? undefined : 0}
                      onKeyDown={e => e.key === "Enter" && !n.is_read && markRead(n.id)}
                    >
                      {/* Left accent */}
                      {!n.is_read && (
                        <div className="nb-item-accent" style={{ background: cfg.color }} />
                      )}

                      {/* Icon */}
                      <div
                        className="nb-item-icon"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <NIcon style={{ width: 14, height: 14, color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="nb-item-content">
                        <p className="nb-item-title"
                          style={{ color: n.is_read ? "rgba(255,248,231,0.55)" : "#fff8e7" }}>
                          {n.title}
                        </p>
                        <p className="nb-item-msg">{n.message}</p>
                        <p className="nb-item-time">{timeAgo(n.created_at)}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.is_read && (
                        <div className="nb-unread-dot" style={{ background: cfg.color }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="nb-panel-ft">
                <span className="nb-ft-text">
                  {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.nb-root { position: relative; }

/* ── Bell button ── */
.nb-btn {
  position: relative;
  width: 38px; height: 38px;
  border-radius: 12px;
  background: rgba(255,248,231,0.05);
  border: 1px solid rgba(255,248,231,0.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,248,231,0.5);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.nb-btn:hover {
  background: rgba(255,199,44,0.1);
  border-color: rgba(255,199,44,0.25);
  color: #FFC72C;
}
.nb-btn-open {
  background: rgba(255,199,44,0.1) !important;
  border-color: rgba(255,199,44,0.35) !important;
  color: #FFC72C !important;
}
.nb-btn-has-unread {
  border-color: rgba(218,41,28,0.35);
  color: rgba(255,248,231,0.7);
}

/* Bell ring animation */
@keyframes nbRing {
  0%,100% { transform: rotate(0deg); }
  10%     { transform: rotate(14deg); }
  20%     { transform: rotate(-12deg); }
  30%     { transform: rotate(8deg); }
  40%     { transform: rotate(-6deg); }
  50%     { transform: rotate(0deg); }
}
.nb-bell-ring {
  animation: nbRing 2.5s ease infinite;
  transform-origin: top center;
}

/* Badge */
.nb-badge {
  position: absolute;
  top: -5px; right: -5px;
  min-width: 18px; height: 18px;
  padding: 0 4px;
  background: linear-gradient(135deg, #DA291C, #b91c1c);
  color: white;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 10px; font-weight: 900;
  border-radius: 10px;
  border: 2px solid #0e0700;
  display: flex; align-items: center; justify-content: center;
  animation: nbBadgePop 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes nbBadgePop { from { transform: scale(0); } to { transform: scale(1); } }

/* ── Panel ── */
.nb-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 340px;
  background: #130c00;
  border: 1px solid rgba(255,199,44,0.15);
  border-radius: 18px;
  box-shadow:
    0 24px 64px rgba(0,0,0,0.7),
    0 0 0 1px rgba(255,199,44,0.05),
    inset 0 1px 0 rgba(255,248,231,0.04);
  display: flex; flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  animation: nbPanelIn 0.25s cubic-bezier(0.34,1.2,0.64,1);
  max-height: 480px;
}
@keyframes nbPanelIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

/* Header */
.nb-panel-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(255,199,44,0.08);
  background: linear-gradient(135deg, rgba(255,199,44,0.06) 0%, transparent 60%);
  flex-shrink: 0;
}
.nb-panel-hd-left { display: flex; align-items: center; gap: 8px; }
.nb-panel-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 16px; letter-spacing: 2px;
  color: #fff8e7; line-height: 1;
}
.nb-panel-unread-pill {
  padding: 2px 8px;
  background: rgba(218,41,28,0.2);
  border: 1px solid rgba(218,41,28,0.35);
  border-radius: 50px;
  font-size: 10px; font-weight: 800;
  color: #f87171;
  letter-spacing: 0.04em;
}
.nb-panel-hd-actions { display: flex; align-items: center; gap: 4px; }

.nb-mark-all {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 10px;
  background: rgba(255,199,44,0.08);
  border: 1px solid rgba(255,199,44,0.18);
  border-radius: 8px;
  color: rgba(255,199,44,0.75);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 10px; font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.03em;
}
.nb-mark-all:hover { background: rgba(255,199,44,0.15); color: #FFC72C; }

.nb-refresh, .nb-close {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: rgba(255,248,231,0.05);
  border: 1px solid rgba(255,248,231,0.07);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,248,231,0.35);
  cursor: pointer;
  transition: all 0.15s;
}
.nb-refresh:hover, .nb-close:hover {
  color: #fff8e7;
  background: rgba(255,248,231,0.1);
}
.nb-close:hover { background: rgba(218,41,28,0.2); color: #f87171; }

@keyframes nbSpin { to { transform: rotate(360deg); } }
.nb-refresh-spin svg { animation: nbSpin 0.8s linear infinite; }

/* Body */
.nb-panel-body {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,199,44,0.15) transparent;
}
.nb-panel-body::-webkit-scrollbar { width: 4px; }
.nb-panel-body::-webkit-scrollbar-thumb { background: rgba(255,199,44,0.15); border-radius: 4px; }

/* Empty */
.nb-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; padding: 44px 24px;
  text-align: center;
}
.nb-empty-icon {
  width: 56px; height: 56px;
  border-radius: 16px;
  background: rgba(255,248,231,0.04);
  border: 1px solid rgba(255,248,231,0.06);
  display: flex; align-items: center; justify-content: center;
}
.nb-empty-title {
  font-size: 14px; font-weight: 800;
  color: rgba(255,248,231,0.45); margin: 0;
}
.nb-empty-sub {
  font-size: 12px; color: rgba(255,248,231,0.22);
  margin: 0;
}

/* Loading dots */
.nb-dots { display: flex; gap: 6px; align-items: center; }
.nb-dots span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,199,44,0.4);
  animation: nbDot 1.2s ease-in-out infinite;
}
.nb-dots span:nth-child(2) { animation-delay: 0.2s; }
.nb-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes nbDot { 0%,80%,100%{transform:scale(0.5);opacity:0.4} 40%{transform:scale(1);opacity:1} }
.nb-empty p { font-size: 12px; color: rgba(255,248,231,0.35); margin: 0; }

/* Notification item */
.nb-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,248,231,0.04);
  transition: background 0.18s;
  overflow: hidden;
}
.nb-item:last-child { border-bottom: none; }
.nb-item-unread {
  background: rgba(255,199,44,0.03);
  cursor: pointer;
}
.nb-item-unread:hover { background: rgba(255,199,44,0.06); }
.nb-item-read { opacity: 0.65; }

.nb-item-accent {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
}
.nb-item-icon {
  width: 32px; height: 32px;
  border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}
.nb-item-content { flex: 1; min-width: 0; }
.nb-item-title {
  font-size: 13px; font-weight: 700;
  margin: 0 0 3px;
  line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nb-item-msg {
  font-size: 12px;
  color: rgba(255,248,231,0.45);
  margin: 0 0 4px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.nb-item-time {
  font-size: 10px; font-weight: 700;
  color: rgba(255,248,231,0.25);
  letter-spacing: 0.03em;
  margin: 0;
}
.nb-unread-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
  box-shadow: 0 0 6px currentColor;
}

/* Footer */
.nb-panel-ft {
  padding: 10px 16px;
  border-top: 1px solid rgba(255,199,44,0.06);
  background: rgba(255,248,231,0.02);
  flex-shrink: 0;
}
.nb-ft-text {
  font-size: 10px; font-weight: 700;
  color: rgba(255,248,231,0.2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

@media (max-width: 420px) {
  .nb-panel { width: calc(100vw - 20px); right: -50px; }
}
`;
