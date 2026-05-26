import { useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { forgotPassword } from "../api/auth.api";
import {
  Flame, Mail, ArrowLeft, Send, Loader,
  CheckCircle2, ShieldCheck, Lock, KeyRound,
  AlertTriangle, Eye, Clock, Smartphone,
} from "lucide-react";

const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_RESET_TEMPLATE_ID;
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const APP_URL      = import.meta.env.VITE_APP_URL || "https://foodsorder.vercel.app";

/* ── Steps config ── */
const STEPS = [
  { id: 1, label: "Enter email",   Icon: Mail      },
  { id: 2, label: "Check inbox",   Icon: Eye       },
  { id: 3, label: "Reset password",Icon: KeyRound  },
];

/* ── Security tips shown on the done screen ── */
const TIPS = [
  { Icon: Clock,      text: "Link expires in 30 minutes" },
  { Icon: ShieldCheck,text: "One-time use — link invalidates after reset" },
  { Icon: Smartphone, text: "Check spam if you don't see it in 2 minutes" },
  { Icon: AlertTriangle, text: "Never share this link with anyone" },
];

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");
  const [step,    setStep]    = useState(1); // 1 = enter email, 2 = success

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await forgotPassword(email.trim());
      if (res.data.token) {
        const resetLink = `${APP_URL}/reset-password?token=${res.data.token}`;
        await emailjs.send(
          EJS_SERVICE,
          EJS_TEMPLATE,
          {
            to_email:   res.data.email,
            to_name:    res.data.full_name,
            reset_link: resetLink,
          },
          EJS_KEY,
        );
      }
      setStep(2);
      setDone(true);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message ||
        "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* mask email for display: j***@gmail.com */
  const maskedEmail = (() => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
  })();

  return (
    <div className="fp-root">
      <style>{styles}</style>

      <div className="fp-card">

        {/* ── Top loading bar ── */}
        <div className="fp-topbar">
          {loading && (
            <>
              <div className="fp-topbar-fill" />
              <div className="fp-topbar-shimmer" />
            </>
          )}
        </div>

        {/* ── Brand ── */}
        <div className="fp-brand">
          <div className="fp-flame">
            <Flame size={20} color="#0e0700" strokeWidth={2.5} />
          </div>
          <span className="fp-wordmark">KOTABITES</span>
        </div>

        {/* ── Step progress ── */}
        <div className="fp-steps">
          {STEPS.map((s, i) => {
            const completed = s.id < step;
            const active    = s.id === step;
            const SIcon     = s.Icon;
            return (
              <div key={s.id} className="fp-step-wrap">
                {/* connector line */}
                {i > 0 && (
                  <div className={`fp-connector${completed || (s.id <= step) ? " fp-connector-done" : ""}`} />
                )}
                <div className="fp-step">
                  <div className={`fp-step-dot${completed ? " fp-step-completed" : active ? " fp-step-active" : ""}`}>
                    {completed
                      ? <CheckCircle2 size={14} />
                      : <SIcon size={13} />}
                  </div>
                  <span className={`fp-step-label${active ? " fp-step-label-active" : completed ? " fp-step-label-done" : ""}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Content ── */}
        {!done ? (
          /* ── STEP 1: Enter email ── */
          <div className="fp-content">
            {/* Hero icon */}
            <div className="fp-hero-icon">
              <div className="fp-hero-ring fp-hero-ring-1" />
              <div className="fp-hero-ring fp-hero-ring-2" />
              <div className="fp-hero-icon-inner">
                <Lock size={28} color="#FFC72C" />
              </div>
            </div>

            <div className="fp-heading">
              <h2 className="fp-title">Forgot your password?</h2>
              <p className="fp-sub">No worries — we'll send a secure reset link to your email address.</p>
            </div>

            {/* Security assurance strip */}
            <div className="fp-security-strip">
              <ShieldCheck size={13} color="#4ade80" />
              <span>Encrypted · one-time link · expires in 30 min</span>
            </div>

            <form onSubmit={handleSubmit} className="fp-form">
              <div className="fp-field">
                <label className="fp-label">Email address</label>
                <div className={`fp-input-wrap${error ? " fp-input-err" : ""}`}>
                  <Mail size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  <input
                    type="email"
                    className="fp-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    autoFocus
                    disabled={loading}
                  />
                  {email && !error && (
                    <CheckCircle2 size={15} style={{ color: "#4ade80", flexShrink: 0 }} />
                  )}
                </div>
                {error && (
                  <div className="fp-error-row">
                    <AlertTriangle size={12} style={{ color: "#f87171", flexShrink: 0 }} />
                    <p className="fp-error">{error}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="fp-submit"
              >
                {loading ? (
                  <><Loader size={17} className="fp-spin" /> Sending secure link…</>
                ) : (
                  <><Send size={16} /> Send Reset Link</>
                )}
              </button>
            </form>

            {/* What happens next */}
            <div className="fp-what-next">
              <p className="fp-what-title">What happens next?</p>
              <div className="fp-what-steps">
                {[
                  { n: "01", text: "We verify your email exists in our system" },
                  { n: "02", text: "A one-time secure link is sent to your inbox" },
                  { n: "03", text: "Click the link to set your new password" },
                ].map(({ n, text }) => (
                  <div key={n} className="fp-what-row">
                    <span className="fp-what-num">{n}</span>
                    <span className="fp-what-text">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/login" className="fp-back">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>

        ) : (
          /* ── STEP 2: Done / check inbox ── */
          <div className="fp-content">
            {/* Animated envelope */}
            <div className="fp-envelope-wrap">
              <div className="fp-envelope-glow" />
              <div className="fp-envelope">
                <Mail size={36} color="#FFC72C" />
                <div className="fp-envelope-dot" />
              </div>
            </div>

            <div className="fp-heading">
              <h2 className="fp-title">Check your inbox</h2>
              <p className="fp-sub">
                We sent a reset link to{" "}
                <span className="fp-email-badge">{maskedEmail}</span>
              </p>
            </div>

            {/* Security tips grid */}
            <div className="fp-tips-grid">
              {TIPS.map(({ Icon: TIcon, text }) => (
                <div key={text} className="fp-tip">
                  <TIcon size={14} style={{ color: "#FFC72C", flexShrink: 0, marginTop: 1 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Redirect progress */}
            <div className="fp-redirect-wrap">
              <div className="fp-redirect-label">
                <CheckCircle2 size={13} color="#4ade80" />
                <span>Email dispatched successfully</span>
              </div>
              <div className="fp-redirect-bar">
                <div className="fp-redirect-fill" />
              </div>
            </div>

            <div className="fp-done-actions">
              <Link to="/login" className="fp-back fp-back-gold">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
              <button
                className="fp-resend-btn"
                onClick={() => { setDone(false); setStep(1); }}
              >
                Try different email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --red:    #DA291C;
    --red2:   #b91c1c;
    --gold:   #FFC72C;
    --dark:   #0e0700;
    --card:   #1a0e00;
    --border: rgba(255,199,44,0.12);
    --text:   #fff8e7;
    --muted:  rgba(255,248,231,0.42);
    --input:  rgba(255,248,231,0.05);
  }

  /* ── Root ── */
  .fp-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 90% 55% at 50% -10%, rgba(218,41,28,0.18) 0%, transparent 58%),
      radial-gradient(ellipse 60% 40% at 80% 90%,  rgba(255,199,44,0.07) 0%, transparent 55%),
      var(--dark);
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  /* ── Card ── */
  .fp-card {
    width: 100%; max-width: 420px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 28px;
    box-shadow:
      0 32px 80px rgba(0,0,0,0.65),
      0 0 0 1px rgba(255,199,44,0.05),
      inset 0 1px 0 rgba(255,248,231,0.04);
    overflow: hidden;
    position: relative;
  }

  /* ── Top loading bar ── */
  .fp-topbar {
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    background: rgba(255,199,44,0.08);
    z-index: 10; overflow: hidden;
    border-radius: 28px 28px 0 0;
  }
  .fp-topbar-fill {
    position: absolute; top: 0; left: 0;
    height: 100%; width: 45%;
    background: linear-gradient(90deg, var(--red), var(--gold));
    animation: fpBarBounce 1.6s cubic-bezier(0.4,0,0.6,1) infinite;
  }
  .fp-topbar-shimmer {
    position: absolute; top: 0; left: -60%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
    animation: fpShimmer 1.3s ease infinite;
  }
  @keyframes fpBarBounce {
    0%   { left: -50%; width: 45%; }
    50%  { left: 55%;  width: 45%; }
    100% { left: -50%; width: 45%; }
  }
  @keyframes fpShimmer {
    0%   { left: -60%; }
    100% { left: 120%; }
  }

  /* ── Brand ── */
  .fp-brand {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 36px 32px 0;
  }
  .fp-flame {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--gold); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(255,199,44,0.3);
  }
  .fp-wordmark {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px; letter-spacing: 4px; color: var(--text); line-height: 1;
  }

  /* ── Step progress ── */
  .fp-steps {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 24px 32px 0;
    gap: 0;
    position: relative;
  }
  .fp-step-wrap {
    display: flex;
    align-items: flex-start;
    flex: 1;
    position: relative;
  }
  .fp-connector {
    position: absolute;
    top: 17px;
    left: calc(-50% + 17px);
    right: calc(50% + 17px);
    height: 2px;
    background: rgba(255,248,231,0.08);
    border-radius: 2px;
    transition: background 0.4s;
  }
  .fp-connector-done { background: rgba(255,199,44,0.35); }

  .fp-step {
    display: flex; flex-direction: column; align-items: center; gap: 7px;
    flex: 1; z-index: 1;
  }
  .fp-step-dot {
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(255,248,231,0.04);
    border: 2px solid rgba(255,248,231,0.1);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,248,231,0.25);
    transition: all 0.35s cubic-bezier(0.34,1.2,0.64,1);
  }
  .fp-step-active {
    background: rgba(255,199,44,0.12);
    border-color: rgba(255,199,44,0.55);
    color: var(--gold);
    box-shadow: 0 0 14px rgba(255,199,44,0.25);
    animation: fpStepPulse 2s ease infinite;
  }
  .fp-step-completed {
    background: rgba(74,222,128,0.15);
    border-color: #4ade80;
    color: #4ade80;
    box-shadow: 0 0 12px rgba(74,222,128,0.2);
  }
  @keyframes fpStepPulse {
    0%,100% { box-shadow: 0 0 14px rgba(255,199,44,0.25); }
    50%      { box-shadow: 0 0 22px rgba(255,199,44,0.45); }
  }
  .fp-step-label {
    font-size: 10px; font-weight: 700;
    color: rgba(255,248,231,0.22);
    text-align: center; line-height: 1.3;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .fp-step-label-active { color: var(--gold); font-weight: 800; }
  .fp-step-label-done   { color: #4ade80; }

  /* ── Content wrapper ── */
  .fp-content {
    padding: 24px 32px 32px;
    display: flex; flex-direction: column; gap: 20px;
    animation: fpFadeUp 0.35s ease;
  }
  @keyframes fpFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: none; }
  }

  /* ── Hero lock icon ── */
  .fp-hero-icon {
    position: relative;
    width: 80px; height: 80px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 4px;
  }
  .fp-hero-ring {
    position: absolute; border-radius: 50%;
    border: 1px solid rgba(255,199,44,0.15);
  }
  .fp-hero-ring-1 { inset: 0; animation: fpRingPulse 2.5s ease infinite; }
  .fp-hero-ring-2 { inset: -12px; animation: fpRingPulse 2.5s ease 0.5s infinite; }
  @keyframes fpRingPulse {
    0%,100% { opacity: 0.4; transform: scale(1); }
    50%     { opacity: 0.8; transform: scale(1.05); }
  }
  .fp-hero-icon-inner {
    width: 64px; height: 64px; border-radius: 20px;
    background: linear-gradient(135deg, rgba(255,199,44,0.15) 0%, rgba(218,41,28,0.08) 100%);
    border: 1px solid rgba(255,199,44,0.3);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 28px rgba(255,199,44,0.15), inset 0 1px 0 rgba(255,248,231,0.08);
    position: relative; z-index: 1;
  }

  /* ── Heading ── */
  .fp-heading { text-align: center; }
  .fp-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px; letter-spacing: 2px;
    color: var(--text); line-height: 1; margin: 0 0 8px;
  }
  .fp-sub { font-size: 13px; color: var(--muted); line-height: 1.6; margin: 0; }
  .fp-email-badge {
    display: inline-block;
    background: rgba(255,199,44,0.12);
    border: 1px solid rgba(255,199,44,0.25);
    color: var(--gold);
    font-weight: 800; font-size: 13px;
    padding: 2px 10px; border-radius: 6px;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.04em;
  }

  /* ── Security strip ── */
  .fp-security-strip {
    display: flex; align-items: center; gap: 8px;
    background: rgba(74,222,128,0.06);
    border: 1px solid rgba(74,222,128,0.18);
    border-radius: 10px; padding: 9px 14px;
    font-size: 11px; font-weight: 700;
    color: rgba(74,222,128,0.8);
    letter-spacing: 0.02em;
  }

  /* ── Form ── */
  .fp-form { display: flex; flex-direction: column; gap: 14px; }
  .fp-field { display: flex; flex-direction: column; gap: 6px; }
  .fp-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
  }
  .fp-input-wrap {
    display: flex; align-items: center; gap: 10px;
    background: var(--input); border: 1.5px solid var(--border);
    border-radius: 12px; padding: 0 14px;
    transition: border-color 0.2s, background 0.2s;
  }
  .fp-input-wrap:focus-within {
    border-color: rgba(255,199,44,0.45);
    background: rgba(255,248,231,0.07);
  }
  .fp-input-err { border-color: rgba(218,41,28,0.55) !important; background: rgba(218,41,28,0.04) !important; }
  .fp-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif; padding: 13px 0;
  }
  .fp-input::placeholder { color: var(--muted); }
  .fp-error-row { display: flex; align-items: center; gap: 6px; }
  .fp-error { font-size: 11px; font-weight: 700; color: #f87171; margin: 0; }

  /* ── Submit ── */
  .fp-submit {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 15px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900; font-size: 15px; border-radius: 14px;
    box-shadow: 0 6px 24px rgba(218,41,28,0.4);
    transition: all 0.2s;
  }
  .fp-submit:hover:not(:disabled) { background: var(--red2); transform: scale(1.02); box-shadow: 0 8px 28px rgba(218,41,28,0.5); }
  .fp-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  @keyframes fpSpin { to { transform: rotate(360deg); } }
  .fp-spin { animation: fpSpin 0.8s linear infinite; }

  /* ── What happens next ── */
  .fp-what-next {
    background: rgba(255,248,231,0.02);
    border: 1px solid rgba(255,248,231,0.06);
    border-radius: 14px; padding: 16px;
  }
  .fp-what-title {
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    margin: 0 0 12px;
  }
  .fp-what-steps { display: flex; flex-direction: column; gap: 10px; }
  .fp-what-row { display: flex; align-items: flex-start; gap: 12px; }
  .fp-what-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 1px;
    color: rgba(255,199,44,0.25); line-height: 1;
    flex-shrink: 0; width: 26px;
  }
  .fp-what-text { font-size: 12px; color: var(--muted); line-height: 1.55; padding-top: 2px; }

  /* ── Back link ── */
  .fp-back {
    display: inline-flex; align-items: center; gap: 6px;
    color: rgba(255,248,231,0.35); font-size: 13px; font-weight: 700;
    text-decoration: none; transition: color 0.2s;
    justify-content: center;
  }
  .fp-back:hover { color: var(--text); }
  .fp-back-gold { color: var(--gold) !important; }
  .fp-back-gold:hover { opacity: 0.8; }

  /* ── Success: envelope ── */
  .fp-envelope-wrap {
    position: relative; width: 90px; height: 90px;
    margin: 0 auto 4px;
    display: flex; align-items: center; justify-content: center;
  }
  .fp-envelope-glow {
    position: absolute; inset: -10px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,199,44,0.18) 0%, transparent 70%);
    animation: fpGlowPulse 2s ease infinite;
  }
  @keyframes fpGlowPulse {
    0%,100% { opacity: 0.6; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.1); }
  }
  .fp-envelope {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, rgba(255,199,44,0.15) 0%, rgba(218,41,28,0.1) 100%);
    border: 1px solid rgba(255,199,44,0.3);
    display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 1;
    animation: fpEnvelopeBounce 1s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 8px 32px rgba(255,199,44,0.15);
  }
  @keyframes fpEnvelopeBounce {
    from { opacity: 0; transform: scale(0.7) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .fp-envelope-dot {
    position: absolute; top: 10px; right: 10px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #4ade80;
    border: 2px solid var(--card);
    box-shadow: 0 0 8px rgba(74,222,128,0.7);
    animation: fpDotPulse 1.2s ease infinite;
  }
  @keyframes fpDotPulse {
    0%,100% { transform: scale(1); opacity: 1; }
    50%     { transform: scale(1.3); opacity: 0.7; }
  }

  /* ── Security tips grid ── */
  .fp-tips-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .fp-tip {
    display: flex; align-items: flex-start; gap: 8px;
    background: rgba(255,199,44,0.04);
    border: 1px solid rgba(255,199,44,0.1);
    border-radius: 10px; padding: 10px 11px;
    font-size: 11px; font-weight: 600;
    color: var(--muted); line-height: 1.45;
  }

  /* ── Redirect bar ── */
  .fp-redirect-wrap { display: flex; flex-direction: column; gap: 8px; }
  .fp-redirect-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; color: rgba(74,222,128,0.7);
  }
  .fp-redirect-bar {
    height: 3px; border-radius: 999px;
    background: rgba(74,222,128,0.1); overflow: hidden;
  }
  .fp-redirect-fill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #4ade80, var(--gold));
    animation: fpRedirectFill 3s ease-out forwards;
  }
  @keyframes fpRedirectFill {
    from { width: 0%; }
    to   { width: 100%; }
  }

  /* ── Done actions ── */
  .fp-done-actions {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
  }
  .fp-resend-btn {
    background: none; border: none; cursor: pointer;
    font-size: 12px; font-weight: 700;
    color: rgba(255,248,231,0.3);
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: color 0.2s;
  }
  .fp-resend-btn:hover { color: var(--muted); }

  @media (max-width: 480px) {
    .fp-content   { padding: 20px 22px 28px; }
    .fp-brand     { padding: 32px 22px 0; }
    .fp-steps     { padding: 20px 22px 0; }
    .fp-tips-grid { grid-template-columns: 1fr; }
    .fp-step-label { font-size: 9px; }
  }
`;
