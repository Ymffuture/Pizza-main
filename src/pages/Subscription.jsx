// src/pages/Subscription.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, Zap, Mic, Paperclip, Palette, ShoppingBag, Bot,
  Pencil, Bell, Check, X, ArrowRight, Loader2, AlertTriangle,
  CreditCard, Clock, ShieldCheck,
} from "lucide-react";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useBilling } from "../context/BillingContext";
import { useToast } from "../components/Toast";
import { cancelSubscription } from "../api/billing.api";

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// What each plan actually means, in plain language — this is the page's
// whole purpose: explain the CURRENT plan, not sell the other one.
const FREE_EXPLAINER = [
  { Icon: Sparkles,   text: "20 KotaBot credits that refill every 3 hours — plenty for day-to-day questions, but the bot will ask you to wait once you run out." },
  { Icon: Mic,        text: "Voice notes are capped at 5 seconds — enough for a quick note, not a full sentence." },
  { Icon: ShoppingBag,text: "Cash on delivery works up to R150, card payments up to R250 — bigger orders need a call to place." },
  { Icon: Palette,    text: "You get the Fire 🔥 theme. The other 5 themes are visible in Settings but locked." },
  { Icon: X,          text: "File/image uploads in chat, comment editing, and like/reply notifications are ProBite-only." },
];

const PROBITE_EXPLAINER = [
  { Icon: Sparkles,   text: "Unlimited KotaBot chat — no credit counter, ever." },
  { Icon: Paperclip,  text: "Upload files and images directly in chat, plus access to advanced AI models (Coder, Reasoning, Thinking)." },
  { Icon: Mic,        text: "Voice notes up to 60 seconds." },
  { Icon: ShoppingBag,text: "Cash on delivery up to R2,000, card payments up to R3,000." },
  { Icon: Palette,    text: "All 6 app themes unlocked in Settings." },
  { Icon: Pencil,     text: "Edit your comments anytime, and get notified on likes & replies." },
];

