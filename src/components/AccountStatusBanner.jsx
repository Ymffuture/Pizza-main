// src/components/AccountStatusBanner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders the correct restriction UI based on account status.
// SMART LAYOUT: Banners push content down instead of covering navbars/sidebars.
//
// Usage:
//   // In App.jsx — place INSIDE your layout, not at root:
//   <div className="app-layout">
//     <Sidebar />
//     <main className="main-area">
//       <TopNavbar />
//       <AccountStatusBanner layout="smart" />
//       <PageContent />
//     </main>
//   </div>
//
//   // Or with fixed layout (legacy):
//   <AccountStatusBanner layout="fixed" />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
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

/* ─── Icon map for each feature key ─────────────────────────────────────── */
const FEATURE_ICONS = {
  canAddToCart:  ShoppingCart,
  canCheckout:   ShoppingCart,
  canOrder:      ShoppingCart,
  canUseWallet:  Wallet,
  canUseRewards: Star,
  canChat:       MessageSquare,
  canViewOrders: ClipboardList,
};

/* ─── Countdown hook ─────────────────────────────────────────────────────── */
function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const days    = Math.floor(remaining / 86400);
  const hours   = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const expired = remaining === 0 && !!expiresAt;

  return { days, hours, minutes, seconds, expired, remaining };
}

/* ─── Shared session-dismiss key ─────────────────────────────────────────── */
const DISMISS_KEY = "kb_status_dismissed";

