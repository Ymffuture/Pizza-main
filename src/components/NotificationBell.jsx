// src/components/NotificationBell.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bell, X, CheckCheck, Info, AlertTriangle,
  Star, Zap, Megaphone, RefreshCw, BellOff,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

/* ═════════════════════════════════════════════════════════════════════════════
   THEME CONFIGURATION — Food Delivery / KotaBites Style
   ═════════════════════════════════════════════════════════════════════════════ */
const THEME = {
  // Primary palette — warm, appetizing orange
  primary:        "#E85D04",
  primaryHover:   "#D00000",
  primaryLight:   "#FFF3E0",
  primaryBorder:  "#FFCC80",

  // Secondary — fresh green
  secondary:      "#38B000",
  secondaryLight: "#E8F5E9",

  // Facebook-style neutrals
  bgPage:         "#F0F2F5",
  bgSurface:      "#FFFFFF",
  bgHover:        "#F2F2F2",
  bgActive:       "#E4E6EB",

  // Text
  textPrimary:    "#050505",
  textSecondary:  "#65676B",
  textTertiary:   "#8C939D",

  // Borders & dividers
  border:         "#CED0D4",
  borderLight:    "#E4E6EB",

  // Notification type colors
  info:           "#1877F2",  // Facebook blue
  infoLight:      "#E7F3FF",
  warning:        "#F5A623",
  warningLight:   "#FFF8E1",
  promo:          "#E85D04",  // Primary orange
  promoLight:     "#FFF3E0",
  update:         "#1877F2",
  updateLight:    "#E7F3FF",
  maintenance:    "#F5A623",
  maintenanceLight:"#FFF8E1",
  urgent:         "#FF1744",
  urgentLight:    "#FFEBEE",

  // Shadows (Facebook-style)
  shadowSm:       "0 1px 2px rgba(0,0,0,0.05)",
  shadowMd:       "0 4px 12px rgba(0,0,0,0.08)",
  shadowLg:       "0 12px 28px rgba(0,0,0,0.12)",

  // Radius
  radiusSm:       "6px",
  radiusMd:       "8px",
  radiusLg:       "12px",
  radiusXl:       "16px",
  radiusFull:     "9999px",
};

/* ═════════════════════════════════════════════════════════════════════════════
   NOTIFICATION TYPE CONFIGURATION
   ═════════════════════════════════════════════════════════════════════════════ */
const TYPE_CFG = {
  info:        { 
    Icon: Info,          
    color: THEME.info, 
    bg: THEME.infoLight,  
    border: "#B3D9FF",
    label: "Info"
  },
  warning:     { 
    Icon: AlertTriangle, 
    color: "#B35900", 
    bg: THEME.warningLight,  
    border: "#FFE082",
    label: "Warning"
  },
  promo:       { 
    Icon: Star,          
    color: THEME.primary, 
    bg: THEME.promoLight,  
    border: THEME.primaryBorder,
    label: "Promo"
  },
  update:      { 
    Icon: Zap,           
    color: THEME.info, 
    bg: THEME.updateLight,  
    border: "#B3D9FF",
    label: "Update"
  },
  maintenance: { 
    Icon: AlertTriangle, 
    color: "#B35900", 
    bg: THEME.maintenanceLight,  
    border: "#FFE082",
    label: "Maintenance"
  },
  urgent:      { 
    Icon: Megaphone,     
    color: THEME.urgent, 
    bg: THEME.urgentLight,    
    border: "#FFCDD2",
    label: "Urgent"
  },
};
const DEFAULT_CFG = TYPE_CFG.info;

/* ═════════════════════════════════════════════════════════════════════════════
   UTILITIES
   ═════════════════════════════════════════════════════════════════════════════ */
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function useBadgePulse() {
  const [pulse, setPulse] = useState(false);
  const trigger = useCallback(() => {
    setPulse(true);
    setTimeout(() => setPulse(false), 700);
  }, []);
  return [pulse, trigger];
}

