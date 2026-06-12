// src/components/NotificationBell.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, X, CheckCheck, Info, AlertTriangle,
  Star, Zap, Megaphone, RefreshCw, BellOff,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const TYPE_CFG = {
  info:        { Icon: Info,          color: "#0070f3", bg: "rgba(0,112,243,0.06)",  border: "rgba(0,112,243,0.12)"  },
  warning:     { Icon: AlertTriangle, color: "#f5a623", bg: "rgba(245,166,35,0.06)",  border: "rgba(245,166,35,0.12)"  },
  promo:       { Icon: Star,          color: "#7928ca", bg: "rgba(121,40,202,0.06)",  border: "rgba(121,40,202,0.12)"  },
  update:      { Icon: Zap,           color: "#0070f3", bg: "rgba(0,112,243,0.06)",  border: "rgba(0,112,243,0.12)"  },
  maintenance: { Icon: AlertTriangle, color: "#f5a623", bg: "rgba(245,166,35,0.06)",  border: "rgba(245,166,35,0.12)"  },
  urgent:      { Icon: Megaphone,     color: "#e00",    bg: "rgba(224,0,0,0.06)",    border: "rgba(224,0,0,0.12)"    },
};
const DEFAULT_CFG = TYPE_CFG.info;

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NotificationBell() {
  const { isAuth } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]     = useState(false);
  const [loading, setLoad]  = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const sheetRef = useRef(null);
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

  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (!sheetRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
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

  const deleteNotification = async (id) => {
    try {
      await axiosClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  const filteredNotifications = activeTab === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  if (!isAuth) return null;

  return (
    <>
      <style>{css}</style>
      <div className="vc-root">

        {/* Bell button — Vercel minimal style */}
        <button
          ref={btnRef}
          className={`vc-btn${open ? " vc-btn-open" : ""}${unread > 0 ? " vc-btn-unread" : ""}`}
          onClick={() => { setOpen(o => !o); }}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          <div className="vc-btn-inner">
            {unread > 0
              ? <Bell style={{ width: 18, height: 18 }} className="vc-bell-shake" />
              : <Bell style={{ width: 18, height: 18 }} />
            }
          </div>
          {unread > 0 && (
            <span className="vc-badge">{unread > 99 ? "99+" : unread}</span>
          )}
        </button>

        {/* Overlay — Vercel subtle */}
        {open && (
          <div 
            className="vc-overlay" 
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Bottom Sheet — Vercel + Facebook hybrid */}
        {open && (
          <div ref={sheetRef} className="vc-sheet" role="dialog" aria-label="Notifications">

            {/* Drag handle */}
            <div className="vc-handle-bar" onClick={() => setOpen(false)}>
              <div className="vc-handle" />
            </div>

            {/* Header */}
            <div className="vc-header">
              <div className="vc-header-top">
                <h2 className="vc-title">Notifications</h2>
                <div className="vc-header-actions">
                  {unread > 0 && (
                    <button className="vc-hbtn vc-mark-all" onClick={markAllRead} title="Mark all as read">
                      <CheckCheck style={{ width: 14, height: 14 }} />
                      <span>Mark all</span>
                    </button>
                  )}
                  <button 
                    className={`vc-hbtn vc-refresh${loading ? " vc-spin" : ""}`} 
                    onClick={load} 
                    title="Refresh"
                  >
                    <RefreshCw style={{ width: 14, height: 14 }} />
                  </button>
                  <button className="vc-hbtn vc-close" onClick={() => setOpen(false)} title="Close">
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              {/* Tabs — Vercel pill style */}
              <div className="vc-tabs">
                <button 
                  className={`vc-tab${activeTab === "all" ? " vc-tab-active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
                <button 
                  className={`vc-tab${activeTab === "unread" ? " vc-tab-active" : ""}`}
                  onClick={() => setActiveTab("unread")}
                >
                  Unread
                  {unread > 0 && <span className="vc-tab-dot" />}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="vc-body">
              {loading && filteredNotifications.length === 0 ? (
                <div className="vc-empty">
                  <div className="vc-skeleton-list">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="vc-skeleton-item">
                        <div className="vc-skeleton-avatar" />
                        <div className="vc-skeleton-lines">
                          <div className="vc-skeleton-line vc-skeleton-short" />
                          <div className="vc-skeleton-line" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="vc-empty">
                  <div className="vc-empty-icon">
                    <BellOff style={{ width: 28, height: 28, color: "#888" }} />
                  </div>
                  <p className="vc-empty-title">
                    {activeTab === "unread" ? "No unread notifications" : "All caught up"}
                  </p>
                  <p className="vc-empty-sub">
                    {activeTab === "unread" 
                      ? "Switch to All to see older notifications" 
                      : "New notifications will appear here"}
                  </p>
                </div>
              ) : (
                <div className="vc-list">
                  {filteredNotifications.map(n => {
                    const cfg   = TYPE_CFG[n.type] ?? DEFAULT_CFG;
                    const NIcon = cfg.Icon;
                    return (
                      <div
                        key={n.id}
                        className={`vc-item${n.is_read ? " vc-item-read" : " vc-item-unread"}`}
                        onClick={() => !n.is_read && markRead(n.id)}
                        role={n.is_read ? undefined : "button"}
                        tabIndex={n.is_read ? undefined : 0}
                        onKeyDown={e => e.key === "Enter" && !n.is_read && markRead(n.id)}
                      >
                        <div 
                          className="vc-item-avatar"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                        >
                          <NIcon style={{ width: 16, height: 16, color: cfg.color }} />
                        </div>
                        <div className="vc-item-content">
                          <p className="vc-item-text">
                            <span className="vc-item-title">{n.title}</span>{" "}
                            <span className="vc-item-msg">{n.message}</span>
                          </p>
                          <p className="vc-item-time">{timeAgo(n.created_at)}</p>
                        </div>
                        <div className="vc-item-right">
                          {!n.is_read && (
                            <div className="vc-item-dot" style={{ background: cfg.color }} />
                          )}
                          <button 
                            className="vc-item-delete"
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                            title="Remove"
                          >
                            <X style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="vc-footer">
                <span className="vc-footer-text">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
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
/* ── Root ── */
.vc-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  z-index: 9999;
}

/* ── Bell button — Vercel minimal ── */
.vc-btn {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50px;
  background: transparent;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  left:20px;
  top:32px;
  
}
.vc-btn:hover {
  background: #fafafa;
  border-color: #eaeaea;
  color: #000;
}
.vc-btn-open {
  background: #fafafa !important;
  border-color: #eaeaea !important;
  color: #000 !important;
}
.vc-btn-unread {
  color: #0070f3;
}
.vc-btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Bell shake */
@keyframes vcBellShake {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(12deg); }
  20% { transform: rotate(-10deg); }
  30% { transform: rotate(8deg); }
  40% { transform: rotate(-6deg); }
  50% { transform: rotate(0deg); }
}
.vc-bell-shake {
  animation: vcBellShake 2s ease infinite;
  transform-origin: top center;
}

/* Badge — Vercel red dot */
.vc-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #e00;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: vcBadgePop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes vcBadgePop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

/* ── Overlay — Vercel subtle ── */
.vc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 9998;
  animation: vcFadeIn 0.2s ease;
}
@keyframes vcFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── Bottom Sheet — Vercel aesthetic + Facebook behavior ── */
.vc-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  animation: vcSheetUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 85vh;
}
@keyframes vcSheetUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Drag handle */
.vc-handle-bar {
  display: flex;
  justify-content: center;
  padding: 10px 0 6px;
  cursor: pointer;
}
.vc-handle {
  width: 32px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
}

/* ── Header ── */
.vc-header {
  flex-shrink: 0;
  padding: 2px 16px 0;
  border-bottom: 1px solid #eaeaea;
}
.vc-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.vc-title {
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin: 0;
  letter-spacing: -0.02em;
}
.vc-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vc-hbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
  font-weight: 500;
}
.vc-hbtn:hover {
  background: #fafafa;
  border-color: #eaeaea;
  color: #000;
}
.vc-mark-all {
  border-radius: 6px;
  padding: 6px 10px;
  white-space: nowrap;
}
.vc-close:hover {
  background: #fafafa;
  border-color: #eaeaea;
  color: #e00;
}

@keyframes vcSpin {
  to { transform: rotate(360deg); }
}
.vc-spin svg {
  animation: vcSpin 0.8s linear infinite;
}

/* ── Tabs — Vercel pill style ── */
.vc-tabs {
  display: flex;
  gap: 4px;
  padding-bottom: 10px;
}
.vc-tab {
  padding: 5px 14px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.vc-tab:hover {
  background: #fafafa;
  border-color: #eaeaea;
  color: #000;
}
.vc-tab-active {
  background: #000 !important;
  border-color: #000 !important;
  color: #fff !important;
}
.vc-tab-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #e00;
  border-radius: 50%;
  margin-left: 6px;
  vertical-align: middle;
}

/* ── Body ── */
.vc-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #ddd transparent;
}
.vc-body::-webkit-scrollbar {
  width: 4px;
}
.vc-body::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

/* Skeleton */
@keyframes vcSkeleton {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.vc-skeleton-list {
  padding: 12px 16px;
}
.vc-skeleton-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.vc-skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eaeaea 50%, #f5f5f5 75%);
  background-size: 200px 100%;
  animation: vcSkeleton 1.5s ease-in-out infinite;
  flex-shrink: 0;
}
.vc-skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vc-skeleton-line {
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eaeaea 50%, #f5f5f5 75%);
  background-size: 200px 100%;
  animation: vcSkeleton 1.5s ease-in-out infinite;
}
.vc-skeleton-short {
  width: 55%;
}

/* Empty */
.vc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 56px 24px;
  text-align: center;
}
.vc-empty-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.vc-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #000;
  margin: 0;
}
.vc-empty-sub {
  font-size: 13px;
  color: #888;
  margin: 0;
  max-width: 260px;
  line-height: 1.4;
}

/* ── Notification list ── */
.vc-list {
  padding: 4px 0;
}
.vc-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  transition: background 0.12s;
  position: relative;
  cursor: pointer;
  border-bottom: 1px solid transparent;
}
.vc-item:hover {
  background: #fafafa;
}
.vc-item-unread {
  background: #fafafa;
}
.vc-item-unread:hover {
  background: #f5f5f5;
}
.vc-item-read {
  opacity: 0.7;
}

/* Avatar */
.vc-item-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

/* Content */
.vc-item-content {
  flex: 1;
  min-width: 0;
}
.vc-item-text {
  font-size: 13px;
  line-height: 1.45;
  margin: 0 0 2px;
  color: #000;
}
.vc-item-title {
  font-weight: 600;
}
.vc-item-msg {
  color: #666;
}
.vc-item-time {
  font-size: 11px;
  font-weight: 500;
  color: #0070f3;
  margin: 0;
}
.vc-item-read .vc-item-time {
  color: #888;
}

/* Right side */
.vc-item-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-top: 3px;
}
.vc-item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.vc-item-delete {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: #bbb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.12s;
}
.vc-item:hover .vc-item-delete {
  opacity: 1;
}
.vc-item-delete:hover {
  background: #f5f5f5;
  border-color: #eaeaea;
  color: #e00;
}

/* ── Footer ── */
.vc-footer {
  padding: 10px 16px;
  border-top: 1px solid #eaeaea;
  background: #fafafa;
  flex-shrink: 0;
  text-align: center;
}
.vc-footer-text {
  font-size: 11px;
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
`;
