import React from "react";
import { Timer, Shield, X, AlertCircle } from "lucide-react";

// ── SA Bank-Style Security Timeout Alert ──
// Bold red, crisp white, purple accent. Authoritative and unmistakably premium.

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

      <div className="ba-progress-track">
        <div
          className={`ba-progress-fill ${isUrgent ? "ba-progress-urgent" : ""}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

const styles = `
  .ba-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #ffffff;
    border-bottom: 3px solid #C8102E;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    animation: ba-slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 24px rgba(200, 16, 46, 0.08);
  }

  .ba-urgent {
    border-bottom-color: #9B2242;
    animation: ba-slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1), ba-shake 0.5s ease-in-out;
  }

  @keyframes ba-slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes ba-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  /* Bar */
  .ba-bar {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 18px 28px;
    max-width: 1200px;
    margin: 0 auto;
  }

  @media (max-width: 640px) {
    .ba-bar {
      flex-wrap: wrap;
      padding: 16px 18px;
      gap: 14px;
    }
  }

  /* Icon */
  .ba-icon-wrap {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #FDF2F4;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #F9D0D9;
    transition: all 0.3s ease;
  }

  .ba-urgent .ba-icon-wrap {
    background: #FDF2F4;
    border-color: #C8102E;
    animation: ba-pulse 1.2s ease-in-out infinite;
  }

  @keyframes ba-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(200, 16, 46, 0.2); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(200, 16, 46, 0); }
  }

  .ba-icon {
    width: 22px;
    height: 22px;
    color: #C8102E;
    stroke-width: 2;
  }

  .ba-icon-alert {
    color: #C8102E;
  }

  /* Content */
  .ba-content {
    flex: 1;
    min-width: 0;
  }

  .ba-title {
    font-size: 14.5px;
    font-weight: 700;
    color: #1A1A1A;
    margin: 0 0 4px;
    letter-spacing: -0.2px;
  }

  .ba-body {
    font-size: 13.5px;
    font-weight: 400;
    color: #4A4A4A;
    margin: 0;
    line-height: 1.5;
  }

  .ba-countdown {
    font-family: 'SF Mono', SFMono-Regular, 'Roboto Mono', monospace;
    font-weight: 800;
    color: #C8102E;
    background: #FDF2F4;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 13px;
    letter-spacing: 0.5px;
    border: 1px solid #F9D0D9;
    transition: all 0.2s ease;
  }

  .ba-countdown-urgent {
    color: #ffffff;
    background: #C8102E;
    border-color: #9B2242;
    animation: ba-countdownPulse 1s ease-in-out infinite;
  }

  @keyframes ba-countdownPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Actions */
  .ba-actions {
    display: flex;
    align-items: center;
    gap: 10px;
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
    gap: 7px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.15s ease;
    white-space: nowrap;
    letter-spacing: 0.2px;
  }

  .ba-btn-icon {
    width: 16px;
    height: 16px;
    stroke-width: 2.5;
  }

  .ba-btn-primary {
    background: #C8102E;
    color: #ffffff;
    padding: 10px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(200, 16, 46, 0.25);
  }

  .ba-btn-primary:hover {
    background: #A00D24;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(200, 16, 46, 0.35);
  }

  .ba-btn-primary:active {
    background: #8A0B1F;
    transform: translateY(0);
  }

  .ba-btn-ghost {
    background: transparent;
    color: #6B2D5C;
    padding: 10px;
    border-radius: 8px;
  }

  .ba-btn-ghost:hover {
    background: #F5F0F4;
    color: #4A1F40;
  }

  /* Progress bar */
  .ba-progress-track {
    height: 4px;
    background: #F3E8F0;
    width: 100%;
    overflow: hidden;
  }

  .ba-progress-fill {
    height: 100%;
    background: #6B2D5C;
    transition: width 1s linear;
  }

  .ba-progress-urgent {
    background: #C8102E;
  }
`;
