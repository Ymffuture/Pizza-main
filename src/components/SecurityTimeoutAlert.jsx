import React from "react";
import { Timer, Shield, X, AlertCircle } from "lucide-react";

// ── Smart Security Timeout Alert ──
// Refined, authoritative, minimal. 30-second countdown with subtle motion.

export default function SecurityTimeoutAlert({
  secs,
  onStaySignedIn,
  onDismiss,
}) {
  const isUrgent = secs <= 10;
  const totalTime = 30;
  const progressPct = (secs / totalTime) * 100;

  return (
    <div className={`ba-root ${isUrgent ? "ba-urgent" : ""}`}>
      <style>{styles}</style>

      <div className="ba-bar">
        <div className="ba-icon-wrap">
          {isUrgent ? (
            <AlertCircle className="ba-icon ba-icon-alert" />
          ) : (
            <Timer className="ba-icon" />
          )}
        </div>

        <div className="ba-content">
          <p className="ba-title">
            {isUrgent ? "Session expiring now" : "Session timeout warning"}
          </p>
          <p className="ba-body">
            For your security, you will be signed out in{" "}
            <span className={`ba-countdown ${isUrgent ? "ba-countdown-urgent" : ""}`}>
              {secs}s
            </span>{" "}
            due to inactivity.
          </p>
        </div>

        <div className="ba-actions">
          <button className="ba-btn ba-btn-primary" onClick={onStaySignedIn}>
            <Shield className="ba-btn-icon" />
            Stay signed in
          </button>
          <button className="ba-btn ba-btn-ghost" onClick={onDismiss} aria-label="Dismiss">
            <X className="ba-btn-icon" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="ba-progress-track">
        <div
          className={`ba-progress-fill ${isUrgent ? "ba-progress-urgent" : ""}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
};

 // export default SecurityTimeoutAlert;

const styles = `
  .ba-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    animation: ba-slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes ba-slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .ba-urgent {
    border-bottom-color: #dc2626;
  }

  .ba-urgent .ba-icon-wrap {
    animation: ba-pulse 1.5s ease-in-out infinite;
  }

  @keyframes ba-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  /* Bar */
  .ba-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  @media (max-width: 640px) {
    .ba-bar {
      flex-wrap: wrap;
      padding: 14px 16px;
      gap: 12px;
    }
  }

  /* Icon */
  .ba-icon-wrap {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }

  .ba-urgent .ba-icon-wrap {
    background: #fef2f2;
  }

  .ba-icon {
    width: 20px;
    height: 20px;
    color: #6b7280;
    stroke-width: 2;
  }

  .ba-icon-alert {
    color: #dc2626;
  }

  /* Content */
  .ba-content {
    flex: 1;
    min-width: 0;
  }

  .ba-title {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 3px;
    letter-spacing: -0.2px;
  }

  .ba-body {
    font-size: 13.5px;
    font-weight: 400;
    color: #4b5563;
    margin: 0;
    line-height: 1.5;
  }

  .ba-countdown {
    font-family: 'SF Mono', SFMono-Regular, 'Roboto Mono', monospace;
    font-weight: 700;
    color: #111827;
    background: #f3f4f6;
    padding: 2px 7px;
    border-radius: 5px;
    font-size: 12.5px;
    letter-spacing: 0.3px;
    transition: all 0.2s ease;
  }

  .ba-countdown-urgent {
    color: #dc2626;
    background: #fef2f2;
  }

  /* Actions */
  .ba-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .ba-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .ba-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .ba-btn-icon {
    width: 15px;
    height: 15px;
    stroke-width: 2;
  }

  .ba-btn-primary {
    background: #111827;
    color: #ffffff;
    padding: 9px 18px;
    border-radius: 8px;
    letter-spacing: -0.1px;
  }

  .ba-btn-primary:hover {
    background: #374151;
    transform: translateY(-1px);
  }

  .ba-btn-primary:active {
    background: #1f2937;
    transform: translateY(0);
  }

  .ba-btn-ghost {
    background: transparent;
    color: #9ca3af;
    padding: 9px;
    border-radius: 8px;
  }

  .ba-btn-ghost:hover {
    background: #f3f4f6;
    color: #374151;
  }

  /* Progress bar */
  .ba-progress-track {
    height: 3px;
    background: #f3f4f6;
    width: 100%;
    overflow: hidden;
  }

  .ba-progress-fill {
    height: 100%;
    background: #6b7280;
    transition: width 1s linear;
  }

  .ba-progress-urgent {
    background: #dc2626;
  }
`;
