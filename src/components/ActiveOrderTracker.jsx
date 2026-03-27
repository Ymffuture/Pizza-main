// src/components/ActiveOrderTracker.jsx
// Floating banner on the Menu page showing live driver delivery progress.
// Polls every 8s. Now includes ZegoCloud voice + video call buttons.
// Room ID = order ID — driver and customer join the same session automatically.

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/orders.api";
import { getAssignmentByOrder } from "../api/delivery.api";
import {
  Bike, Package, Navigation, CheckCheck,
  ChevronRight, X, Phone, Video, PhoneCall,
} from "lucide-react";
import VideoCall from "./VideoCall";

// ── Delivery sub-steps ─────────────────────────────────────────────────────
const STEPS = [
  { key: "accepted",   label: "Assigned",   Icon: Bike        },
  { key: "picked_up",  label: "Picked Up",  Icon: Package     },
  { key: "in_transit", label: "On the Way", Icon: Navigation  },
  { key: "delivered",  label: "Delivered",  Icon: CheckCheck  },
];

const STEP_COLOR = {
  accepted:   "#FFC72C",
  picked_up:  "#60a5fa",
  in_transit: "#fb923c",
  delivered:  "#4ade80",
};

// Active order statuses that CAN have a driver
const TRACKABLE = new Set(["paid", "preparing", "ready", "delivered"]);