export default function Subscription() {
  const navigate = useNavigate();
  const toast = useToast();
  const billing = useBilling();
  const {
    isProBite, isLoading, plan, billingCycle, subscriptionStatus,
    expiresAt, cancelAtPeriodEnd, credits, refresh,
  } = billing;

  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      await refresh();
      toast.show({
        type: "success",
        title: "Subscription set to cancel",
        message: "You'll keep ProBite until your current period ends, then move to Free automatically.",
      });
      setConfirmCancel(false);
    } catch (err) {
      toast.show({ type: "error", title: "Couldn't cancel", message: err?.response?.data?.detail || err.message });
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <style>{css}</style>
        <div className="sub-page sub-loading"><Loader2 className="w-7 h-7sub-spin" /></div>
      </>
    );
  }

  const explainer = isProBite ? PROBITE_EXPLAINER : FREE_EXPLAINER;

  return (
    <>
      <style>{css}</style>
      <div className="sub-page">
        <div className="sub-container">

          {/* Header */}
          <div className="sub-header">
            <div className={`sub-plan-icon${isProBite ? " sub-plan-icon-pro" : ""}`}>
              {isProBite ? <RiVerifiedBadgeFill style={{ width: 22, height: 22 }} /> : <Sparkles style={{ width: 20, height: 20 }} />}
            </div>
            <div>
              <p className="sub-eyebrow">Your current plan</p>
              <h1 className="sub-plan-name">{isProBite ? "ProBite 🔥" : "Free"}</h1>
            </div>
          </div>

          {/* Status card */}
          {isProBite ? (
            <div className="sub-card">
              <div className="sub-status-row">
                <span className="sub-status-label">Status</span>
                <span className="sub-status-value sub-status-active">{(subscriptionStatus || "active").toUpperCase()}</span>
              </div>
              <div className="sub-status-row">
                <span className="sub-status-label">Billing cycle</span>
                <span className="sub-status-value">{billingCycle === "yearly" ? "Yearly" : "Monthly"}</span>
              </div>
              <div className="sub-status-row">
                <span className="sub-status-label">{cancelAtPeriodEnd ? "Ends on" : "Renews on"}</span>
                <span className="sub-status-value">{formatDate(expiresAt)}</span>
              </div>
              {cancelAtPeriodEnd && (
                <div className="sub-notice">
                  <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span>Your subscription is set to cancel — you'll keep ProBite until {formatDate(expiresAt)}, then move to Free.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="sub-card">
              <div className="sub-status-row">
                <span className="sub-status-label">KotaBot credits</span>
                <span className="sub-status-value">
                  {credits?.unlimited ? "Unlimited" : `${credits?.credits ?? "—"} / ${credits?.creditsCap ?? "—"}`}
                </span>
              </div>
              {!credits?.unlimited && credits?.resetsAt && (
                <div className="sub-status-row">
                  <span className="sub-status-label">Next refill</span>
                  <span className="sub-status-value">{formatDate(credits.resetsAt)}</span>
                </div>
              )}
              <div className="sub-status-row">
                <span className="sub-status-label">Payment limits</span>
                <span className="sub-status-value">Cash R150 · Card R250</span>
              </div>
            </div>
          )}

          {/* What this plan means */}
          <section className="sub-section">
            <h2 className="sub-section-title">What {isProBite ? "ProBite" : "Free"} means</h2>
            <div className="sub-explainer-list">
              {explainer.map(({ Icon, text }, i) => (
                <div key={i} className="sub-explainer-row">
                  <Icon style={{ width: 15, height: 15 }} className="sub-explainer-icon" />
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="sub-cta-row">
            <button className="sub-cta-primary" onClick={() => navigate("/pricing")}>
              {isProBite ? "Compare plans" : "See what ProBite unlocks"}
              <ArrowRight style={{ width: 15, height: 15 }} />
            </button>

            {isProBite && !cancelAtPeriodEnd && (
              confirmCancel ? (
                <div className="sub-confirm-row">
                  <span>Cancel ProBite? You'll keep it until {formatDate(expiresAt)}.</span>
                  <button className="sub-cta-danger" onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? <Loader2 className="w-3.5 h-3.5 sub-spin" /> : "Yes, cancel"}
                  </button>
                  <button className="sub-cta-ghost" onClick={() => setConfirmCancel(false)}>Never mind</button>
                </div>
              ) : (
                <button className="sub-cta-ghost" onClick={() => setConfirmCancel(true)}>
                  Cancel subscription
                </button>
              )
            )}
          </div>

        </div>
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .sub-page { min-height:100vh; background:var(--background,#04111A); font-family:'Plus Jakarta Sans',sans-serif; padding:40px 16px 80px; }
  .sub-loading { display:flex; align-items:center; justify-content:center; color:var(--gold,#06B6D4); }
  .sub-spin { animation:subSpin 0.8s linear infinite; }
  @keyframes subSpin { to { transform:rotate(360deg); } }

  .sub-container { max-width:600px; margin:0 auto; }

  .sub-header { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
  .sub-plan-icon {
    width:48px; height:48px; border-radius:14px; flex-shrink:0;
    background:rgba(248,245,238,0.06); color:var(--text,#F8F5EE);
    display:flex; align-items:center; justify-content:center;
  }
  .sub-plan-icon-pro { background:rgba(6,182,212,0.12); color:var(--gold,#06B6D4); }
  .sub-eyebrow { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted,rgba(248,245,238,0.45)); margin:0; }
  .sub-plan-name { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:1.5px; color:var(--text,#F8F5EE); margin:2px 0 0; }

  .sub-card {
    background:var(--card,#071C26); border:1px solid rgba(248,245,238,0.06);
    border-radius:16px; padding:16px 18px; margin-bottom:24px;
    box-shadow:0 1px 3px rgba(0,0,0,0.15);
  }
  .sub-status-row { display:flex; align-items:center; justify-content:space-between; padding:7px 0; }
  .sub-status-row + .sub-status-row { border-top:1px solid rgba(248,245,238,0.05); }
  .sub-status-label { font-size:12.5px; color:var(--muted,rgba(248,245,238,0.5)); font-weight:600; }
  .sub-status-value { font-size:13px; color:var(--text,#F8F5EE); font-weight:700; }
  .sub-status-active { color:#4ade80; }

  .sub-notice {
    display:flex; align-items:flex-start; gap:8px; margin-top:12px;
    background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.25);
    color:#fbbf24; font-size:12px; font-weight:500; line-height:1.5;
    padding:10px 12px; border-radius:10px;
  }

  .sub-section { margin-bottom:28px; }
  .sub-section-title { font-size:13px; font-weight:700; color:var(--text,#F8F5EE); margin:0 0 12px; }
  .sub-explainer-list { display:flex; flex-direction:column; gap:12px; }
  .sub-explainer-row { display:flex; align-items:flex-start; gap:10px; }
  .sub-explainer-icon { color:var(--gold,#06B6D4); opacity:0.8; margin-top:2px; flex-shrink:0; }
  .sub-explainer-row p { font-size:13px; color:var(--muted,rgba(248,245,238,0.6)); line-height:1.55; margin:0; }

  .sub-cta-row { display:flex; flex-direction:column; gap:10px; align-items:flex-start; }
  .sub-cta-primary {
    display:flex; align-items:center; gap:8px;
    background:var(--text,#F8F5EE); color:#04111A; border:none; border-radius:50px;
    padding:12px 20px; font-size:13.5px; font-weight:700; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.15s;
  }
  .sub-cta-primary:hover { filter:brightness(0.92); }
  .sub-cta-ghost {
    background:none; border:1px solid rgba(248,245,238,0.12); color:var(--muted,rgba(248,245,238,0.55));
    border-radius:50px; padding:9px 16px; font-size:12.5px; font-weight:600; cursor:pointer;
  }
  .sub-cta-ghost:hover { color:var(--text,#F8F5EE); border-color:rgba(248,245,238,0.25); }
  .sub-cta-danger {
    background:rgba(248,113,113,0.12); border:1px solid rgba(248,113,113,0.3); color:#f87171;
    border-radius:50px; padding:7px 14px; font-size:12px; font-weight:700; cursor:pointer;
  }
  .sub-cta-danger:hover:not(:disabled) { background:rgba(248,113,113,0.2); }
  .sub-confirm-row {
    display:flex; align-items:center; gap:10px; flex-wrap:wrap;
    font-size:12px; color:var(--muted,rgba(248,245,238,0.6));
    background:rgba(248,245,238,0.03); border:1px solid rgba(248,245,238,0.07);
    padding:10px 14px; border-radius:12px;
  }
`;