/* ═════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═════════════════════════════════════════════════════════════════════════════ */
export default function NotificationBell() {
  const { isAuth } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]     = useState(false);
  const [loading, setLoad]  = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [badgePulse, triggerPulse] = useBadgePulse();
  const [announcement, setAnnouncement] = useState("");

  const sheetRef = useRef(null);
  const btnRef   = useRef(null);
  const sseRef   = useRef(null);
  const intervalRef = useRef(null);

  const unread = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  /* ── Load notifications ───────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!isAuth) return;
    setLoad(true);
    try {
      const { data } = await axiosClient.get("/notifications/my");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[NotificationBell] Failed to load notifications:", err.message);
    } finally {
      setLoad(false);
    }
  }, [isAuth]);

  /* ── Prepend SSE notification ─────────────────────────────────────────── */
  const prependNotification = useCallback((notif) => {
    setNotifications(prev => {
      if (prev.some(n => n.id === notif.id)) return prev;
      triggerPulse();
      setAnnouncement(`New notification: ${notif.title}`);
      setTimeout(() => setAnnouncement(""), 3000);
      return [notif, ...prev];
    });
  }, [triggerPulse]);

  /* ── SSE Connection ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuth) return;

    const base = (axiosClient.defaults.baseURL ?? "").replace(/\/$/, "");
    const token = localStorage.getItem("access_token") ?? "";
    const url   = `${base}/notifications/stream?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url, { withCredentials: true });
    sseRef.current = es;

    es.addEventListener("connected", () => {
      console.debug("[SSE] Notification stream connected");
    });

    es.addEventListener("notification", (e) => {
      try {
        const notif = JSON.parse(e.data);
        prependNotification(notif);
      } catch {
        console.debug("[SSE] Malformed notification frame");
      }
    });

    es.onerror = () => {
      console.debug("[SSE] Notification stream error — browser will retry");
    };

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [isAuth, prependNotification]);

  /* ── Initial load + 60s poll ──────────────────────────────────────────── */
  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  /* ── Manual refresh event ─────────────────────────────────────────────── */
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("notification:new", handler);
    return () => window.removeEventListener("notification:new", handler);
  }, [load]);

  /* ── Close on outside click ───────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (!sheetRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  /* ── Close on Escape ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  /* ── Lock body scroll ─────────────────────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* ── Actions ──────────────────────────────────────────────────────────── */
  const markRead = async (id) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.warn("[NotificationBell] Failed to mark read:", err.message);
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      // Try batch endpoint first, fallback to individual calls
      await axiosClient.patch("/notifications/read-all", { ids: unreadIds });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // Fallback: individual calls
      try {
        await Promise.allSettled(unreadIds.map(id => axiosClient.patch(`/notifications/${id}/read`)));
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (err) {
        console.warn("[NotificationBell] Failed to mark all read:", err.message);
      }
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axiosClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.warn("[NotificationBell] Failed to delete notification:", err.message);
      // Fallback: mark as read and hide from UI
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  /* ── Filtered list (memoized) ─────────────────────────────────────────── */
  const filteredNotifications = useMemo(() => {
    return activeTab === "unread"
      ? notifications.filter(n => !n.is_read)
      : notifications;
  }, [notifications, activeTab]);

  if (!isAuth) return null;

  return (
    <>
      <style>{css}</style>

      {/* Screen reader announcement region */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="fb-sr-only"
      >
        {announcement}
      </div>

      <div className="fb-root">

        {/* ═══ Bell Button ═══ */}
        <button
          ref={btnRef}
          className={[
            "fb-btn",
            open         ? "fb-btn-open"   : "",
            unread > 0   ? "fb-btn-unread" : "",
          ].join(" ")}
          onClick={() => setOpen(o => !o)}
          aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <div className="fb-btn-inner">
            <Bell 
              style={{ width: 20, height: 20 }} 
              className={unread > 0 ? "fb-bell-shake" : ""} 
            />
          </div>
          {unread > 0 && (
            <span className={`fb-badge${badgePulse ? " fb-badge-pulse" : ""}`}>
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {/* ═══ Overlay ═══ */}
        {open && (
          <div
            className="fb-overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ═══ Notification Panel (Facebook-style card) ═══ */}
        {open && (
          <div 
            ref={sheetRef} 
            className="fb-panel" 
            role="dialog" 
            aria-label="Notifications"
            aria-modal="true"
          >
            {/* Header */}
            <div className="fb-header">
              <div className="fb-header-main">
                <h2 className="fb-title">Notifications</h2>
                <div className="fb-header-actions">
                  {unread > 0 && (
                    <button 
                      className="fb-hbtn fb-mark-all" 
                      onClick={markAllRead} 
                      title="Mark all as read"
                    >
                      <CheckCheck style={{ width: 16, height: 16 }} />
                      <span>Mark all as read</span>
                    </button>
                  )}
                  <button
                    className={`fb-hbtn fb-refresh${loading ? " fb-spin" : ""}`}
                    onClick={load}
                    title="Refresh"
                  >
                    <RefreshCw style={{ width: 16, height: 16 }} />
                  </button>
                  <button 
                    className="fb-hbtn fb-close" 
                    onClick={() => setOpen(false)} 
                    title="Close"
                  >
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
                  {unread > 0 && (
                    <span className="fb-tab-badge">{unread > 99 ? "99+" : unread}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="fb-body">
              {loading && filteredNotifications.length === 0 ? (
                <div className="fb-skeleton-wrapper">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="fb-skeleton-item">
                      <div className="fb-skeleton-avatar" />
                      <div className="fb-skeleton-content">
                        <div className="fb-skeleton-line fb-skeleton-short" />
                        <div className="fb-skeleton-line" />
                        <div className="fb-skeleton-line fb-skeleton-xshort" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="fb-empty">
                  <div className="fb-empty-icon-wrapper">
                    <div className="fb-empty-icon">
                      <BellOff style={{ width: 24, height: 24, color: "#BEC3C9" }} />
                    </div>
                  </div>
                  <p className="fb-empty-title">
                    {activeTab === "unread" ? "No unread notifications" : "All caught up"}
                  </p>
                  <p className="fb-empty-sub">
                    {activeTab === "unread"
                      ? "Switch to All to see older notifications"
                      : "Check back later for new updates"}
                  </p>
                </div>
              ) : (
                <div className="fb-list">
                  {filteredNotifications.map(n => {
                    const cfg   = TYPE_CFG[n.type] ?? DEFAULT_CFG;
                    const NIcon = cfg.Icon;
                    return (
                      <div
                        key={n.id}
                        className={[
                          "fb-item",
                          n.is_read ? "fb-item-read" : "fb-item-unread",
                        ].join(" ")}
                        onClick={() => !n.is_read && markRead(n.id)}
                        role={n.is_read ? undefined : "button"}
                        tabIndex={n.is_read ? undefined : 0}
                        onKeyDown={e => e.key === "Enter" && !n.is_read && markRead(n.id)}
                      >
                        {/* Avatar / Icon */}
                        <div
                          className="fb-item-avatar"
                          style={{ background: cfg.bg }}
                        >
                          <div 
                            className="fb-item-avatar-inner"
                            style={{ background: cfg.color }}
                          >
                            <NIcon style={{ width: 14, height: 14, color: "#fff" }} />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="fb-item-content">
                          <p className="fb-item-text">
                            <span className="fb-item-title">{n.title}</span>
                            <span className="fb-item-msg">{n.message}</span>
                          </p>
                          <div className="fb-item-meta">
                            <span 
                              className="fb-item-type"
                              style={{ color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                            <span className="fb-item-dot-sep">·</span>
                            <span className="fb-item-time">{timeAgo(n.created_at)}</span>
                          </div>
                        </div>

                        {/* Right side actions */}
                        <div className="fb-item-right">
                          {!n.is_read && (
                            <div className="fb-item-unread-dot" style={{ background: cfg.color }} />
                          )}
                          <button
                            className="fb-item-delete"
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                            title="Remove notification"
                            aria-label="Remove notification"
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
              <div className="fb-footer">
                <span className="fb-footer-text">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                  {activeTab === "all" && unread > 0 && (
                    <span> · {unread} unread</span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   STYLES — Facebook UI + Food Delivery Theme
   ═════════════════════════════════════════════════════════════════════════════ */
const css = `
/* ── Screen reader only ── */
.fb-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── Root ── */
.fb-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  z-index: 100;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BELL BUTTON
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${THEME.bgSurface};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${THEME.textSecondary};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}
.fb-btn:hover {
  background: ${THEME.bgHover};
  color: ${THEME.textPrimary};
}
.fb-btn:active {
  background: ${THEME.bgActive};
  transform: scale(0.96);
}
.fb-btn-open {
  background: ${THEME.bgActive} !important;
  color: ${THEME.textPrimary} !important;
}
.fb-btn-unread {
  color: ${THEME.primary};
}
.fb-btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Bell shake animation */
@keyframes fbBellShake {
  0%, 100% { transform: rotate(0deg); }
  8%  { transform: rotate(14deg); }
  16% { transform: rotate(-12deg); }
  24% { transform: rotate(10deg); }
  32% { transform: rotate(-8deg); }
  40% { transform: rotate(6deg); }
  48% { transform: rotate(-4deg); }
  56% { transform: rotate(2deg); }
  64% { transform: rotate(0deg); }
}
.fb-bell-shake {
  animation: fbBellShake 2.2s ease-in-out infinite;
  transform-origin: top center;
}

/* Badge */
.fb-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: ${THEME.primary};
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  border: 2px solid ${THEME.bgSurface};
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fbBadgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes fbBadgePop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}

/* Badge pulse on new notification */
@keyframes fbBadgePulse {
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(232, 93, 4, 0.5); }
  50%  { transform: scale(1.25); box-shadow: 0 0 0 8px rgba(232, 93, 4, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(232, 93, 4, 0); }
}
.fb-badge-pulse {
  animation: fbBadgePulse 0.7s ease forwards !important;
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERLAY
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(3px);
  z-index: 99;
  animation: fbFadeIn 0.2s ease;
}
@keyframes fbFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATION PANEL — Facebook-style Card
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-panel {
  position: fixed;
  top: 56px;
  right: 16px;
  width: 380px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 80px);
  background: ${THEME.bgSurface};
  border-radius: ${THEME.radiusXl};
  box-shadow: ${THEME.shadowLg}, 0 0 0 1px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  animation: fbPanelIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fbPanelIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Mobile: bottom sheet style */
@media (max-width: 480px) {
  .fb-panel {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    border-radius: ${THEME.radiusXl} ${THEME.radiusXl} 0 0;
    max-height: 85vh;
    animation: fbPanelUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes fbPanelUp {
    from { opacity: 0; transform: translateY(100%); }
    to   { opacity: 1; transform: translateY(0); }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-header {
  flex-shrink: 0;
  padding: 12px 16px 0;
  border-bottom: 1px solid ${THEME.borderLight};
}
.fb-header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.fb-title {
  font-size: 20px;
  font-weight: 700;
  color: ${THEME.textPrimary};
  margin: 0;
  letter-spacing: -0.02em;
}
.fb-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.fb-hbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: ${THEME.radiusMd};
  background: ${THEME.bgHover};
  border: none;
  color: ${THEME.textSecondary};
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
}
.fb-hbtn:hover {
  background: ${THEME.bgActive};
  color: ${THEME.textPrimary};
}
.fb-hbtn:active {
  transform: scale(0.95);
}
.fb-mark-all {
  padding: 8px 12px;
  white-space: nowrap;
}
.fb-close:hover {
  background: #FFEBEE;
  color: ${THEME.urgent};
}

@keyframes fbSpin { to { transform: rotate(360deg); } }
.fb-spin svg { animation: fbSpin 0.8s linear infinite; }

/* ═══════════════════════════════════════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 12px;
}
.fb-tab {
  padding: 6px 16px;
  border-radius: ${THEME.radiusFull};
  background: transparent;
  border: none;
  color: ${THEME.textSecondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  font-family: inherit;
}
.fb-tab:hover {
  background: ${THEME.bgHover};
  color: ${THEME.textPrimary};
}
.fb-tab-active {
  background: ${THEME.primaryLight} !important;
  color: ${THEME.primary} !important;
  font-weight: 600;
}
.fb-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: ${THEME.primary};
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 9px;
  margin-left: 6px;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BODY / SCROLL AREA
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: ${THEME.border} transparent;
}
.fb-body::-webkit-scrollbar {
  width: 6px;
}
.fb-body::-webkit-scrollbar-track {
  background: transparent;
}
.fb-body::-webkit-scrollbar-thumb {
  background: ${THEME.border};
  border-radius: 3px;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETON LOADING
   ═══════════════════════════════════════════════════════════════════════════ */
@keyframes fbSkeleton {
  0%   { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.fb-skeleton-wrapper {
  padding: 8px 0;
}
.fb-skeleton-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
}
.fb-skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, ${THEME.bgHover} 25%, ${THEME.borderLight} 50%, ${THEME.bgHover} 75%);
  background-size: 200px 100%;
  animation: fbSkeleton 1.5s ease-in-out infinite;
  flex-shrink: 0;
}
.fb-skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}
.fb-skeleton-line {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(90deg, ${THEME.bgHover} 25%, ${THEME.borderLight} 50%, ${THEME.bgHover} 75%);
  background-size: 200px 100%;
  animation: fbSkeleton 1.5s ease-in-out infinite;
}
.fb-skeleton-short { width: 60%; }
.fb-skeleton-xshort { width: 35%; }

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 24px;
  text-align: center;
}
.fb-empty-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${THEME.bgPage};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.fb-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.fb-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: ${THEME.textPrimary};
  margin: 0;
}
.fb-empty-sub {
  font-size: 14px;
  color: ${THEME.textSecondary};
  margin: 0;
  max-width: 240px;
  line-height: 1.4;
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATION LIST
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-list {
  padding: 4px 0;
}
.fb-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  transition: background 0.15s ease;
  position: relative;
  cursor: pointer;
  border-radius: 0;
}
.fb-item:hover {
  background: ${THEME.bgHover};
}
.fb-item:active {
  background: ${THEME.bgActive};
}
.fb-item-unread {
  background: ${THEME.primaryLight};
}
.fb-item-unread:hover {
  background: #FFE8CC;
}
.fb-item-read {
  opacity: 0.85;
}
.fb-item-read:hover {
  opacity: 1;
}

/* Avatar */
.fb-item-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
.fb-item-avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Content */
.fb-item-content {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}
.fb-item-text {
  font-size: 14px;
  line-height: 1.45;
  margin: 0 0 4px;
  color: ${THEME.textPrimary};
}
.fb-item-title {
  font-weight: 600;
}
.fb-item-msg {
  color: ${THEME.textSecondary};
}
.fb-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.fb-item-type {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.fb-item-dot-sep {
  color: ${THEME.textTertiary};
  font-weight: 700;
}
.fb-item-time {
  color: ${THEME.textTertiary};
  font-weight: 500;
}
.fb-item-unread .fb-item-time {
  color: ${THEME.primary};
  font-weight: 600;
}

/* Right side */
.fb-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-top: 4px;
}
.fb-item-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fb-item-delete {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: ${THEME.textTertiary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s ease;
}
.fb-item:hover .fb-item-delete {
  opacity: 1;
}
.fb-item-delete:hover {
  background: #FFEBEE;
  color: ${THEME.urgent};
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
.fb-footer {
  padding: 10px 16px;
  border-top: 1px solid ${THEME.borderLight};
  background: ${THEME.bgPage};
  flex-shrink: 0;
  text-align: center;
}
.fb-footer-text {
  font-size: 12px;
  font-weight: 500;
  color: ${THEME.textSecondary};
}
`;