/* ══════════════════════════════════════════════════════════════════════════
   1. WARNED BANNER  (smart layout — in-flow)
══════════════════════════════════════════════════════════════════════════ */
function WarnedBanner({ reason, onDismiss, layout }) {
  const [expanded, setExpanded] = useState(false);
  const isFixed = layout === "fixed";

  return (
    <div className={`ksb-warned ${isFixed ? "ksb-warned--fixed" : "ksb-warned--smart"}`}>
      <div className="ksb-warned-left">
        <div className="ksb-warned-icon">
          <AlertTriangle style={{ width: 14, height: 14 }} />
        </div>
        <div className="ksb-warned-text">
          <span className="ksb-warned-label">Account Warning</span>
          {reason && (
            <span className="ksb-warned-reason">
              {expanded ? reason : reason.length > 80 ? reason.slice(0, 80) + "…" : reason}
            </span>
          )}
        </div>
        {reason && reason.length > 80 && (
          <button className="ksb-expand-btn" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? "Collapse" : "Expand"}>
            {expanded ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
          </button>
        )}
      </div>
      <div className="ksb-warned-actions">
        <Link to="/info" className="ksb-warned-policy-link">
          View Policy
        </Link>
        <button className="ksb-dismiss-btn" onClick={onDismiss} title="Dismiss" aria-label="Dismiss warning">
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. RESTRICTED BANNER  (smart layout — in-flow)
══════════════════════════════════════════════════════════════════════════ */
function RestrictedBanner({ reason, affectedFeatures, layout }) {
  const [showReason, setShowReason] = useState(false);
  const isFixed = layout === "fixed";

  const lockedChips = affectedFeatures.filter(
    (f) => !["canCheckout", "canOrder"].includes(f)
  );

  return (
    <div className={`ksb-restricted ${isFixed ? "ksb-restricted--fixed" : "ksb-restricted--smart"}`}>
      <div className="ksb-restricted-left">
        <div className="ksb-restr-icon-wrap">
          <Ban style={{ width: 14, height: 14 }} />
        </div>
        <div className="ksb-restr-content">
          <span className="ksb-restr-label">Some features are currently restricted</span>
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
        <button className="ksb-why-btn" onClick={() => setShowReason((s) => !s)}>
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

/* ══════════════════════════════════════════════════════════════════════════
   3. SUSPENDED MODAL  (centered, doesn't block nav)
══════════════════════════════════════════════════════════════════════════ */
function SuspendedModal({ reason, expiresAt, affectedFeatures, appealed, onBrowse }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(expiresAt);
  const expStr = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const keyFeatures = affectedFeatures.filter(
    (f) => !["canCheckout", "canOrder"].includes(f)
  );

  return (
    <div className="ksb-susp-backdrop">
      <div className="ksb-susp-modal" role="dialog" aria-modal="true" aria-labelledby="susp-title">
        <div className="ksb-susp-strip" />
        <div className="ksb-susp-icon-ring">
          <Lock style={{ width: 28, height: 28, color: "#f87171" }} />
        </div>
        <h2 id="susp-title" className="ksb-susp-title">Account Suspended</h2>
        <p className="ksb-susp-sub">
          Your account has been temporarily suspended and some features are disabled.
        </p>

        {reason && (
          <div className="ksb-susp-reason-box">
            <AlertTriangle style={{ width: 13, height: 13, color: "#fb923c", flexShrink: 0 }} />
            <span>{reason}</span>
          </div>
        )}

        {expiresAt && (
          <div className="ksb-susp-timer-section">
            <div className="ksb-susp-timer-label">
              <Timer style={{ width: 12, height: 12 }} />
              {expired ? "Suspension ended — please refresh" : `Suspended until ${expStr}`}
            </div>
            {!expired && (
              <div className="ksb-susp-countdown" aria-live="polite">
                {days > 0 && (
                  <div className="ksb-susp-tick">
                    <span className="ksb-susp-tick-num">{days}</span>
                    <span className="ksb-susp-tick-unit">days</span>
                  </div>
                )}
                <div className="ksb-susp-tick">
                  <span className="ksb-susp-tick-num">{String(hours).padStart(2, "0")}</span>
                  <span className="ksb-susp-tick-unit">hrs</span>
                </div>
                <div className="ksb-susp-tick-sep">:</div>
                <div className="ksb-susp-tick">
                  <span className="ksb-susp-tick-num">{String(minutes).padStart(2, "0")}</span>
                  <span className="ksb-susp-tick-unit">min</span>
                </div>
                <div className="ksb-susp-tick-sep">:</div>
                <div className="ksb-susp-tick">
                  <span className="ksb-susp-tick-num">{String(seconds).padStart(2, "0")}</span>
                  <span className="ksb-susp-tick-unit">sec</span>
                </div>
              </div>
            )}
            {expired && (
              <button className="ksb-refresh-btn" onClick={() => window.location.reload()}>
                <RefreshCw style={{ width: 13, height: 13 }} />
                Refresh to restore access
              </button>
            )}
          </div>
        )}

        {keyFeatures.length > 0 && (
          <div className="ksb-susp-features">
            <p className="ksb-susp-feat-label">Disabled features:</p>
            <div className="ksb-susp-feat-chips">
              {keyFeatures.map((f) => {
                const Icon = FEATURE_ICONS[f] || Lock;
                return (
                  <div key={f} className="ksb-susp-feat-chip">
                    <Icon style={{ width: 11, height: 11 }} />
                    {FEATURE_LABELS[f]}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="ksb-susp-actions">
          <a href="tel:0653935339" className="ksb-susp-contact-btn">
            <Phone style={{ width: 14, height: 14 }} />
            Contact Support
          </a>
          {!appealed && (
            <Link to="/support" className="ksb-susp-appeal-link">
              Submit Appeal
              <ExternalLink style={{ width: 11, height: 11 }} />
            </Link>
          )}
          <button className="ksb-susp-browse-btn" onClick={onBrowse}>
            Browse Menu Only
          </button>
        </div>

        <p className="ksb-susp-footer-note">
          🔒 Wallet, Rewards & Cart are disabled during suspension
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. BANNED OVERLAY  (minimizable, respects layout)
══════════════════════════════════════════════════════════════════════════ */
function BannedOverlay({ reason, appealed }) {
  const [minimised, setMinimised] = useState(false);

  if (minimised) {
    return (
      <div className="ksb-banned-badge" onClick={() => setMinimised(false)} title="Account banned — click for details" role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setMinimised(false)}>
        <ShieldOff style={{ width: 13, height: 13 }} />
        <span>Account Banned</span>
      </div>
    );
  }

  return (
    <div className="ksb-banned-overlay">
      <div className="ksb-banned-card" role="alertdialog" aria-modal="true" aria-labelledby="banned-title">
        <button className="ksb-banned-minimise" onClick={() => setMinimised(true)} title="Minimise" aria-label="Minimise ban overlay">
          <X style={{ width: 14, height: 14 }} />
        </button>
        <div className="ksb-banned-icon-ring">
          <ShieldOff style={{ width: 36, height: 36, color: "#ff2424" }} />
        </div>
        <h1 id="banned-title" className="ksb-banned-title">Account Permanently Banned</h1>
        <p className="ksb-banned-sub">
          This account has been permanently disabled and no longer has access to KotaBites services.
        </p>

        {reason && (
          <div className="ksb-banned-reason">
            <p className="ksb-banned-reason-head">Reason for ban:</p>
            <p className="ksb-banned-reason-body">{reason}</p>
          </div>
        )}

        <div className="ksb-banned-locked-grid">
          {[
            { label: "Cart", Icon: ShoppingCart },
            { label: "Wallet", Icon: Wallet },
            { label: "Rewards", Icon: Star },
            { label: "KotaBot", Icon: MessageSquare },
            { label: "Orders", Icon: ClipboardList },
          ].map(({ label, Icon }) => (
            <div key={label} className="ksb-banned-locked-chip">
              <Lock style={{ width: 10, height: 10 }} />
              <Icon style={{ width: 10, height: 10 }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="ksb-banned-actions">
          <a href="tel:0653935339" className="ksb-banned-call-btn">
            <Phone style={{ width: 14, height: 14 }} />
            065 393 5339
          </a>
          {!appealed && (
            <Link to="/support" className="ksb-banned-appeal-btn">
              Submit Appeal
            </Link>
          )}
        </div>

        <p className="ksb-banned-policy">
          <Link to="/terms" className="ksb-banned-policy-link">Terms & Conditions</Link>
          {" · "}
          <Link to="/info" className="ksb-banned-policy-link">Help Center</Link>
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   5. MAIN ORCHESTRATOR — AccountStatusBanner
══════════════════════════════════════════════════════════════════════════ */
export default function AccountStatusBanner({ layout = "smart" }) {
  const {
    status, reason, expiresAt, affectedFeatures, appealed,
  } = useUserStatus();

  const [warnDismissed,  setWarnDismissed]  = useState(
    () => sessionStorage.getItem(DISMISS_KEY + "_warned") === "1"
  );
  const [suspDismissed,  setSuspDismissed]  = useState(
    () => sessionStorage.getItem(DISMISS_KEY + "_suspended") === "1"
  );

  const dismissWarn = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY + "_warned", "1");
    setWarnDismissed(true);
  }, []);

  const dismissSusp = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY + "_suspended", "1");
    setSuspDismissed(true);
  }, []);

  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== status) {
      if (status === "suspended") setSuspDismissed(false);
      if (status === "warned")    setWarnDismissed(false);
      prevStatusRef.current = status;
    }
  }, [status]);

  return (
    <>
      <style>{css}</style>

      {status === "warned" && !warnDismissed && (
        <WarnedBanner reason={reason} onDismiss={dismissWarn} layout={layout} />
      )}

      {status === "restricted" && (
        <RestrictedBanner reason={reason} affectedFeatures={affectedFeatures} layout={layout} />
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
          reason={reason ?? "Account is currently suspended"}
          affectedFeatures={affectedFeatures}
          layout={layout}
        />
      )}

      {status === "banned" && (
        <BannedOverlay reason={reason} appealed={appealed} />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. FEATURE GATE
══════════════════════════════════════════════════════════════════════════ */
export function FeatureGate({ feature, mode = "overlay", label, children }) {
  const { features, status } = useUserStatus();
  const allowed = features[feature] ?? true;
  const [showTip, setShowTip] = useState(false);
  const tipTimeout = useRef(null);

  if (allowed) return children;

  if (mode === "hide") return null;

  if (mode === "disable") {
    return (
      <div style={{ position: "relative", pointerEvents: "none", opacity: 0.45, userSelect: "none" }}>
        {children}
      </div>
    );
  }

  const meta      = STATUS_META[status] ?? STATUS_META.active;
  const lockLabel = label ?? `${FEATURE_LABELS[feature] ?? "Feature"} · ${meta.label}`;

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    clearTimeout(tipTimeout.current);
    setShowTip(true);
    tipTimeout.current = setTimeout(() => setShowTip(false), 2800);
  };

  return (
    <div className="kfg-wrap">
      <div className="kfg-children-inert" aria-hidden="true">
        {children}
      </div>
      <div
        className="kfg-overlay"
        style={{ "--fg-accent": meta.accent }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
        aria-label={`${lockLabel} — locked`}
      >
        <div className="kfg-lock-icon">
          <Lock style={{ width: 14, height: 14, color: meta.accent }} />
        </div>
        {showTip && (
          <div className="kfg-tooltip">
            <Lock style={{ width: 10, height: 10 }} />
            <span>{lockLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STYLES  —  Smart layout: in-flow banners, no fixed positioning
══════════════════════════════════════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');

/* ═══════════════════════════════════════════════════════════════════════
   SMART LAYOUT  (default — banners sit in document flow)
   ═══════════════════════════════════════════════════════════════════════ */
.ksb-warned--smart,
.ksb-restricted--smart {
  position: relative;
  width: 100%;
  z-index: 100;
}

/* ═══════════════════════════════════════════════════════════════════════
   FIXED LAYOUT  (legacy — overlays everything)
   ═══════════════════════════════════════════════════════════════════════ */
.ksb-warned--fixed {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9100;
  animation: ksbSlideDown 0.3s cubic-bezier(0.34,1.2,0.64,1);
}
.ksb-restricted--fixed {
  position: fixed; top: 0; left: 0; right: 0; z-index: 9100;
  animation: ksbSlideDown 0.3s cubic-bezier(0.34,1.2,0.64,1);
}

/* ─── WARNED BANNER ─────────────────────────────────────────────────── */
.ksb-warned {
  background: rgba(30,20,0,0.97);
  border-bottom: 1px solid rgba(251,191,36,0.35);
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: 10px 20px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  backdrop-filter: blur(16px);
  flex-wrap: wrap;
}
.ksb-warned-left {
  display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;
}
.ksb-warned-icon {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3);
  color: #fbbf24; display: flex; align-items: center; justify-content: center;
}
.ksb-warned-text {
  display: flex; flex-direction: column; gap: 2px; min-width: 0;
}
.ksb-warned-label {
  font-size: 11px; font-weight: 900; color: #fbbf24;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.ksb-warned-reason {
  font-size: 12px; font-weight: 500; color: rgba(255,248,231,0.55);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ksb-expand-btn {
  background: none; border: none; cursor: pointer; padding: 3px;
  color: rgba(251,191,36,0.6); flex-shrink: 0; display: flex;
  border-radius: 4px; transition: all 0.15s;
}
.ksb-expand-btn:hover { color: #fbbf24; background: rgba(251,191,36,0.1); }
.ksb-warned-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ksb-warned-policy-link {
  font-size: 11px; font-weight: 700;
  color: rgba(251,191,36,0.7); text-decoration: none;
  border-bottom: 1px solid rgba(251,191,36,0.25); transition: color 0.15s;
}
.ksb-warned-policy-link:hover { color: #fbbf24; }
.ksb-dismiss-btn {
  width: 26px; height: 26px; border-radius: 7px;
  background: rgba(255,248,231,0.05); border: 1px solid rgba(255,248,231,0.1);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,248,231,0.35); cursor: pointer; transition: all 0.15s;
}
.ksb-dismiss-btn:hover {
  color: #fff8e7; background: rgba(218,41,28,0.2);
  border-color: rgba(218,41,28,0.35);
}

/* ─── RESTRICTED BANNER ─────────────────────────────────────────────── */
.ksb-restricted {
  background: rgba(25,10,0,0.97);
  border-bottom: 1px solid rgba(251,146,60,0.35);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  backdrop-filter: blur(16px);
}
.ksb-restricted-left {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px; flex-wrap: wrap;
}
.ksb-restr-icon-wrap {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  background: rgba(251,146,60,0.15); border: 1px solid rgba(251,146,60,0.3);
  color: #fb923c; display: flex; align-items: center; justify-content: center;
}
.ksb-restr-content { flex: 1; min-width: 0; }
.ksb-restr-label {
  font-size: 11px; font-weight: 800; color: #fb923c;
  text-transform: uppercase; letter-spacing: 0.06em; display: block;
  margin-bottom: 6px;
}
.ksb-restr-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.ksb-restr-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 20px;
  background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.22);
  font-size: 10px; font-weight: 700; color: rgba(251,146,60,0.8);
}
.ksb-restr-actions {
  display: flex; align-items: center; gap: 8px;
  padding: 0 20px 10px;
}
.ksb-why-btn {
  font-size: 11px; font-weight: 800; color: rgba(251,146,60,0.7);
  background: none; border: none; cursor: pointer; padding: 4px 10px;
  border-radius: 6px; border: 1px solid rgba(251,146,60,0.2);
  transition: all 0.15s; font-family: 'Plus Jakarta Sans', sans-serif;
}
.ksb-why-btn:hover { color: #fb923c; background: rgba(251,146,60,0.08); }
.ksb-appeal-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 800; color: #0e0700;
  background: #fb923c; border: none; cursor: pointer;
  padding: 5px 14px; border-radius: 6px; text-decoration: none;
  transition: all 0.15s;
}
.ksb-appeal-btn:hover { background: #ea7c2a; }
.ksb-restr-reason-box {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 20px 12px;
  background: rgba(251,146,60,0.06);
  border-top: 1px solid rgba(251,146,60,0.1);
  font-size: 12px;
  animation: ksbFadeIn 0.2s ease;
}
.ksb-restr-reason-label {
  font-weight: 900; color: #fb923c; flex-shrink: 0;
  text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em;
  margin-top: 1px;
}
.ksb-restr-reason-text { color: rgba(255,248,231,0.55); font-weight: 500; line-height: 1.5; }

/* ─── SUSPENDED MODAL ───────────────────────────────────────────────── */
.ksb-susp-backdrop {
  position: fixed; inset: 0; z-index: 9200;
  background: rgba(0,0,0,0.82);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: ksbFadeIn 0.25s ease;
}
.ksb-susp-modal {
  position: relative; width: 100%; max-width: 440px;
  background: #150800;
  border: 1px solid rgba(248,113,113,0.25);
  border-radius: 24px; padding: 36px 28px 28px;
  text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(248,113,113,0.08);
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  animation: ksbSlideUp 0.38s cubic-bezier(0.34,1.2,0.64,1);
}
.ksb-susp-strip {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #f87171, #DA291C, transparent);
  border-radius: 24px 24px 0 0;
}
.ksb-susp-icon-ring {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 40px rgba(248,113,113,0.15);
  animation: ksbIconPulse 2.2s ease infinite;
}
@keyframes ksbIconPulse {
  0%,100%{box-shadow:0 0 40px rgba(248,113,113,0.15)}
  50%{box-shadow:0 0 60px rgba(248,113,113,0.3)}
}
.ksb-susp-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 30px; letter-spacing: 3px; color: #fff8e7; margin: 0; line-height: 1;
}
.ksb-susp-sub {
  font-size: 13px; color: rgba(255,248,231,0.42);
  max-width: 320px; line-height: 1.65; margin: 0;
}
.ksb-susp-reason-box {
  display: flex; align-items: flex-start; gap: 8px;
  background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.2);
  border-radius: 12px; padding: 12px 16px; text-align: left;
  width: 100%;
}
.ksb-susp-reason-box span {
  font-size: 12px; color: rgba(255,248,231,0.6); line-height: 1.6;
}
.ksb-susp-timer-section {
  width: 100%;
  background: rgba(248,113,113,0.06); border: 1px solid rgba(248,113,113,0.15);
  border-radius: 14px; padding: 14px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.ksb-susp-timer-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: rgba(248,113,113,0.7);
  text-transform: uppercase; letter-spacing: 0.07em;
}
.ksb-susp-countdown {
  display: flex; align-items: center; gap: 4px;
}
.ksb-susp-tick {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  min-width: 44px;
  background: rgba(14,7,0,0.5);
  border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; padding: 8px 6px;
}
.ksb-susp-tick-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 26px; letter-spacing: 1px; color: #f87171; line-height: 1;
}
.ksb-susp-tick-unit {
  font-size: 9px; font-weight: 800; color: rgba(248,113,113,0.45);
  text-transform: uppercase; letter-spacing: 0.1em;
}
.ksb-susp-tick-sep {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px; color: rgba(248,113,113,0.35); line-height: 1;
  padding-bottom: 12px;
}
.ksb-refresh-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3);
  border-radius: 8px; padding: 8px 16px;
  color: #4ade80; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all 0.18s;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.ksb-refresh-btn:hover { background: rgba(74,222,128,0.2); }
.ksb-susp-features { width: 100%; }
.ksb-susp-feat-label {
  font-size: 10px; font-weight: 800; color: rgba(255,248,231,0.3);
  text-transform: uppercase; letter-spacing: 0.1em;
  margin: 0 0 8px; text-align: left;
}
.ksb-susp-feat-chips {
  display: flex; gap: 6px; flex-wrap: wrap;
}
.ksb-susp-feat-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
  font-size: 11px; font-weight: 700; color: rgba(248,113,113,0.7);
}
.ksb-susp-actions {
  display: flex; flex-direction: column; gap: 8px; width: 100%;
}
.ksb-susp-contact-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: #DA291C; color: #fff; border: none; border-radius: 12px;
  padding: 13px; font-size: 14px; font-weight: 900;
  cursor: pointer; text-decoration: none; transition: all 0.18s;
  font-family: 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 4px 18px rgba(218,41,28,0.35);
}
.ksb-susp-contact-btn:hover { background: #b91c1c; }
.ksb-susp-appeal-link {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 11px; border: 1px solid rgba(248,113,113,0.25); border-radius: 12px;
  color: rgba(248,113,113,0.7); font-size: 13px; font-weight: 700;
  text-decoration: none; transition: all 0.18s;
}
.ksb-susp-appeal-link:hover { color: #f87171; border-color: rgba(248,113,113,0.45); }
.ksb-susp-browse-btn {
  padding: 11px; background: rgba(255,248,231,0.04);
  border: 1px solid rgba(255,248,231,0.08); border-radius: 12px;
  color: rgba(255,248,231,0.35); font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all 0.18s;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.ksb-susp-browse-btn:hover { color: rgba(255,248,231,0.6); border-color: rgba(255,248,231,0.15); }
.ksb-susp-footer-note {
  font-size: 11px; color: rgba(255,248,231,0.2); margin: 0;
}

/* ─── BANNED OVERLAY ────────────────────────────────────────────────── */
.ksb-banned-overlay {
  position: fixed; inset: 0; z-index: 9500;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(127,29,29,0.6) 0%, rgba(0,0,0,0.94) 70%),
              rgba(5,0,0,0.96);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  animation: ksbFadeIn 0.3s ease;
}
.ksb-banned-card {
  position: relative; width: 100%; max-width: 460px;
  background: linear-gradient(135deg, #1a0000 0%, #0d0000 100%);
  border: 1px solid rgba(255,36,36,0.2);
  border-radius: 26px; padding: 44px 28px 32px;
  text-align: center;
  box-shadow:
    0 40px 100px rgba(0,0,0,0.9),
    0 0 80px rgba(255,36,36,0.08),
    inset 0 1px 0 rgba(255,36,36,0.1);
  display: flex; flex-direction: column; align-items: center; gap: 18px;
}
.ksb-banned-minimise {
  position: absolute; top: 14px; right: 14px;
  width: 30px; height: 30px; border-radius: 9px;
  background: rgba(255,248,231,0.04); border: 1px solid rgba(255,248,231,0.1);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,248,231,0.3); cursor: pointer; transition: all 0.18s;
}
.ksb-banned-minimise:hover { color: #fff8e7; background: rgba(218,41,28,0.2); }
.ksb-banned-icon-ring {
  width: 90px; height: 90px; border-radius: 50%;
  background: rgba(255,36,36,0.08); border: 1px solid rgba(255,36,36,0.2);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 60px rgba(255,36,36,0.12);
}
.ksb-banned-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 34px; letter-spacing: 3px; color: #ff2424; margin: 0; line-height: 1;
  text-shadow: 0 0 30px rgba(255,36,36,0.4);
}
.ksb-banned-sub {
  font-size: 13px; color: rgba(255,248,231,0.38);
  max-width: 320px; line-height: 1.7; margin: 0;
}
.ksb-banned-reason {
  width: 100%; background: rgba(255,36,36,0.06);
  border: 1px solid rgba(255,36,36,0.15); border-radius: 14px; padding: 16px;
  text-align: left;
}
.ksb-banned-reason-head {
  font-size: 10px; font-weight: 900; color: rgba(255,36,36,0.6);
  text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px;
}
.ksb-banned-reason-body {
  font-size: 13px; color: rgba(255,248,231,0.5); line-height: 1.65; margin: 0;
}
.ksb-banned-locked-grid {
  display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
}
.ksb-banned-locked-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 10px; border-radius: 20px;
  background: rgba(255,36,36,0.07); border: 1px solid rgba(255,36,36,0.18);
  font-size: 10px; font-weight: 700; color: rgba(255,36,36,0.5);
}
.ksb-banned-actions { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.ksb-banned-call-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: #DA291C; color: #fff; border: none; border-radius: 14px;
  padding: 14px; font-size: 15px; font-weight: 900;
  text-decoration: none; transition: all 0.18s;
  box-shadow: 0 6px 24px rgba(218,41,28,0.4);
  font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px;
}
.ksb-banned-call-btn:hover { background: #b91c1c; }
.ksb-banned-appeal-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 12px; border: 1px solid rgba(255,36,36,0.2); border-radius: 12px;
  color: rgba(255,36,36,0.55); font-size: 13px; font-weight: 700;
  text-decoration: none; transition: all 0.18s;
}
.ksb-banned-appeal-btn:hover { color: #ff2424; border-color: rgba(255,36,36,0.4); }
.ksb-banned-policy { font-size: 11px; color: rgba(255,248,231,0.18); margin: 0; }
.ksb-banned-policy-link {
  color: rgba(255,248,231,0.25); text-decoration: none; transition: color 0.15s;
}
.ksb-banned-policy-link:hover { color: rgba(255,248,231,0.5); }
.ksb-banned-badge {
  position: fixed; bottom: 80px; right: 20px; z-index: 9500;
  display: flex; align-items: center; gap: 7px;
  background: rgba(127,0,0,0.9); border: 1px solid rgba(255,36,36,0.35);
  border-radius: 50px; padding: 8px 14px;
  color: rgba(255,100,100,0.85); font-size: 11px; font-weight: 800;
  cursor: pointer; transition: all 0.2s;
  font-family: 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  animation: ksbFadeIn 0.25s ease;
}
.ksb-banned-badge:hover { background: rgba(180,0,0,0.9); color: #ff8080; }

/* ─── FEATURE GATE ──────────────────────────────────────────────────── */
.kfg-wrap {
  position: relative; display: contents;
}
.kfg-children-inert {
  pointer-events: none; user-select: none; opacity: 0.38;
  filter: grayscale(0.3);
  display: contents;
}
.kfg-overlay {
  position: absolute; inset: 0; z-index: 10;
  border-radius: inherit;
  background: rgba(0,0,0,0.22);
  display: flex; align-items: center; justify-content: center;
  cursor: not-allowed;
  border: 1px solid rgba(var(--fg-accent, 251,191,36), 0.1);
  border-radius: 8px;
  transition: background 0.18s;
}
.kfg-overlay:hover {
  background: rgba(0,0,0,0.3);
}
.kfg-lock-icon {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(0,0,0,0.6); border: 1px solid var(--fg-accent, #fbbf24);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 12px rgba(0,0,0,0.4);
}
.kfg-tooltip {
  position: absolute; bottom: calc(100% + 8px); left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 5px;
  background: rgba(10,4,0,0.95); border: 1px solid rgba(255,199,44,0.2);
  border-radius: 8px; padding: 6px 10px;
  font-size: 11px; font-weight: 700; color: rgba(255,248,231,0.7);
  white-space: nowrap; pointer-events: none;
  box-shadow: 0 4px 14px rgba(0,0,0,0.6);
  animation: ksbFadeIn 0.15s ease;
  font-family: 'Plus Jakarta Sans', sans-serif;
  z-index: 100;
}
.kfg-tooltip::after {
  content: '';
  position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(10,4,0,0.95);
}

/* ─── SHARED ANIMATIONS ─────────────────────────────────────────────── */
@keyframes ksbSlideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
@keyframes ksbSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: none; }
}
@keyframes ksbFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;
