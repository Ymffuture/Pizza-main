import React, { useEffect } from "react";
import { Timer, Shield, X, AlertCircle } from "lucide-react";

// ── SA Bank-Style Security Timeout Modal ──
// Centered modal overlay with red, white, and purple accent palette.
// Traps focus and prevents interaction with background content.

export default function SecurityTimeoutModal({
  secs,
  onStaySignedIn,
  onDismiss,
}) {
  const isUrgent = secs <= 10;
  const totalTime = 30;
  const progressPct = (secs / totalTime) * 100;

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onDismiss?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div className="stm-overlay" role="dialog" aria-modal="true" aria-labelledby="stm-title">
      <style>{styles}</style>

      <div className={`stm-modal ${isUrgent ? "stm-urgent" : ""}`}>
        {/* Header accent strip */}
        <div className="stm-accent-strip" />

        <button className="stm-close-btn" onClick={onDismiss} aria-label="Close">
          <X className="stm-close-icon" />
        </button>

        <div className="stm-body">
          <div className={`stm-icon-wrap ${isUrgent ? "stm-icon-wrap-urgent" : ""}`}>
            {isUrgent ? (
              <AlertCircle className="stm-icon stm-icon-alert" />
            ) : (
              <Timer className="stm-icon" />
            )}
          </div>

          <h2 id="stm-title" className="stm-title">
            {isUrgent ? "Session expiring now" : "Session timeout warning"}
          </h2>

          <p className="stm-message">
            For your security, you will be signed out in{" "}
            <span className={`stm-countdown ${isUrgent ? "stm-countdown-urgent" : ""}`}>
              {secs}s
            </span>{" "}
            due to inactivity.
          </p>

          {/* Progress bar */}
          <div className="stm-progress-track">
            <div
              className={`stm-progress-fill ${isUrgent ? "stm-progress-urgent" : ""}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="stm-actions">
            <button className="stm-btn stm-btn-primary" onClick={onStaySignedIn}>
              <Shield className="stm-btn-icon" />
              Stay signed in
            </button>
            <button className="stm-btn stm-btn-ghost" onClick={onDismiss}>
              Sign out now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .stm-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(26, 26, 26, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: stm-fadeIn 0.25s ease-out;
  }

  @keyframes stm-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .stm-modal {
    position: relative;
    background: #ffffff;
    border-radius: 16px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    animation: stm-scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .stm-urgent {
    box-shadow: 0 24px 64px rgba(200, 16, 46, 0.15), 0 0 0 1px rgba(200, 16, 46, 0.1);
    animation: stm-scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1), stm-shake 0.5s ease-in-out 0.35s;
  }

  @keyframes stm-scaleIn {
    from { transform: scale(0.92) translateY(12px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
  }

  @keyframes stm-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  /* Accent strip */
  .stm-accent-strip {
    height: 5px;
    background: #C8102E;
    width: 100%;
  }

  .stm-urgent .stm-accent-strip {
    background: #9B2242;
  }

  /* Close button */
  .stm-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    z-index: 1;
  }

  .stm-close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .stm-close-icon {
    width: 18px;
    height: 18px;
    stroke-width: 2;
  }

  /* Body */
  .stm-body {
    padding: 36px 32px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* Icon */
  .stm-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #FDF2F4;
    border: 2px solid #F9D0D9;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    transition: all 0.3s ease;
  }

  .stm-icon-wrap-urgent {
    background: #FDF2F4;
    border-color: #C8102E;
    animation: stm-pulse 1.2s ease-in-out infinite;
  }

  @keyframes stm-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(200, 16, 46, 0.2); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(200, 16, 46, 0); }
  }

  .stm-icon {
    width: 28px;
    height: 28px;
    color: #C8102E;
    stroke-width: 2;
  }

  .stm-icon-alert {
    color: #C8102E;
  }

  /* Typography */
  .stm-title {
    font-size: 18px;
    font-weight: 700;
    color: #1A1A1A;
    margin: 0 0 10px;
    letter-spacing: -0.3px;
    line-height: 1.3;
  }

  .stm-message {
    font-size: 14.5px;
    font-weight: 400;
    color: #4A4A4A;
    margin: 0 0 24px;
    line-height: 1.6;
    max-width: 320px;
  }

  .stm-countdown {
    font-family: 'SF Mono', SFMono-Regular, 'Roboto Mono', monospace;
    font-weight: 800;
    color: #C8102E;
    background: #FDF2F4;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 13.5px;
    letter-spacing: 0.5px;
    border: 1px solid #F9D0D9;
    transition: all 0.2s ease;
  }

  .stm-countdown-urgent {
    color: #ffffff;
    background: #C8102E;
    border-color: #9B2242;
    animation: stm-countdownPulse 1s ease-in-out infinite;
  }

  @keyframes stm-countdownPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.75; }
  }

  /* Progress bar */
  .stm-progress-track {
    width: 100%;
    height: 4px;
    background: #F3E8F0;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 28px;
  }

  .stm-progress-fill {
    height: 100%;
    background: #6B2D5C;
    border-radius: 2px;
    transition: width 1s linear;
  }

  .stm-progress-urgent {
    background: #C8102E;
  }

  /* Actions */
  .stm-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .stm-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.15s ease;
    white-space: nowrap;
    letter-spacing: 0.2px;
    width: 100%;
    padding: 12px 20px;
    border-radius: 10px;
  }

  .stm-btn-icon {
    width: 18px;
    height: 18px;
    stroke-width: 2.5;
  }

  .stm-btn-primary {
    background: #C8102E;
    color: #ffffff;
    box-shadow: 0 2px 12px rgba(200, 16, 46, 0.25);
  }

  .stm-btn-primary:hover {
    background: #A00D24;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(200, 16, 46, 0.35);
  }

  .stm-btn-primary:active {
    background: #8A0B1F;
    transform: translateY(0);
  }

  .stm-btn-ghost {
    background: transparent;
    color: #6B2D5C;
    border: 1.5px solid #E5D5E0;
  }

  .stm-btn-ghost:hover {
    background: #F5F0F4;
    color: #4A1F40;
    border-color: #6B2D5C;
  }

  @media (max-width: 480px) {
    .stm-overlay {
      padding: 16px;
      align-items: flex-end;
    }

    .stm-modal {
      border-radius: 20px 20px 20px 20px;
      max-width: 100%;
    }

    .stm-body {
      padding: 28px 24px 24px;
    }

    .stm-title {
      font-size: 17px;
    }

    .stm-message {
      font-size: 14px;
    }
  }
`;