export default function ActiveOrderTracker() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();

  const [info,      setInfo]      = useState(null); // { orderId, assignment }
  const [dismissed, setDismissed] = useState(false);
  const [callMode,  setCallMode]  = useState(null); // null | "voice" | "video"
  const intervalRef = useRef(null);

  const poll = useCallback(async () => {
    if (!isAuth) return;
    try {
      const res    = await getMyOrders();
      const orders = Array.isArray(res.data) ? res.data : [];

      const active = orders
        .filter(o => TRACKABLE.has(o.status))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (!active) { setInfo(null); return; }

      try {
        const aRes       = await getAssignmentByOrder(active.id);
        const assignment = aRes.data;
        if (!assignment?.has_driver) { setInfo(null); return; }
        setInfo({ orderId: active.id, assignment });
        if (assignment.status === "delivered") clearInterval(intervalRef.current);
      } catch { setInfo(null); }
    } catch { /* silent */ }
  }, [isAuth]);

  useEffect(() => {
    if (!isAuth) { setInfo(null); return; }
    poll();
    intervalRef.current = setInterval(poll, 8000);
    return () => clearInterval(intervalRef.current);
  }, [isAuth, poll]);

  // Re-show after dismiss when a NEW order appears
  useEffect(() => {
    if (info) setDismissed(false);
  }, [info?.orderId]);

  if (!info || dismissed) return null;

  const { orderId, assignment } = info;
  const stepIdx   = STEPS.findIndex(s => s.key === assignment.status);
  const curStep   = STEPS[Math.max(0, stepIdx)];
  const accentCol = STEP_COLOR[assignment.status] || "#FFC72C";
  const isDone    = assignment.status === "delivered";
  const isMoving  = assignment.status === "in_transit";

  const hasPhone  = !!assignment.driver_phone;

  return (
    <>
      <style>{css}</style>

      {/* ── ZegoCloud Call Modal ── */}
      {callMode && (
        <VideoCall
          orderId={orderId}
          driverName={assignment.driver_name}
          driverPhone={assignment.driver_phone}
          customerName={user?.full_name}
          userId={user?.email}
          mode={callMode}
          onClose={() => setCallMode(null)}
        />
      )}

      <div className="aot-banner" style={{ "--accent": accentCol }}>
        {/* Glow strip at top */}
        <div className="aot-glow-strip" style={{ background: accentCol }} />

        {/* ── Header row ── */}
        <div className="aot-header">
          <div className="aot-header-left">
            <div className="aot-icon-wrap" style={{ background: `${accentCol}20`, border: `1px solid ${accentCol}40` }}>
              <curStep.Icon style={{ width: 14, height: 14, color: accentCol }} />
            </div>
            <div>
              <p className="aot-title">
                {isDone    ? "Order Delivered 🎉"
                : isMoving ? "Driver on the way!"
                : `Driver ${curStep.label}`}
              </p>
              <p className="aot-sub">
                {assignment.driver_name && `${assignment.driver_name} · `}
                #{String(orderId).slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="aot-header-actions">

            {/* Regular phone call */}
            {hasPhone && !isDone && (
              <a
                href={`tel:${assignment.driver_phone}`}
                className="aot-action-btn aot-btn-phone"
                title={`Call ${assignment.driver_phone}`}
                onClick={e => e.stopPropagation()}
              >
                <Phone style={{ width: 13, height: 13 }} />
              </a>
            )}

            {/* ZegoCloud voice call */}
            {!isDone && (
              <button
                className="aot-action-btn aot-btn-voice"
                title="Voice call with driver"
                onClick={e => { e.stopPropagation(); setCallMode("voice"); }}
              >
                <PhoneCall style={{ width: 13, height: 13 }} />
              </button>
            )}

            {/* ZegoCloud video call */}
            {!isDone && (
              <button
                className="aot-action-btn aot-btn-video"
                title="Video call with driver"
                onClick={e => { e.stopPropagation(); setCallMode("video"); }}
              >
                <Video style={{ width: 13, height: 13 }} />
              </button>
            )}

            {/* Dismiss */}
            <button
              className="aot-dismiss"
              onClick={e => { e.stopPropagation(); setDismissed(true); }}
              title="Dismiss"
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>

        {/* ── Call ID strip (shows driver's Zego room info) ── */}
        {!isDone && (
          <div className="aot-call-id-strip">
            <span className="aot-call-id-label">Call Room:</span>
            <code className="aot-call-id-code">
              kotabites-order-{String(orderId).slice(-8)}
            </code>
            <span className="aot-call-id-hint">· tap 📹 or 🎙️ to connect</span>
          </div>
        )}

        {/* ── Progress steps row ── */}
        <div className="aot-steps" onClick={() => navigate(`/order/${orderId}`)}>
          {STEPS.map((step, i) => {
            const done   = i <= stepIdx;
            const active = i === stepIdx && !isDone;
            const SIcon  = step.Icon;
            const col    = done ? STEP_COLOR[step.key] : "rgba(255,248,231,0.15)";
            return (
              <div key={step.key} className="aot-step">
                {i > 0 && (
                  <div
                    className="aot-connector"
                    style={{ background: i <= stepIdx ? STEP_COLOR[STEPS[i - 1].key] : "rgba(255,248,231,0.1)" }}
                  />
                )}
                <div
                  className={`aot-dot${active ? " aot-dot-pulse" : ""}`}
                  style={{
                    background:   done ? col : "rgba(255,248,231,0.05)",
                    border:       `1.5px solid ${done ? col : "rgba(255,248,231,0.15)"}`,
                    boxShadow:    done ? `0 0 8px ${col}60` : "none",
                  }}
                >
                  <SIcon style={{ width: 11, height: 11, color: done ? "#0e0700" : "rgba(255,248,231,0.25)" }} />
                </div>
                <span
                  className="aot-step-label"
                  style={{ color: done ? "#fff8e7" : "rgba(255,248,231,0.3)", fontWeight: done ? 700 : 500 }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}

          {/* Tap hint */}
          <div className="aot-tap-hint">
            <span>Tap to track</span>
            <ChevronRight style={{ width: 12, height: 12 }} />
          </div>
        </div>
      </div>
    </>
  );
}

const css = `
  .aot-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9000;
    background: rgba(14, 7, 0, 0.97);
    border-bottom: 1px solid rgba(var(--accent, 255,199,44), 0.3);
    backdrop-filter: blur(20px) saturate(1.6);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    animation: aotSlideDown 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
    cursor: default;
  }
  @keyframes aotSlideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }

  .aot-glow-strip { height: 2px; width: 100%; opacity: 0.8; }

  /* ── Header ── */
  .aot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px 4px;
    gap: 10px;
  }
  .aot-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }
  .aot-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .aot-title {
    font-size: 13px;
    font-weight: 800;
    color: #fff8e7;
    line-height: 1;
  }
  .aot-sub {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255, 248, 231, 0.42);
    margin-top: 2px;
  }
  .aot-header-actions {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }

  /* ── Action buttons (phone / voice / video / dismiss) ── */
  .aot-action-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.18s;
  }
  .aot-btn-phone {
    background: rgba(74, 222, 128, 0.1);
    border-color: rgba(74, 222, 128, 0.3);
    color: #4ade80;
  }
  .aot-btn-phone:hover { background: rgba(74, 222, 128, 0.22); }

  .aot-btn-voice {
    background: rgba(96, 165, 250, 0.1);
    border-color: rgba(96, 165, 250, 0.3);
    color: #60a5fa;
  }
  .aot-btn-voice:hover { background: rgba(96, 165, 250, 0.22); }

  .aot-btn-video {
    background: rgba(255, 199, 44, 0.1);
    border-color: rgba(255, 199, 44, 0.3);
    color: #FFC72C;
  }
  .aot-btn-video:hover { background: rgba(255, 199, 44, 0.2); }

  .aot-dismiss {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(255, 248, 231, 0.05);
    border: 1px solid rgba(255, 248, 231, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 248, 231, 0.35);
    cursor: pointer;
    transition: all 0.18s;
  }
  .aot-dismiss:hover {
    color: #fff8e7;
    background: rgba(218, 41, 28, 0.2);
    border-color: rgba(218, 41, 28, 0.3);
  }

  /* ── Call ID strip ── */
  .aot-call-id-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 16px 2px;
    font-size: 10px;
    font-weight: 600;
    color: rgba(255, 248, 231, 0.28);
    letter-spacing: 0.02em;
    border-bottom: 1px solid rgba(255, 248, 231, 0.04);
  }
  .aot-call-id-label {
    color: rgba(255, 248, 231, 0.35);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 9px;
  }
  .aot-call-id-code {
    background: rgba(255, 199, 44, 0.08);
    border: 1px solid rgba(255, 199, 44, 0.14);
    border-radius: 5px;
    padding: 1px 7px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: rgba(255, 199, 44, 0.7);
    letter-spacing: 0.03em;
  }
  .aot-call-id-hint {
    color: rgba(255, 248, 231, 0.2);
    font-size: 9px;
    font-style: italic;
  }

  /* ── Progress steps ── */
  .aot-steps {
    display: flex;
    align-items: center;
    padding: 10px 16px 12px;
    gap: 0;
    cursor: pointer;
    position: relative;
  }
  .aot-steps:hover .aot-tap-hint { opacity: 1; }

  .aot-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    flex: 1;
    position: relative;
    z-index: 1;
  }

  .aot-connector {
    position: absolute;
    top: 13px;
    right: 50%;
    left: -50%;
    height: 2px;
    border-radius: 1px;
    z-index: 0;
    transition: background 0.3s;
  }

  .aot-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.35s;
    position: relative;
    z-index: 1;
  }
  .aot-dot-pulse { animation: aotPulse 1.6s ease infinite; }
  @keyframes aotPulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.18); }
  }

  .aot-step-label {
    font-size: 9px;
    letter-spacing: 0.04em;
    white-space: nowrap;
    transition: color 0.3s;
  }

  .aot-tap-hint {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%) translateY(-2px);
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    font-weight: 700;
    color: rgba(255, 248, 231, 0.28);
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }

  @media (max-width: 600px) {
    .aot-step-label   { display: none; }
    .aot-steps        { padding: 8px 16px 10px; }
    .aot-dot          { width: 24px; height: 24px; }
    .aot-call-id-strip { display: none; }
  }
`;
