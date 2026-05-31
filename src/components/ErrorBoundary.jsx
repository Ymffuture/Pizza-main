import React from "react";
import { AlertTriangle, RefreshCw, Home, MessageCircle, ChevronRight } from "lucide-react";

// ── Google Material-style Error Boundary ──
// Clean, minimal, trustworthy. No custom SVGs. Standard icons only.

const ErrorFallback = ({ error, resetError }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      resetError();
    }, 800);
  };

  return (
    <div className="ge-root">
      <style>{styles}</style>

      <div className="ge-card">
        {/* Illustration */}
        <div className={`ge-illustration ${isRetrying ? "ge-shake" : ""}`}>
          <div className="ge-icon-ring">
            <AlertTriangle className="ge-icon" />
          </div>
        </div>

        {/* Content */}
        <h1 className="ge-title">Something went wrong</h1>
        <p className="ge-desc">
          We encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>

        {/* Error detail (collapsible) */}
        {error?.message && (
          <details className="ge-details">
            <summary className="ge-summary">
              <span>Error details</span>
              <ChevronRight className="ge-chevron" />
            </summary>
            <code className="ge-code">{error.message}</code>
          </details>
        )}

        {/* Actions */}
        <div className="ge-actions">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="ge-btn ge-btn-primary"
          >
            <RefreshCw className={`ge-btn-icon ${isRetrying ? "ge-spin" : ""}`} />
            {isRetrying ? "Retrying..." : "Try again"}
          </button>

          <a href="/" className="ge-btn ge-btn-secondary">
            <Home className="ge-btn-icon" />
            Go home
          </a>
        </div>

        {/* Footer */}
        <div className="ge-footer">
          <a href="/support" className="ge-link">
            <MessageCircle className="ge-link-icon" />
            Contact support
          </a>
          <span className="ge-error-id">
            Error ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetError={this.resetError} />;
    }
    return this.props.children;
  }
}

const styles = `
  .ge-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #f8f9fa;
    font-family: 'Roboto', 'Segoe UI', system-ui, -apple-system, sans-serif;
  }

  .ge-card {
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    border-radius: 28px;
    padding: 48px 40px 32px;
    text-align: center;
    box-shadow:
      0 1px 2px rgba(60,64,67,0.08),
      0 2px 6px rgba(60,64,67,0.06),
      0 4px 24px rgba(60,64,67,0.04);
    border: 1px solid #e8eaed;
  }

  /* Illustration */
  .ge-illustration {
    margin-bottom: 28px;
    display: flex;
    justify-content: center;
  }
  .ge-icon-ring {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #fce8e8;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ge-icon {
    width: 36px;
    height: 36px;
    color: #d93025;
    stroke-width: 2;
  }

  /* Typography */
  .ge-title {
    font-size: 22px;
    font-weight: 500;
    color: #202124;
    margin: 0 0 12px;
    letter-spacing: -0.2px;
    line-height: 1.3;
  }
  .ge-desc {
    font-size: 14px;
    font-weight: 400;
    color: #5f6368;
    line-height: 1.6;
    margin: 0 0 24px;
    max-width: 360px;
    margin-left: auto;
    margin-right: auto;
  }

  /* Collapsible error details */
  .ge-details {
    margin-bottom: 24px;
    text-align: left;
    border: 1px solid #dadce0;
    border-radius: 12px;
    overflow: hidden;
  }
  .ge-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #5f6368;
    cursor: pointer;
    list-style: none;
    user-select: none;
    transition: background 0.15s;
  }
  .ge-summary:hover {
    background: #f8f9fa;
  }
  .ge-summary::-webkit-details-marker {
    display: none;
  }
  .ge-chevron {
    width: 16px;
    height: 16px;
    color: #5f6368;
    transition: transform 0.2s;
  }
  .ge-details[open] .ge-chevron {
    transform: rotate(90deg);
  }
  .ge-code {
    display: block;
    padding: 12px 16px;
    font-size: 12px;
    font-family: 'Roboto Mono', 'SF Mono', monospace;
    color: #d93025;
    background: #fce8e8;
    line-height: 1.5;
    word-break: break-all;
  }

  /* Actions */
  .ge-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 24px;
  }
  .ge-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 12px 24px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
    border: none;
    outline: none;
  }
  .ge-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .ge-btn-icon {
    width: 18px;
    height: 18px;
    stroke-width: 2;
  }

  .ge-btn-primary {
    background: #1a73e8;
    color: #ffffff;
    box-shadow: 0 1px 3px rgba(26,115,232,0.3);
  }
  .ge-btn-primary:hover:not(:disabled) {
    background: #1557b0;
    box-shadow: 0 2px 6px rgba(26,115,232,0.4);
  }
  .ge-btn-primary:active:not(:disabled) {
    background: #174ea6;
  }

  .ge-btn-secondary {
    background: transparent;
    color: #1a73e8;
    border: 1px solid #dadce0;
  }
  .ge-btn-secondary:hover {
    background: #f1f3f4;
    border-color: #d2d4d7;
  }
  .ge-btn-secondary:active {
    background: #e8eaed;
  }

  /* Footer */
  .ge-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid #e8eaed;
  }
  .ge-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #1a73e8;
    text-decoration: none;
    transition: color 0.15s;
  }
  .ge-link:hover {
    color: #1557b0;
    text-decoration: underline;
  }
  .ge-link-icon {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
  .ge-error-id {
    font-size: 11px;
    color: #9aa0a6;
    font-family: 'Roboto Mono', monospace;
  }

  /* Animations */
  .ge-spin {
    animation: geSpin 0.8s linear infinite;
  }
  @keyframes geSpin {
    to { transform: rotate(360deg); }
  }
  .ge-shake {
    animation: geShake 0.4s ease-in-out;
  }
  @keyframes geShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }

  /* Responsive */
  @media (max-width: 520px) {
    .ge-root {
      padding: 16px;
      background: #ffffff;
    }
    .ge-card {
      box-shadow: none;
      border: none;
      padding: 32px 20px;
      border-radius: 0;
    }
    .ge-title {
      font-size: 20px;
    }
  }
`;
