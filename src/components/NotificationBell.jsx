// src/components/NotificationBell.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, X, CheckCheck, Info, AlertTriangle,
  Star, Zap, Megaphone, RefreshCw, BellOff,
  ChevronUp, Trash2
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const TYPE_CFG = {
  info:        { Icon: Info,          color: "#1877F2", bg: "rgba(24,119,242,0.1)",  border: "rgba(24,119,242,0.2)"  },
  warning:     { Icon: AlertTriangle, color: "#F5A623", bg: "rgba(245,166,35,0.1)",  border: "rgba(245,166,35,0.2)"  },
  promo:       { Icon: Star,          color: "#E4A11B", bg: "rgba(228,161,27,0.1)",  border: "rgba(228,161,27,0.2)"  },
  update:      { Icon: Zap,           color: "#7C3AED", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.2)"  },
  maintenance: { Icon: AlertTriangle, color: "#F97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.2)"  },
  urgent:      { Icon: Megaphone,     color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)"   },
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
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"
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

  // Close on outside click (only when clicking outside both sheet and button)
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (!sheetRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
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

  // Prevent body scroll when sheet is open
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
      <div className="fb-root">

        {/* Bell button - Facebook Messenger style */}
        <button
          ref={btnRef}
          className={`fb-btn${open ? " fb-btn-open" : ""}${unread > 0 ? " fb-btn-has-unread" : ""}`}
          onClick={() => { setOpen(o => !o); }}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          <div className="fb-btn-inner">
            {unread > 0
              ? <Bell style={{ width: 20, height: 20 }} className="fb-bell-shake" />
              : <Bell style={{ width: 20, height: 20 }} />
            }
          </div>
          {unread > 0 && (
            <span className="fb-badge">{unread > 99 ? "99+" : unread}</span>
          )}
        </button>

        {/* Overlay */}
        {open && (
          <div 
            className="fb-overlay" 
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Bottom Sheet Panel - Facebook style */}
        {open && (
          <div ref={sheetRef} className="fb-sheet" role="dialog" aria-label="Notifications">

            {/* Drag handle */}
            <div className="fb-sheet-handle-bar" onClick={() => setOpen(false)}>
              <div className="fb-sheet-handle" />
            </div>

            {/* Header */}
            <div className="fb-sheet-header">
              <div className="fb-sheet-header-top">
                <h2 className="fb-sheet-title">Notifications</h2>
                <div className="fb-sheet-actions">
                  {unread > 0 && (
                    <button className="fb-action-btn fb-mark-all" onClick={markAllRead} title="Mark all as read">
                      <CheckCheck style={{ width: 16, height: 16 }} />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button 
                    className={`fb-action-btn fb-refresh${loading ? " fb-spin" : ""}`} 
                    onClick={load} 
                    title="Refresh"
                  >
                    <RefreshCw style={{ width: 16, height: 16 }} />
                  </button>
                  <button className="fb-action-btn fb-close" onClick={() => setOpen(false)} title="Close">
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="fb-tabs">
                <button 
                  className={`fb-tab${activeTab === "all" ? " fb-tab-active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
                <button 
                  className={`fb-tab${activeTab === "unread" ? " fb-tab-active" : ""}`}
                  onClick={() => setActiveTab("unread")}
                >
                  Unread
                  {unread > 0 && <span className="fb-tab-badge">{unread}</span>}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="fb-sheet-body">
              {loading && filteredNotifications.length === 0 ? (
                <div className="fb-empty">
                  <div className="fb-skeleton-list">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="fb-skeleton-item">
                        <div className="fb-skeleton-avatar" />
                        <div className="fb-skeleton-lines">
                          <div className="fb-skeleton-line fb-skeleton-line-short" />
                          <div className="fb-skeleton-line" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="fb-empty">
                  <div className="fb-empty-icon">
                    <BellOff style={{ width: 32, height: 32, color: "#B0B3B8" }} />
                  </div>
                  <p className="fb-empty-title">
                    {activeTab === "unread" ? "No unread notifications" : "You're all caught up"}
                  </p>
                  <p className="fb-empty-sub">
                    {activeTab === "unread" 
                      ? "Check the All tab to see older notifications" 
                      : "When you get notifications, they'll show up here"}
                  </p>
                </div>
              ) : (
                <div className="fb-notif-list">
                  {filteredNotifications.map(n => {
                    const cfg   = TYPE_CFG[n.type] ?? DEFAULT_CFG;
                    const NIcon = cfg.Icon;
                    return (
                      <div
                        key={n.id}
                        className={`fb-notif${n.is_read ? " fb-notif-read" : " fb-notif-unread"}`}
                        onClick={() => !n.is_read && markRead(n.id)}
                        role={n.is_read ? undefined : "button"}
                        tabIndex={n.is_read ? undefined : 0}
                        onKeyDown={e => e.key === "Enter" && !n.is_read && markRead(n.id)}
                      >
                        {/* Avatar / Icon */}
                        <div 
                          className="fb-notif-avatar"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                        >
                          <NIcon style={{ width: 18, height: 18, color: cfg.color }} />
                        </div>

                        {/* Content */}
                        <div className="fb-notif-content">
                          <p className="fb-notif-text">
                            <span className="fb-notif-title">{n.title}</span>{" "}
                            <span className="fb-notif-msg">{n.message}</span>
                          </p>
                          <p className="fb-notif-time">{timeAgo(n.created_at)}</p>
                        </div>

                        {/* Right side: unread dot + delete */}
                        <div className="fb-notif-right">
                          {!n.is_read && (
                            <div className="fb-notif-dot" style={{ background: cfg.color }} />
                          )}
                          <button 
                            className="fb-notif-delete"
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                            title="Remove"
                          >
                            <X style={{ width: 14, height: 14 }} />
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
              <div className="fb-sheet-footer">
                <span className="fb-footer-text">
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
.fb-root {
  position: relative;
  z-index: 9999;
  top:20px;
}

/* ── Bell button (Facebook Messenger style) ── */
.fb-btn {
  position: relative;
  width: 40px; 
  height: 40px;
  border-radius: 50%;
  background: #E4E6EB;
  border: none;
  display: flex; 
  align-items: center; 
  justify-content: center;
  color: #050505;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.fb-btn:hover {
  background: #D8DADF;
}
.fb-btn-open {
  background: #E7F3FF !important;
  color: #1877F2 !important;
}
.fb-btn-has-unread {
  background: #E7F3FF;
  color: #1877F2;
}
.fb-btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Bell shake animation */
@keyframes fbBellShake {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(12deg); }
  20% { transform: rotate(-10deg); }
  30% { transform: rotate(8deg); }
  40% { transform: rotate(-6deg); }
  50% { transform: rotate(0deg); }
}
.fb-bell-shake {
  animation: fbBellShake 2s ease infinite;
  transform-origin: top center;
}

/* Badge (Facebook red dot style) */
.fb-badge {
  position: absolute;
  top: -2px; 
  right: -2px;
  min-width: 18px; 
  height: 18px;
  padding: 0 5px;
  background: #F02849;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 11px; 
  font-weight: 600;
  border-radius: 10px;
  border: 2px solid #ffffff;
  display: flex; 
  align-items: center; 
  justify-content: center;
  animation: fbBadgePop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes fbBadgePop { 
  from { transform: scale(0); } 
  to { transform: scale(1); } 
}

/* ── Overlay ── */
.fb-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  animation: fbFadeIn 0.2s ease;
}
@keyframes fbFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── Bottom Sheet (Facebook style) ── */
.fb-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 500px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: flex; 
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  animation: fbSheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 85vh;
}
@keyframes fbSheetUp {
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
.fb-sheet-handle-bar {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
  cursor: pointer;
}
.fb-sheet-handle {
  width: 36px;
  height: 4px;
  background: #CED0D4;
  border-radius: 2px;
}

/* ── Header ── */
.fb-sheet-header {
  flex-shrink: 0;
  padding: 4px 16px 0;
  border-bottom: 1px solid #E4E6EB;
}
.fb-sheet-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.fb-sheet-title {
  font-size: 20px;
  font-weight: 700;
  color: #050505;
  margin: 0;
  letter-spacing: -0.3px;
}
.fb-sheet-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.fb-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-radius: 50%;
  background: #F0F2F5;
  border: none;
  color: #050505;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 13px;
  font-weight: 600;
}
.fb-action-btn:hover {
  background: #E4E6EB;
}
.fb-mark-all {
  border-radius: 6px;
  padding: 8px 12px;
  white-space: nowrap;
}
.fb-close:hover {
  background: #F02849;
  color: white;
}

@keyframes fbSpin { 
  to { transform: rotate(360deg); } 
}
.fb-spin svg { 
  animation: fbSpin 0.8s linear infinite; 
}

/* ── Tabs ── */
.fb-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 8px;
}
.fb-tab {
  padding: 6px 16px;
  border-radius: 18px;
  background: transparent;
  border: none;
  color: #65676B;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.fb-tab:hover {
  background: #F0F2F5;
}
.fb-tab-active {
  background: #E7F3FF !important;
  color: #1877F2 !important;
}
.fb-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #F02849;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  margin-left: 6px;
}

/* ── Body ── */
.fb-sheet-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #BCC0C4 transparent;
}
.fb-sheet-body::-webkit-scrollbar { 
  width: 6px; 
}
.fb-sheet-body::-webkit-scrollbar-thumb { 
  background: #BCC0C4; 
  border-radius: 3px; 
}

/* Skeleton loading */
@keyframes fbSkeleton {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.fb-skeleton-list {
  padding: 12px 16px;
}
.fb-skeleton-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.fb-skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 50%, #F0F2F5 75%);
  background-size: 200px 100%;
  animation: fbSkeleton 1.5s ease-in-out infinite;
  flex-shrink: 0;
}
.fb-skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fb-skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 50%, #F0F2F5 75%);
  background-size: 200px 100%;
  animation: fbSkeleton 1.5s ease-in-out infinite;
}
.fb-skeleton-line-short {
  width: 60%;
}

/* Empty state */
.fb-empty {
  display: flex; 
  flex-direction: column;
  align-items: center; 
  justify-content: center;
  gap: 8px; 
  padding: 60px 24px;
  text-align: center;
}
.fb-empty-icon {
  width: 64px; 
  height: 64px;
  border-radius: 50%;
  background: #F0F2F5;
  display: flex; 
  align-items: center; 
  justify-content: center;
  margin-bottom: 4px;
}
.fb-empty-title {
  font-size: 16px; 
  font-weight: 600;
  color: #050505; 
  margin: 0;
}
.fb-empty-sub {
  font-size: 14px; 
  color: #65676B;
  margin: 0;
  max-width: 280px;
  line-height: 1.4;
}

/* ── Notification list ── */
.fb-notif-list {
  padding: 4px 0;
}
.fb-notif {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  transition: background 0.15s;
  position: relative;
  cursor: pointer;
}
.fb-notif:hover {
  background: #F0F2F5;
}
.fb-notif-unread {
  background: #E7F3FF;
}
.fb-notif-unread:hover {
  background: #DBE7F3;
}
.fb-notif-read {
  opacity: 0.85;
}

/* Avatar */
.fb-notif-avatar {
  width: 40px; 
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex; 
  align-items: center; 
  justify-content: center;
  margin-top: 2px;
}

/* Content */
.fb-notif-content {
  flex: 1; 
  min-width: 0;
}
.fb-notif-text {
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 2px;
  color: #050505;
}
.fb-notif-title {
  font-weight: 600;
}
.fb-notif-msg {
  color: #65676B;
}
.fb-notif-time {
  font-size: 12px; 
  font-weight: 500;
  color: #1877F2;
  margin: 0;
}
.fb-notif-read .fb-notif-time {
  color: #65676B;
}

/* Right side */
.fb-notif-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-top: 4px;
}
.fb-notif-dot {
  width: 8px; 
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fb-notif-delete {
  width: 28px; 
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #B0B3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
}
.fb-notif:hover .fb-notif-delete {
  opacity: 1;
}
.fb-notif-delete:hover {
  background: #F0F2F5;
  color: #F02849;
}

/* ── Footer ── */
.fb-sheet-footer {
  padding: 10px 16px;
  border-top: 1px solid #E4E6EB;
  background: #F0F2F5;
  flex-shrink: 0;
  text-align: center;
}
.fb-footer-text {
  font-size: 12px; 
  font-weight: 500;
  color: #65676B;
}

/* ── Responsive ── */
@media (min-width: 501px) {
  .fb-sheet {
    border-radius: 16px;
    bottom: auto;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    max-height: 600px;
    width: 420px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    animation: fbModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .fb-sheet-handle-bar {
    display: none;
  }
  @keyframes fbModalIn {
    from { opacity: 0; transform: translate(-50%, -45%) scale(0.96); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
}
`;
