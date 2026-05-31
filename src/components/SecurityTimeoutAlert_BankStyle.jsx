import React from "react";
import { Timer, Shield, X, AlertCircle } from "lucide-react";

// ── Bank-Style Security Timeout Alert ──
// Authoritative, trustworthy, minimal. No gradients, no shadows, no gimmicks.

const SecurityTimeoutAlert = ({ secs, onStaySignedIn, onDismiss }) => {
  const isUrgent = secs <= 10;

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
            {isUrgent ? "Session expiring soon" : "Session timeout warning"}
          </p>
          <p className="ba-body">
            For your security, you will be signed out in{" "}
            <strong className={`ba-countdown ${isUrgent ? "ba-countdown-urgent" : ""}`}>
              {secs}s
            </strong>{" "}
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
          style={{ width: `${(secs / 300) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default SecurityTimeoutAlert;

const styles = `
  .ba-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #ffffff;
    border-bottom: 1px solid #d1d5db;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  }

  .ba-urgent {
    border-bottom-color: #dc2626;
  }

  /* Bar */
  .ba-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  @media (max-width: 640px) {
    .ba-bar {
      flex-wrap: wrap;
      padding: 12px 16px;
      gap: 12px;
    }
  }

  /* Icon */
  .ba-icon-wrap {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ba-urgent .ba-icon-wrap {
    background: #fef2f2;
  }

  .ba-icon {
    width: 18px;
    height: 18px;
    color: #6b7280;
    stroke-width: 2.5;
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
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 2px;
    letter-spacing: -0.1px;
  }

  .ba-body {
    font-size: 13px;
    font-weight: 400;
    color: #4b5563;
    margin: 0;
    line-height: 1.5;
  }

  .ba-countdown {
    font-family: 'SF Mono', 'Roboto Mono', monospace;
    font-weight: 700;
    color: #111827;
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12px;
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
    transition: all 0.12s ease;
    white-space: nowrap;
  }

  .ba-btn-icon {
    width: 14px;
    height: 14px;
    stroke-width: 2.5;
  }

  .ba-btn-primary {
    background: #111827;
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 6px;
  }

  .ba-btn-primary:hover {
    background: #374151;
  }

  .ba-btn-primary:active {
    background: #1f2937;
  }

  .ba-btn-ghost {
    background: transparent;
    color: #6b7280;
    padding: 8px;
    border-radius: 6px;
  }

  .ba-btn-ghost:hover {
    background: #f3f4f6;
    color: #374151;
  }

  /* Progress bar */
  .ba-progress-track {
    height: 3px;
    background: #e5e7eb;
    width: 100%;
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
