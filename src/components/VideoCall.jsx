// src/components/VideoCall.jsx
// ZegoCloud-powered voice/video call modal for KotaBites delivery tracking.
// Room ID = order ID → driver and customer always land in the same session.
// Install: npm install @zegocloud/zego-uikit-prebuilt
// Env:     VITE_ZEGO_APP_ID  +  VITE_ZEGO_SERVER_SECRET

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Video, Phone, Mic, MicOff, VideoOff,
  Signal, WifiOff, Loader2, AlertTriangle,
  PhoneOff, User, Minimize2, Maximize2,
} from "lucide-react";

/* ── Helper: build a deterministic user ID that's safe for Zego ── */
const makeUserId = (prefix, id) =>
  `${prefix}-${String(id).replace(/[^a-zA-Z0-9]/g, "").slice(-10)}`;

/* ── Connection status badge ── */
function StatusDot({ state }) {
  const cfg = {
    connecting: { col: "#FFC72C", label: "Connecting…", pulse: true },
    connected:  { col: "#4ade80", label: "Connected",   pulse: false },
    error:      { col: "#f87171", label: "Failed",       pulse: false },
    ended:      { col: "#94a3b8", label: "Call ended",   pulse: false },
  }[state] || { col: "#FFC72C", label: "Connecting…", pulse: true };

  return (
    <div className="vc-status-dot-wrap">
      <div
        className={`vc-status-dot${cfg.pulse ? " vc-dot-pulse" : ""}`}
        style={{ background: cfg.col }}
      />
      <span style={{ color: cfg.col }}>{cfg.label}</span>
    </div>
  );
}

