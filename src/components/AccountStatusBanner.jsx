// src/components/AccountStatusBanner.jsx

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, Ban, Lock, ShieldOff, X, Phone,
  ShoppingCart, Wallet, Star, MessageSquare, ClipboardList,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw, Timer,
} from "lucide-react";
import {
  useUserStatus,
  FEATURE_LABELS,
  STATUS_META,
} from "../context/UserStatusContext";

/* ─── ICON MAP ───────────────────────────────────────────── */
const FEATURE_ICONS = {
  canAddToCart: ShoppingCart,
  canCheckout: ShoppingCart,
  canOrder: ShoppingCart,
  canUseWallet: Wallet,
  canUseRewards: Star,
  canChat: MessageSquare,
  canViewOrders: ClipboardList,
};

/* ─── COUNTDOWN HOOK (FIXED DRIFT + SAFE CLEANUP) ───────── */
function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const end = new Date(expiresAt).getTime();

    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setRemaining(diff);
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [expiresAt]);

  const seconds = Math.floor(remaining / 1000) % 60;
  const minutes = Math.floor(remaining / 60000) % 60;
  const hours = Math.floor(remaining / 3600000) % 24;
  const days = Math.floor(remaining / 86400000);

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: remaining === 0 && !!expiresAt,
    remaining,
  };
}

/* ─── Dismiss keys (SSR-safe + per-session fallback) ─────── */
const DISMISS_KEY = "kb_status_dismissed";
const getKey = (suffix) => `${DISMISS_KEY}_${suffix}`;

/* ═════════════════ WARNED ═════════════════ */
function WarnedBanner({ reason, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ksb-warned">
      <div className="ksb-warned-left">
        <div className="ksb-warned-icon">
          <AlertTriangle style={{ width: 13, height: 13 }} />
        </div>

        <div className="ksb-warned-text">
          <span className="ksb-warned-label">Account Warning</span>
          {reason && (
            <span className="ksb-warned-reason">
              {expanded
                ? reason
                : reason.length > 60
                  ? reason.slice(0, 60) + "…"
                  : reason}
            </span>
          )}
        </div>

        {reason?.length > 60 && (
          <button
            className="ksb-expand-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronUp style={{ width: 11, height: 11 }} />
            ) : (
              <ChevronDown style={{ width: 11, height: 11 }} />
            )}
          </button>
        )}
      </div>

      <div className="ksb-warned-actions">
        <Link to="/info" className="ksb-warned-policy-link">
          View Policy
        </Link>

        <button className="ksb-dismiss-btn" onClick={onDismiss}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}

