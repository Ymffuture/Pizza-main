// src/pages/Pricing.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Flame, Check, X, Sparkles, MessageCircle, Pencil, Bell,
  Loader2, ArrowRight, ShieldCheck, Mic, Paperclip, Minimize2,
  Zap, CreditCard, ShoppingBag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBilling } from "../context/BillingContext";
import { useToast } from "../components/Toast";
import {
  getPlans, subscribe, verifySubscription, cancelSubscription,
} from "../api/billing.api";

export default function Pricing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAuth } = useAuth();
  const toast = useToast();
  const {
    isProBite, expiresAt, cancelAtPeriodEnd, credits, refresh,
  } = useBilling();

  const [cycle, setCycle]             = useState("monthly");
  const [plans, setPlans]             = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [cancelling, setCancelling]   = useState(false);

  useEffect(() => {
    getPlans()
      .then(({ data }) => setPlans(data.plans))
      .catch(() => setPlans(null));
  }, []);

  const reference = params.get("reference");
  useEffect(() => {
    if (!reference || !isAuth) return;
    setVerifying(true);
    verifySubscription(reference)
      .then(({ data }) => {
        setVerifyResult(data);
        if (data.status) {
          refresh();
          toast.show({ type: "success", title: "Welcome to ProBite! 🎉", message: "Unlimited KotaBot chat is live on your account." });
        } else {
          toast.show({ type: "error", title: "Payment not confirmed", message: data.message || "Please try again." });
        }
      })
      .catch(() => {
        toast.show({ type: "error", title: "Couldn't verify payment", message: "Refresh the page or contact support if you were charged." });
      })
      .finally(() => setVerifying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, isAuth]);

  const handleSubscribe = useCallback(async () => {
    if (!isAuth) { navigate("/login?redirect=/pricing"); return; }
    setSubscribing(true);
    try {
      const { data } = await subscribe(cycle);
      window.location.href = data.authorization_url;
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.show({ type: "error", title: "Couldn't start checkout", message: typeof detail === "string" ? detail : "Please try again in a moment." });
      setSubscribing(false);
    }
  }, [cycle, isAuth, navigate, toast]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const { data } = await cancelSubscription();
      await refresh();
      toast.show({ type: "info", title: "Renewal cancelled", message: data.message });
    } catch {
      toast.show({ type: "error", title: "Couldn't cancel", message: "Please try again or contact support." });
    } finally {
      setCancelling(false);
    }
  }, [refresh, toast]);

  const free   = plans?.find((p) => p.id === "free");
  const probite = plans?.find((p) => p.id === "probite");
  const price  = probite ? (cycle === "monthly" ? probite.price_monthly : probite.price_yearly) : null;
  const fmtPrice = (n) => (n == null ? "—" : Number(n).toFixed(2));
  const monthlyEquiv = probite && cycle === "yearly" ? fmtPrice(probite.price_yearly / 12) : null;

  return (
    <div className="pr-root">
      <style>{styles}</style>
      <div className="pr-bg-glow" />

      <div className="pr-wrap">

        {/* Brand */}
        <div className="pr-brand">
          <div className="pr-brand-badge">
            <Flame className="w-5 h-5" style={{ color: "#0e0700" }} />
          </div>
          <span className="pr-brand-name">KOTABITES</span>
        </div>

        <h1 className="pr-title">Simple pricing, unlimited bites</h1>
        <p className="pr-sub">
          Free gets you a generous taste of KotaBot. ProBite removes every limit.
        </p>

        {/* Payment verification banners */}
        {verifying && (
          <div className="pr-verify-banner pr-verify-loading">
            <Loader2 className="w-4 h-4 animate-spin" /> Confirming your payment…
          </div>
        )}
        {!verifying && verifyResult && (
          <div className={`pr-verify-banner ${verifyResult.status ? "pr-verify-ok" : "pr-verify-fail"}`}>
            {verifyResult.status ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {verifyResult.status ? "Welcome to ProBite — you're all set." : (verifyResult.message || "Payment not successful.")}
          </div>
        )}

        {/* Monthly / Yearly toggle */}
        <div className="pr-toggle">
          <button className={`pr-toggle-btn ${cycle === "monthly" ? "pr-toggle-active" : ""}`} onClick={() => setCycle("monthly")}>
            Monthly
          </button>
          <button className={`pr-toggle-btn ${cycle === "yearly" ? "pr-toggle-active" : ""}`} onClick={() => setCycle("yearly")}>
            Yearly
            <span className="pr-toggle-badge">save</span>
          </button>
        </div>

        {/* ── Plan cards ── */}
        <div className="pr-cards">

          {/* FREE */}
          <div className="pr-card">
            <div className="pr-card-head">
              <span className="pr-card-name">Free</span>
              <div className="pr-card-price">
                {plans ? (
                  <><span className="pr-price-amount">R0</span><span className="pr-price-period">/forever</span></>
                ) : (
                  <div className="pr-skeleton-price">
                    <span className="pr-skeleton-text pr-skeleton-text-lg" />
                    <span className="pr-skeleton-text pr-skeleton-text-sm" />
                  </div>
                )}
              </div>
            </div>

            <ul className="pr-features">
              {plans ? (
                <>
                  {/* KotaBot credits */}
                  <li>
                    <Sparkles className="w-4 h-4 pr-feat-icon" />
                    <span>{free?.features?.[0] ?? "100 KotaBot credits, refilling every 3 hours"}</span>
                  </li>
                  {/* AI typing speed */}
                  <li>
                    <Zap className="w-4 h-4 pr-feat-icon" />
                    <span>Standard AI response speed</span>
                  </li>
                  {/* Voice recording */}
                  <li>
                    <Mic className="w-4 h-4 pr-feat-icon" />
                    <span>Voice notes up to <strong>5 seconds</strong></span>
                  </li>
                  {/* File upload — ProBite only */}
                  <li className="pr-feat-muted">
                    <X className="w-4 h-4 pr-feat-icon-off" />
                    <span>File &amp; image uploads in chat</span>
                  </li>
                  {/* Minimize — ProBite only */}
                  <li className="pr-feat-muted">
                    <X className="w-4 h-4 pr-feat-icon-off" />
                    <span>Minimisable chat widget</span>
                  </li>
                  {/* Order thresholds */}
                  <li>
                    <ShoppingBag className="w-4 h-4 pr-feat-icon" />
                    <span>Order online — minimum R250 card / R150 cash</span>
                  </li>
                  {/* Social */}
                  <li>
                    <MessageCircle className="w-4 h-4 pr-feat-icon" />
                    <span>{free?.features?.[1] ?? "Like & comment on menu items"}</span>
                  </li>
                  {/* Extra features from backend list */}
                  {free?.features?.slice(2).map((f) => (
                    <li key={f}>
                      <Check className="w-4 h-4 pr-feat-icon" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {/* ProBite-only — shown greyed */}
                  <li className="pr-feat-muted">
                    <X className="w-4 h-4 pr-feat-icon-off" />
                    <span>Edit your comments</span>
                  </li>
                  <li className="pr-feat-muted">
                    <X className="w-4 h-4 pr-feat-icon-off" />
                    <span>Like / comment notifications</span>
                  </li>
                </>
              ) : (
                [1,2,3,4,5,6].map((n) => <li key={n}><span className="pr-skeleton-line" /></li>)
              )}
            </ul>

            <button className="pr-cta pr-cta-ghost" disabled>
              {isProBite ? "Included" : "Your current plan"}
            </button>
          </div>

          {/* PROBITE */}
          <div className="pr-card pr-card-highlight">
            <div className="pr-card-ribbon"><Sparkles className="w-3 h-3" /> Most popular</div>

            <div className="pr-card-head">
              <span className="pr-card-name pr-card-name-gold">ProBite</span>
              <div className="pr-card-price">
                {plans ? (
                  <><span className="pr-price-amount">R{fmtPrice(price)}</span><span className="pr-price-period">/{cycle === "monthly" ? "mo" : "yr"}</span></>
                ) : (
                  <div className="pr-skeleton-price">
                    <span className="pr-skeleton-text pr-skeleton-text-lg" />
                    <span className="pr-skeleton-text pr-skeleton-text-sm" />
                  </div>
                )}
              </div>
              {monthlyEquiv && <span className="pr-price-note">≈ R{monthlyEquiv}/mo billed yearly</span>}
            </div>

            <ul className="pr-features">
              {plans ? (
                <>
                  {/* Unlimited chat */}
                  <li>
                    <MessageCircle className="w-4 h-4 pr-feat-icon-gold" />
                    <span><strong>Unlimited</strong> KotaBot chat — no credits, no waiting</span>
                  </li>
                  {/* 2× AI speed */}
                  <li>
                    <Zap className="w-4 h-4 pr-feat-icon-gold" />
                    <span><strong>2× faster</strong> AI response typing speed</span>
                  </li>
                  {/* Voice recording */}
                  <li>
                    <Mic className="w-4 h-4 pr-feat-icon-gold" />
                    <span>Voice notes up to <strong>60 seconds</strong></span>
                  </li>
                  {/* File upload */}
                  <li>
                    <Paperclip className="w-4 h-4 pr-feat-icon-gold" />
                    <span>File &amp; image uploads in chat</span>
                  </li>
                  {/* Minimize */}
                  <li>
                    <Minimize2 className="w-4 h-4 pr-feat-icon-gold" />
                    <span>Minimisable KotaBot chat widget</span>
                  </li>
                  {/* Order thresholds */}
                  <li>
                    <ShoppingBag className="w-4 h-4 pr-feat-icon-gold" />
                    <span>Order online — over R250 card / R150 cash</span>
                  </li>
                  {/* Edit comments */}
                  <li>
                    <Pencil className="w-4 h-4 pr-feat-icon-gold" />
                    <span>Edit your comments anytime</span>
                  </li>
                  {/* Notifications */}
                  <li>
                    <Bell className="w-4 h-4 pr-feat-icon-gold" />
                    <span>Get notified on likes &amp; comment replies</span>
                  </li>
                  {/* Payment */}
                  <li>
                    <CreditCard className="w-4 h-4 pr-feat-icon-gold" />
                    <span>Secure card billing via Paystack — cancel anytime</span>
                  </li>
                  {/* Extra ProBite perks from backend */}
                  {(probite?.features?.slice(3) ?? []).map((f) => (
                    <li key={f}>
                      <Check className="w-4 h-4 pr-feat-icon-gold" />
                      <span>{f}</span>
                    </li>
                  ))}
                  <li>
                    <Check className="w-4 h-4 pr-feat-icon-gold" />
                    <span>Everything in Free</span>
                  </li>
                </>
              ) : (
                [1,2,3,4,5,6,7].map((n) => <li key={n}><span className="pr-skeleton-line" /></li>)
              )}
            </ul>

            {isProBite ? (
              <div className="pr-current-plan">
                <div className="pr-current-row">
                  <ShieldCheck className="w-4 h-4" style={{ color: "#4ade80" }} />
                  <span>
                    {cancelAtPeriodEnd ? "Ends" : "Renews"}{" "}
                    {expiresAt
                      ? new Date(expiresAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </span>
                </div>
                {!cancelAtPeriodEnd && (
                  <button className="pr-cancel-link" onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? "Cancelling…" : "Cancel renewal"}
                  </button>
                )}
              </div>
            ) : (
              <button
                className="pr-cta pr-cta-gold"
                onClick={handleSubscribe}
                disabled={subscribing || !plans}
              >
                {subscribing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>Go ProBite <ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>

        {/* Live credit balance */}
        {!isProBite && isAuth && (
          <p className="pr-credit-status">
            You currently have{" "}
            <strong>
              {credits.unlimited ? "unlimited" : `${credits.credits ?? "—"}/${credits.creditsCap ?? 100}`}
            </strong>{" "}
            KotaBot credits.
          </p>
        )}

        <Link to="/" className="pr-back-link">← Back to KotaBites</Link>
      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  :root {
    --red:#DA291C; --gold:#FFC72C; --dark:#0e0700; --card:#1a0e00;
    --border:rgba(255,199,44,0.12); --text:#fff8e7; --muted:rgba(255,248,231,0.42);
  }

  .pr-root {
    min-height: 100vh;
    background: var(--dark);
    position: relative;
    overflow-x: hidden;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding: 56px 16px 80px;
  }

  .pr-bg-glow {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,199,44,0.1) 0%, transparent 65%),
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(218,41,28,0.1) 0%, transparent 60%);
  }

  .pr-wrap { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; text-align: center; }

  .pr-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
  .pr-brand-badge { width: 32px; height: 32px; background: var(--gold); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(255,199,44,0.3); }
  .pr-brand-name { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 3px; }

  .pr-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(32px, 6vw, 48px); letter-spacing: 1px; line-height: 1.05; margin: 0 0 12px; }
  .pr-sub { font-size: 15px; color: var(--muted); max-width: 440px; line-height: 1.6; margin: 0 0 28px; }

  .pr-verify-banner { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 12px; margin-bottom: 22px; }
  .pr-verify-loading { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.3); color: #60a5fa; }
  .pr-verify-ok  { background: rgba(74,222,128,0.1);  border: 1px solid rgba(74,222,128,0.3);  color: #4ade80; }
  .pr-verify-fail { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; }

  .pr-toggle { display: inline-flex; background: rgba(255,248,231,0.05); border: 1px solid var(--border); border-radius: 999px; padding: 4px; margin-bottom: 36px; gap: 2px; }
  .pr-toggle-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: none; color: var(--muted); font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px; padding: 9px 20px; border-radius: 999px; cursor: pointer; transition: all 0.2s; }
  .pr-toggle-active { background: var(--gold); color: var(--dark); }
  .pr-toggle-badge { font-size: 9px; font-weight: 900; text-transform: uppercase; background: rgba(74,222,128,0.18); color: #4ade80; padding: 2px 6px; border-radius: 999px; letter-spacing: 0.04em; }
  .pr-toggle-active .pr-toggle-badge { background: rgba(14,7,0,0.18); color: #14532d; }

  .pr-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; width: 100%; margin-bottom: 28px; align-items: start; }
  @media (max-width: 680px) { .pr-cards { grid-template-columns: 1fr; } }

  .pr-card { position: relative; background: var(--card); border: 1px solid var(--border); border-radius: 22px; padding: 28px 24px; text-align: left; display: flex; flex-direction: column; }
  .pr-card-highlight { border-color: rgba(255,199,44,0.35); box-shadow: 0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,199,44,0.08); }

  .pr-card-ribbon { position: absolute; top: -13px; left: 24px; display: flex; align-items: center; gap: 5px; background: var(--gold); color: var(--dark); font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 999px; letter-spacing: 0.02em; }

  .pr-card-head { margin-bottom: 20px; }
  .pr-card-name { display: block; font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 1px; margin-bottom: 8px; }
  .pr-card-name-gold { color: var(--gold); }
  .pr-card-price { display: flex; align-items: baseline; gap: 4px; min-height: 48px; }
  .pr-price-amount { font-family: 'Bebas Neue', sans-serif; font-size: 38px; }
  .pr-price-period { font-size: 13px; color: var(--muted); font-weight: 600; }
  .pr-price-note { display: block; font-size: 11px; color: var(--muted); margin-top: 4px; }

  .pr-features { list-style: none; margin: 0 0 24px; padding: 0; display: flex; flex-direction: column; gap: 12px; flex: 1; }
  .pr-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; line-height: 1.5; }
  .pr-feat-icon     { color: #4ade80;                   margin-top: 1px; flex-shrink: 0; }
  .pr-feat-icon-gold{ color: var(--gold);               margin-top: 1px; flex-shrink: 0; }
  .pr-feat-icon-off { color: rgba(255,248,231,0.25);   margin-top: 1px; flex-shrink: 0; }
  .pr-feat-muted    { color: var(--muted); }

  .pr-cta { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 14px; padding: 14px; border-radius: 14px; transition: all 0.2s; }
  .pr-cta-gold  { background: var(--gold); color: var(--dark); box-shadow: 0 4px 20px rgba(255,199,44,0.25); }
  .pr-cta-gold:hover  { background: #ffd75c; transform: scale(1.02); }
  .pr-cta-gold:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .pr-cta-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); cursor: default; }

  .pr-current-plan { display: flex; flex-direction: column; gap: 10px; align-items: center; padding-top: 4px; }
  .pr-current-row  { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: var(--text); }
  .pr-cancel-link  { background: none; border: none; color: var(--muted); font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: underline; padding: 0; }
  .pr-cancel-link:hover { color: #f87171; }

  .pr-credit-status { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
  .pr-back-link { font-size: 13px; color: var(--muted); text-decoration: none; }
  .pr-back-link:hover { color: var(--text); }

  @keyframes pr-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .pr-skeleton-text, .pr-skeleton-line {
    display: inline-block;
    background: linear-gradient(90deg, rgba(255,248,231,0.06) 25%, rgba(255,248,231,0.12) 50%, rgba(255,248,231,0.06) 75%);
    background-size: 200% 100%;
    animation: pr-shimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
  }
  .pr-skeleton-text    { height: 14px; }
  .pr-skeleton-text-lg { width: 80px; height: 38px; border-radius: 8px; }
  .pr-skeleton-text-sm { width: 40px; height: 14px; }
  .pr-skeleton-line    { width: 100%; height: 14px; border-radius: 6px; }
  .pr-skeleton-price   { display: flex; align-items: baseline; gap: 8px; }
`;