/* ── Main VideoCall component ── */
export default function VideoCall({
  orderId,          // Required — used as Zego room ID
  driverName,       // Display name for the driver
  driverPhone,      // Shown as fallback if call fails
  customerName,     // Current user's display name
  userId,           // Current user's ID (from AuthContext)
  mode = "voice",   // "voice" | "video"
  onClose,
}) {
  const containerRef  = useRef(null);
  const zegoRef       = useRef(null);
  const [callState,   setCallState]   = useState("connecting"); // connecting | connected | error | ended
  const [minimised,   setMinimised]   = useState(false);
  const [errorMsg,    setErrorMsg]    = useState(null);
  const [elapsed,     setElapsed]     = useState(0);
  const timerRef = useRef(null);

  /* ── Timer ── */
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Destroy Zego on unmount ── */
  const destroyZego = useCallback(() => {
    try { zegoRef.current?.destroy(); } catch (_) {}
    zegoRef.current = null;
    stopTimer();
  }, [stopTimer]);

  /* ── Init Zego ── */
  useEffect(() => {
    if (!containerRef.current || !orderId) return;

    let cancelled = false;

    const initCall = async () => {
      try {
        const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID, 10);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        if (!appID || !serverSecret) {
          throw new Error("ZegoCloud credentials missing. Add VITE_ZEGO_APP_ID and VITE_ZEGO_SERVER_SECRET to .env");
        }

        // Dynamic import keeps initial bundle small
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        if (cancelled) return;

        const roomID   = `kotabites-order-${orderId}`;
        const zegoUID  = makeUserId("cust", userId || orderId);
        const userName = customerName || "Customer";

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, serverSecret, roomID, zegoUID, userName,
        );

        zegoRef.current = ZegoUIKitPrebuilt.create(kitToken);
        zegoRef.current.joinRoom({
          container: containerRef.current,
          scenario:  { mode: ZegoUIKitPrebuilt.OneONoneCall },

          // Initial device state
          turnOnCameraWhenJoining:    mode === "video",
          turnOnMicrophoneWhenJoining: true,
          showPreJoinView:             false,

          // UI config
          showAudioVideoSettingsButton: true,
          showScreenSharingButton:      false,
          showUserList:                 false,
          showLeavingView:              false,
          maxUsers:                     2,

          // Callbacks
          onJoinRoom: () => {
            if (cancelled) return;
            setCallState("connected");
            startTimer();
          },
          onLeaveRoom: () => {
            if (cancelled) return;
            setCallState("ended");
            stopTimer();
            setTimeout(() => onClose?.(), 1800);
          },
          onUserAvatarSetter: (users) => users.map(u => ({
            ...u, avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.userID}`,
          })),
        });
      } catch (err) {
        if (cancelled) return;
        console.error("[VideoCall] init failed:", err);
        setErrorMsg(err.message || "Could not start call");
        setCallState("error");
      }
    };

    initCall();
    return () => { cancelled = true; destroyZego(); };
  }, [orderId, userId, customerName, mode, onClose, startTimer, stopTimer, destroyZego]);

  /* ── Hang up ── */
  const hangUp = () => {
    destroyZego();
    setCallState("ended");
    setTimeout(() => onClose?.(), 600);
  };

  return (
    <>
      <style>{css}</style>

      {/* Backdrop */}
      <div className="vc-backdrop" onClick={minimised ? undefined : undefined} />

      {/* Window */}
      <div className={`vc-window${minimised ? " vc-minimised" : ""}`}>

        {/* ── Header ── */}
        <div className="vc-header">
          <div className="vc-header-left">
            {/* Avatar */}
            <div className={`vc-caller-avatar${callState === "connected" ? " vc-avatar-ring" : ""}`}>
              <img
                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=driver-${orderId}`}
                alt={driverName}
                className="vc-avatar-img"
              />
              {callState === "connected" && <div className="vc-avatar-live" />}
            </div>

            {/* Info */}
            <div className="vc-caller-info">
              <p className="vc-caller-name">{driverName || "Your Driver"}</p>
              <p className="vc-caller-sub">
                {mode === "video" ? "📹 Video call" : "🎙️ Voice call"} · #{String(orderId).slice(-6).toUpperCase()}
              </p>
              {callState === "connected" && (
                <span className="vc-timer">{formatTime(elapsed)}</span>
              )}
            </div>
          </div>

          <div className="vc-header-right">
            <StatusDot state={callState} />
            <button
              className="vc-icon-btn"
              onClick={() => setMinimised(m => !m)}
              title={minimised ? "Expand" : "Minimise"}
            >
              {minimised ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button className="vc-icon-btn vc-close-btn" onClick={hangUp} title="End call">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimised && (
          <>
            {/* ── Zego container ── */}
            <div
              className="vc-zego-container"
              ref={containerRef}
              style={{ display: callState === "error" || callState === "ended" ? "none" : "block" }}
            />

            {/* ── Connecting overlay ── */}
            {callState === "connecting" && (
              <div className="vc-overlay-state">
                <div className="vc-ring-wrap">
                  <div className="vc-pulse-ring" />
                  <div className="vc-pulse-ring vc-ring-2" />
                  <img
                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=driver-${orderId}`}
                    alt="driver"
                    className="vc-big-avatar"
                  />
                </div>
                <p className="vc-overlay-title">Calling {driverName || "your driver"}…</p>
                <p className="vc-overlay-sub">Please wait while we connect</p>
                <Loader2 className="w-6 h-6 vc-spin" style={{ color: "#FFC72C", marginTop: 8 }} />
              </div>
            )}

            {/* ── Error state ── */}
            {callState === "error" && (
              <div className="vc-overlay-state">
                <div className="vc-error-icon">
                  <WifiOff className="w-8 h-8" style={{ color: "#f87171" }} />
                </div>
                <p className="vc-overlay-title" style={{ color: "#f87171" }}>Call Failed</p>
                <p className="vc-overlay-sub">{errorMsg || "Could not connect. Try the phone instead."}</p>
                {driverPhone && (
                  <a href={`tel:${driverPhone}`} className="vc-fallback-call-btn">
                    <Phone className="w-4 h-4" />
                    Call {driverPhone}
                  </a>
                )}
                <button className="vc-end-btn" onClick={onClose} style={{ marginTop: 8 }}>
                  Close
                </button>
              </div>
            )}

            {/* ── Ended state ── */}
            {callState === "ended" && (
              <div className="vc-overlay-state">
                <div className="vc-ended-icon">
                  <PhoneOff className="w-8 h-8" style={{ color: "#94a3b8" }} />
                </div>
                <p className="vc-overlay-title">Call ended</p>
                <p className="vc-overlay-sub">
                  Duration: {formatTime(elapsed)}
                </p>
              </div>
            )}

            {/* ── Hang up button (shown when connected) ── */}
            {callState === "connected" && (
              <div className="vc-controls">
                <button className="vc-end-btn" onClick={hangUp}>
                  <PhoneOff className="w-4 h-4" />
                  End Call
                </button>
              </div>
            )}

            {/* ── Fallback phone link ── */}
            {driverPhone && callState !== "ended" && (
              <div className="vc-fallback-strip">
                <Signal className="w-3 h-3" />
                <span>Having issues?</span>
                <a href={`tel:${driverPhone}`} className="vc-fallback-link">
                  <Phone className="w-3 h-3" /> Call {driverPhone}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ── Driver-side helper: generates the matching room token ── */
/* Usage in DeliverDashboard.jsx — import this and pass driver's info */
export function getDriverCallToken(orderId, driverId, driverName) {
  return {
    roomID:   `kotabites-order-${orderId}`,
    userID:   makeUserId("driver", driverId),
    userName: driverName || "Driver",
  };
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  /* ── Backdrop ── */
  .vc-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9990;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(6px);
    animation: vcFadeIn 0.25s ease;
  }
  @keyframes vcFadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* ── Window ── */
  .vc-window {
    position: fixed;
    bottom: 32px;
    right: 28px;
    z-index: 9999;
    width: min(480px, calc(100vw - 32px));
    background: rgba(14, 7, 0, 0.97);
    border: 1px solid rgba(255, 199, 44, 0.18);
    border-radius: 22px;
    overflow: hidden;
    box-shadow:
      0 32px 80px rgba(0, 0, 0, 0.85),
      0 0 0 1px rgba(255, 199, 44, 0.06),
      inset 0 1px 0 rgba(255, 248, 231, 0.04);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    animation: vcSlideUp 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
    transition: all 0.3s ease;
  }
  .vc-minimised {
    width: min(340px, calc(100vw - 32px)) !important;
  }
  @keyframes vcSlideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to   { opacity: 1; transform: none; }
  }

  /* ── Header ── */
  .vc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: linear-gradient(135deg, rgba(218,41,28,0.14) 0%, rgba(255,199,44,0.05) 100%);
    border-bottom: 1px solid rgba(255, 199, 44, 0.1);
    gap: 10px;
  }
  .vc-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  /* ── Avatar ── */
  .vc-caller-avatar {
    position: relative;
    width: 46px;
    height: 46px;
    border-radius: 14px;
    flex-shrink: 0;
    background: rgba(255, 199, 44, 0.1);
    border: 1.5px solid rgba(255, 199, 44, 0.2);
    overflow: hidden;
  }
  .vc-avatar-ring {
    border-color: #4ade80;
    box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.18);
    animation: vcAvatarPulse 2s ease infinite;
  }
  @keyframes vcAvatarPulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.18); }
    50%       { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0.06); }
  }
  .vc-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .vc-avatar-live {
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    border: 1.5px solid #0e0700;
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.8);
    animation: vcLivePulse 1.4s ease infinite;
  }
  @keyframes vcLivePulse { 0%,100%{opacity:1} 50%{opacity:0.45} }

  /* ── Caller info ── */
  .vc-caller-info { flex: 1; min-width: 0; }
  .vc-caller-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 17px;
    letter-spacing: 1.5px;
    color: #fff8e7;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .vc-caller-sub {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255, 248, 231, 0.4);
    margin-top: 3px;
    letter-spacing: 0.04em;
  }
  .vc-timer {
    display: inline-block;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 15px;
    letter-spacing: 2px;
    color: #4ade80;
    margin-top: 4px;
  }

  /* ── Header right ── */
  .vc-header-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .vc-status-dot-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    margin-right: 4px;
  }
  .vc-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .vc-dot-pulse { animation: vcDotPulse 1.2s ease infinite; }
  @keyframes vcDotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.6)} }

  .vc-icon-btn {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid rgba(255, 248, 231, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 248, 231, 0.45);
    cursor: pointer;
    transition: all 0.18s;
  }
  .vc-icon-btn:hover { color: #fff8e7; border-color: rgba(255, 199, 44, 0.3); }
  .vc-close-btn:hover {
    background: rgba(218, 41, 28, 0.2);
    color: #DA291C;
    border-color: rgba(218, 41, 28, 0.35);
  }

  /* ── Zego iframe container ── */
  .vc-zego-container {
    width: 100%;
    min-height: 320px;
    max-height: 440px;
    position: relative;
    background: #0a0500;
  }
  /* Override Zego's own styles to match dark theme */
  .vc-zego-container iframe,
  .vc-zego-container > div {
    border-radius: 0 !important;
  }

  /* ── Overlay states (connecting / error / ended) ── */
  .vc-overlay-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 24px;
    min-height: 280px;
    background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(218,41,28,0.1) 0%, transparent 70%),
                #0a0500;
    text-align: center;
  }

  /* Pulse rings for connecting animation */
  .vc-ring-wrap {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .vc-pulse-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 199, 44, 0.25);
    animation: vcRingPulse 2s ease infinite;
  }
  .vc-ring-2 {
    inset: -14px;
    animation-delay: 0.7s;
    border-color: rgba(255, 199, 44, 0.12);
  }
  @keyframes vcRingPulse {
    0%   { opacity: 0; transform: scale(0.85); }
    40%  { opacity: 1; }
    100% { opacity: 0; transform: scale(1.15); }
  }
  .vc-big-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid rgba(255, 199, 44, 0.3);
    background: rgba(255, 199, 44, 0.08);
    position: relative;
    z-index: 1;
  }

  .vc-overlay-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: #fff8e7;
    margin: 0;
  }
  .vc-overlay-sub {
    font-size: 12px;
    color: rgba(255, 248, 231, 0.42);
    margin: 0;
    line-height: 1.5;
    max-width: 260px;
  }

  .vc-error-icon, .vc-ended-icon {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .vc-error-icon { background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.2); }
  .vc-ended-icon { background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.15); }

  /* ── Controls ── */
  .vc-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 16px 14px;
    background: rgba(0, 0, 0, 0.3);
  }
  .vc-end-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    background: #DA291C;
    color: white;
    border: none;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 13px;
    padding: 10px 24px;
    border-radius: 50px;
    box-shadow: 0 4px 18px rgba(218, 41, 28, 0.4);
    transition: all 0.2s;
  }
  .vc-end-btn:hover { background: #b91c1c; transform: scale(1.03); }

  /* ── Fallback strip ── */
  .vc-fallback-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 10px;
    font-weight: 700;
    color: rgba(255, 248, 231, 0.28);
    border-top: 1px solid rgba(255, 199, 44, 0.06);
    letter-spacing: 0.03em;
  }
  .vc-fallback-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: rgba(255, 199, 44, 0.6);
    text-decoration: none;
    font-weight: 800;
    transition: color 0.2s;
  }
  .vc-fallback-link:hover { color: #FFC72C; }

  .vc-fallback-call-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(74, 222, 128, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.3);
    color: #4ade80;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 13px;
    padding: 10px 20px;
    border-radius: 50px;
    text-decoration: none;
    transition: all 0.2s;
  }
  .vc-fallback-call-btn:hover { background: rgba(74, 222, 128, 0.2); }

  /* ── Spinner ── */
  @keyframes vcSpin { to { transform: rotate(360deg); } }
  .vc-spin { animation: vcSpin 0.8s linear infinite; }

  /* ── Responsive ── */
  @media (max-width: 540px) {
    .vc-window {
      bottom: 0;
      right: 0;
      left: 0;
      width: 100% !important;
      border-radius: 22px 22px 0 0;
    }
    .vc-backdrop { background: rgba(0,0,0,0.6); }
  }
`;