/* ═════════════════ RESTRICTED ═════════════════ */
function RestrictedBanner({ reason, affectedFeatures }) {
  const [showReason, setShowReason] = useState(false);

  const lockedChips = useMemo(() => {
    return (affectedFeatures || []).filter(
      (f) => !["canCheckout", "canOrder"].includes(f)
    );
  }, [affectedFeatures]);

  return (
    <div className="ksb-restricted">
      <div className="ksb-restricted-left">
        <div className="ksb-restr-icon-wrap">
          <Ban style={{ width: 13, height: 13 }} />
        </div>

        <div className="ksb-restr-content">
          <span className="ksb-restr-label">
            Some features are currently restricted
          </span>

          <div className="ksb-restr-chips">
            {lockedChips.map((f) => {
              const Icon = FEATURE_ICONS[f] || Lock;
              return (
                <span key={f} className="ksb-restr-chip">
                  <Icon style={{ width: 10, height: 10 }} />
                  {FEATURE_LABELS[f]}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="ksb-restr-actions">
        <button
          className="ksb-why-btn"
          onClick={() => setShowReason((s) => !s)}
        >
          {showReason ? "Hide" : "Why?"}
        </button>

        <a href="tel:0653935339" className="ksb-appeal-btn">
          <Phone style={{ width: 11, height: 11 }} />
          Appeal
        </a>
      </div>

      {showReason && reason && (
        <div className="ksb-restr-reason-box">
          <span className="ksb-restr-reason-label">Reason:</span>
          <span className="ksb-restr-reason-text">{reason}</span>
        </div>
      )}
    </div>
  );
}

/* ═════════════════ SUSPENDED ═════════════════ */
function SuspendedModal({
  reason,
  expiresAt,
  affectedFeatures,
  appealed,
  onBrowse,
}) {
  const { days, hours, minutes, seconds, expired } =
    useCountdown(expiresAt);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  const expStr = expiresAt
    ? new Date(expiresAt).toLocaleString("en-ZA")
    : null;

  const keyFeatures = useMemo(() => {
    return (affectedFeatures || []).filter(
      (f) => !["canCheckout", "canOrder"].includes(f)
    );
  }, [affectedFeatures]);

  return (
    <div className="ksb-susp-backdrop">
      <div className="ksb-susp-modal">
        <div className="ksb-susp-icon-ring">
          <Lock style={{ width: 28, height: 28, color: "#f87171" }} />
        </div>

        <h2 className="ksb-susp-title">Account Suspended</h2>

        <p className="ksb-susp-sub">
          Temporary restriction applied to your account.
        </p>

        {reason && (
          <div className="ksb-susp-reason-box">
            <AlertTriangle style={{ width: 13, height: 13 }} />
            <span>{reason}</span>
          </div>
        )}

        {expiresAt && (
          <div className="ksb-susp-timer-section">
            <div className="ksb-susp-timer-label">
              <Timer style={{ width: 12, height: 12 }} />
              {expired ? "Expired — refresh required" : `Until ${expStr}`}
            </div>

            {!expired && (
              <div className="ksb-susp-countdown">
                <div>{days}d</div>
                <div>{String(hours).padStart(2, "0")}h</div>
                <div>{String(minutes).padStart(2, "0")}m</div>
                <div>{String(seconds).padStart(2, "0")}s</div>
              </div>
            )}

            {expired && (
              <button onClick={() => window.location.reload()}>
                <RefreshCw />
                Refresh
              </button>
            )}
          </div>
        )}

        <div className="ksb-susp-actions">
          <a href="tel:0653935339" className="ksb-susp-contact-btn">
            Contact Support
          </a>

          {!appealed && (
            <Link to="/support" className="ksb-susp-appeal-link">
              Submit Appeal
            </Link>
          )}

          <button onClick={onBrowse} className="ksb-susp-browse-btn">
            Browse Only
          </button>
        </div>

        <p className="ksb-susp-footer-note">
          Some features are disabled
        </p>
      </div>
    </div>
  );
}

/* ═════════════════ BANNED ═════════════════ */
function BannedOverlay({ reason, appealed }) {
  const [min, setMin] = useState(false);

  if (min) {
    return (
      <div
        className="ksb-banned-badge"
        onClick={() => setMin(false)}
      >
        <ShieldOff />
        Account Banned
      </div>
    );
  }

  return (
    <div className="ksb-banned-overlay">
      <div className="ksb-banned-card">
        <button
          className="ksb-banned-minimise"
          onClick={() => setMin(true)}
        >
          <X />
        </button>

        <h1 className="ksb-banned-title">Account Banned</h1>

        {reason && (
          <div className="ksb-banned-reason">
            {reason}
          </div>
        )}

        <div className="ksb-banned-actions">
          <a href="tel:0653935339">Call Support</a>

          {!appealed && (
            <Link to="/support">Appeal</Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════ MAIN ═════════════════ */
export default function AccountStatusBanner() {
  const {
    status,
    reason,
    expiresAt,
    affectedFeatures,
    appealed,
  } = useUserStatus();

  const [warnDismissed, setWarnDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(getKey("warned")) === "1"
  );

  const [suspDismissed, setSuspDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(getKey("suspended")) === "1"
  );

  const dismissWarn = useCallback(() => {
    sessionStorage.setItem(getKey("warned"), "1");
    setWarnDismissed(true);
  }, []);

  const dismissSusp = useCallback(() => {
    sessionStorage.setItem(getKey("suspended"), "1");
    setSuspDismissed(true);
  }, []);

  const prev = useRef(status);

  useEffect(() => {
    if (prev.current !== status) {
      if (status === "warned") setWarnDismissed(false);
      if (status === "suspended") setSuspDismissed(false);
      prev.current = status;
    }
  }, [status]);

  return (
    <>
      <style>{css}</style>

      {status === "warned" && !warnDismissed && (
        <WarnedBanner reason={reason} onDismiss={dismissWarn} />
      )}

      {status === "restricted" && (
        <RestrictedBanner
          reason={reason}
          affectedFeatures={affectedFeatures}
        />
      )}

      {status === "suspended" && !suspDismissed && (
        <SuspendedModal
          reason={reason}
          expiresAt={expiresAt}
          affectedFeatures={affectedFeatures}
          appealed={appealed}
          onBrowse={dismissSusp}
        />
      )}

      {status === "suspended" && suspDismissed && (
        <RestrictedBanner
          reason={reason}
          affectedFeatures={affectedFeatures}
        />
      )}

      {status === "banned" && (
        <BannedOverlay reason={reason} appealed={appealed} />
      )}
    </>
  );
}
