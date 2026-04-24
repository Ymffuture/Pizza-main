// src/pages/ResetPassword.jsx — DeepSeek layout · borderless · strength meter · KOTABITES
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/auth.api";
import { Flame, Eye, EyeOff, Loader, ShieldCheck } from "lucide-react";
import { BsCheckCircleFill, BsCircle, BsShieldLockFill } from "react-icons/bs";

/* ── Strength scorer ── */
const getStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)            s++;
  if (pw.length >= 10)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s;
};
const STRENGTH_LABEL = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#eab308", "#4ade80", "#22c55e"];

function Req({ met, text }) {
  return (
    <div className="ds-req">
      {met
        ? <BsCheckCircleFill size={11} color="#4ade80" />
        : <BsCircle         size={11} color="rgba(255,248,231,0.25)" />}
      <span style={{ color: met ? "rgba(255,248,231,0.7)" : "rgba(255,248,231,0.3)" }}>{text}</span>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const token    = new URLSearchParams(window.location.search).get("token");

  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [showCf,  setShowCf]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  const strength = getStrength(pw);
  const pwMatch  = confirm && confirm === pw;

  /* ── Invalid token ── */
  if (!token) {
    return (
      <div className="ds-root">
        <style>{styles}</style>
        <div className="ds-card" style={{ textAlign: "center" }}>
          <div className="ds-brand">
            <div className="ds-flame"><Flame size={22} color="#0e0700" strokeWidth={2.5} /></div>
            <span className="ds-wordmark">KOTABITES</span>
          </div>
          <div className="ds-state-icon" style={{ background: "rgba(218,41,28,0.1)" }}>
            <BsShieldLockFill size={28} color="#f87171" />
          </div>
          <h2 className="ds-state-title">Invalid Link</h2>
          <p className="ds-state-sub">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="ds-cta" style={{ marginTop: 24, display: "flex", textDecoration: "none" }}>
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="ds-root">
        <style>{styles}</style>
        <div className="ds-card" style={{ textAlign: "center" }}>
          <div className="ds-brand">
            <div className="ds-flame"><Flame size={22} color="#0e0700" strokeWidth={2.5} /></div>
            <span className="ds-wordmark">KOTABITES</span>
          </div>
          <div className="ds-state-icon">
            <BsShieldLockFill size={28} color="#0e0700" />
          </div>
          <h2 className="ds-state-title">Password Reset!</h2>
          <p className="ds-state-sub">Redirecting you to sign in…</p>
          <div className="ds-redirect-bar">
            <div className="ds-redirect-fill" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw.length < 6)  return setError("Password must be at least 6 characters");
    if (pw !== confirm) return setError("Passwords don't match");
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, pw);
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="ds-root">
      <style>{styles}</style>

      <div className="ds-card">

        {/* Brand */}
        <div className="ds-brand">
          <div className="ds-flame"><Flame size={22} color="#0e0700" strokeWidth={2.5} /></div>
          <span className="ds-wordmark">KOTABITES</span>
        </div>

        {/* Icon + heading */}
        <div className="ds-heading">
          <div className="ds-state-icon">
            <BsShieldLockFill size={26} color="#0e0700" />
          </div>
          <h2 className="ds-state-title" style={{ marginTop: 14 }}>Set New Password</h2>
          <p className="ds-state-sub">Choose a strong password to secure your account</p>
        </div>

        <form onSubmit={handleSubmit} className="ds-form">

          {/* New password */}
          <div className="ds-field">
            <div className={`ds-pw-wrap${error && !pw ? " ds-pw-err" : ""}`}>
              <input
                type={showPw ? "text" : "password"}
                className="ds-input ds-input--pw"
                placeholder="New password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(""); }}
                autoFocus
              />
              <button type="button" className="ds-eye" onClick={() => setShowPw((s) => !s)} tabIndex={-1}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Strength bar */}
            {pw && (
              <div className="ds-strength">
                <div className="ds-strength-bar">
                  {[1,2,3,4,5].map((i) => (
                    <div
                      key={i}
                      className="ds-strength-seg"
                      style={{ background: i <= strength ? STRENGTH_COLOR[strength] : "rgba(255,248,231,0.08)" }}
                    />
                  ))}
                </div>
                <span className="ds-strength-label" style={{ color: STRENGTH_COLOR[strength] }}>
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
            )}

            {/* Requirements */}
            {pw && (
              <div className="ds-reqs">
                <Req met={pw.length >= 6}            text="At least 6 characters" />
                <Req met={/[A-Z]/.test(pw)}          text="One uppercase letter" />
                <Req met={/[0-9]/.test(pw)}          text="One number" />
                <Req met={/[^A-Za-z0-9]/.test(pw)}   text="One special character" />
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="ds-field">
            <div className={`ds-pw-wrap${error && pw !== confirm ? " ds-pw-err" : ""}`}>
              <input
                type={showCf ? "text" : "password"}
                className="ds-input ds-input--pw"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                onPaste={(e) => e.preventDefault()}
              />
              <button type="button" className="ds-eye" onClick={() => setShowCf((s) => !s)} tabIndex={-1}>
                {showCf ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirm && !error && (
              <p className="ds-match" style={{ color: pwMatch ? "#4ade80" : "#f87171" }}>
                {pwMatch ? "✓ Passwords match" : "✗ Passwords don't match"}
              </p>
            )}
            {error && <p className="ds-err">{error}</p>}
          </div>

          {/* CTA */}
          <button type="submit" disabled={loading} className="ds-cta">
            {loading
              ? <><Loader size={18} className="ds-spin" /> Resetting…</>
              : <><ShieldCheck size={17} /> Reset Password</>}
          </button>

          <p style={{ textAlign: "center", marginTop: 6 }}>
            <Link to="/login" className="ds-text-link" style={{ fontSize: 13 }}>
              ← Back to sign in
            </Link>
          </p>
        </form>

        {/* Security badge */}
        <div className="ds-secure">
          <ShieldCheck size={12} color="rgba(255,248,231,0.25)" />
          <span>Secured with 256-bit encryption</span>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --kb-red:   #DA291C;
    --kb-red2:  #b91c1c;
    --kb-gold:  #FFC72C;
    --kb-dark:  #0e0700;
    --kb-card:  #1a0e00;
    --kb-text:  #fff8e7;
    --kb-muted: rgba(255,248,231,0.42);
    --kb-input: rgba(255,248,231,0.07);
    --kb-ring:  rgba(255,199,44,0.38);
  }

  .ds-root {
    min-height:100vh;
    background:
      radial-gradient(ellipse 90% 55% at 50% -10%, rgba(218,41,28,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 50% 110%, rgba(255,199,44,0.07) 0%, transparent 55%),
      var(--kb-dark);
    display:flex; align-items:center; justify-content:center;
    padding:24px 16px;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  }

  /* no border */
  .ds-card {
    width:100%; max-width:400px;
    padding:48px 36px 36px;
    background:var(--kb-card);
    border-radius:28px;
    box-shadow:0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,199,44,0.04);
  }

  .ds-brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:28px; }
  .ds-flame { width:38px; height:38px; background:var(--kb-gold); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 22px rgba(255,199,44,0.32); }
  .ds-wordmark { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:4px; color:var(--kb-text); line-height:1; }

  .ds-heading { text-align:center; margin-bottom:28px; }
  .ds-state-icon { width:64px; height:64px; background:var(--kb-gold); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto; box-shadow:0 0 28px rgba(255,199,44,0.28); }
  .ds-state-title { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:2px; color:var(--kb-text); margin:12px 0 0; }
  .ds-state-sub   { font-size:13px; color:var(--kb-muted); margin:6px 0 0; line-height:1.5; }

  /* redirect progress bar */
  .ds-redirect-bar { height:3px; border-radius:999px; background:rgba(255,199,44,0.12); margin:24px 0 0; overflow:hidden; }
  .ds-redirect-fill { height:100%; border-radius:999px; background:var(--kb-gold); animation:kbFill 2.4s linear forwards; }
  @keyframes kbFill { from{width:0%} to{width:100%} }

  .ds-form  { display:flex; flex-direction:column; gap:14px; }
  .ds-field { display:flex; flex-direction:column; gap:5px; }

  /* pill input — no border */
  .ds-input {
    width:100%; box-sizing:border-box;
    background:var(--kb-input); border:none; border-radius:999px;
    padding:14px 20px; color:var(--kb-text);
    font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500;
    outline:none; transition:background 0.2s, box-shadow 0.2s;
  }
  .ds-input::placeholder { color:var(--kb-muted); }
  .ds-input:focus { background:rgba(255,248,231,0.1); box-shadow:0 0 0 2.5px var(--kb-ring); }

  /* password pill */
  .ds-pw-wrap { display:flex; align-items:center; background:var(--kb-input); border:none; border-radius:999px; padding:0 16px 0 20px; transition:background 0.2s, box-shadow 0.2s; }
  .ds-pw-wrap:focus-within { background:rgba(255,248,231,0.1); box-shadow:0 0 0 2.5px var(--kb-ring); }
  .ds-pw-err { box-shadow:0 0 0 2px rgba(218,41,28,0.55) !important; background:rgba(218,41,28,0.05) !important; }
  .ds-input--pw { flex:1; background:none; border:none; border-radius:0; padding:14px 0; box-shadow:none !important; outline:none; color:var(--kb-text); font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500; }
  .ds-input--pw::placeholder { color:var(--kb-muted); }
  .ds-eye { background:none; border:none; cursor:pointer; color:var(--kb-muted); display:flex; align-items:center; padding:0; transition:color 0.2s; flex-shrink:0; }
  .ds-eye:hover { color:var(--kb-text); }
  .ds-err   { font-size:11px; font-weight:700; color:#f87171; padding-left:8px; }
  .ds-match { font-size:11px; font-weight:700; padding-left:8px; }

  /* strength */
  .ds-strength { display:flex; align-items:center; gap:8px; padding:4px 8px 0; }
  .ds-strength-bar { display:flex; gap:4px; flex:1; }
  .ds-strength-seg { flex:1; height:3px; border-radius:999px; transition:background 0.3s; }
  .ds-strength-label { font-size:10px; font-weight:700; white-space:nowrap; transition:color 0.3s; }

  /* requirements */
  .ds-reqs { display:flex; flex-direction:column; gap:5px; padding:6px 8px 2px; }
  .ds-req  { display:flex; align-items:center; gap:6px; font-size:11px; }

  .ds-text-link { font-size:13px; font-weight:600; color:var(--kb-gold); text-decoration:none; transition:opacity 0.2s; }
  .ds-text-link:hover { opacity:0.75; }

  .ds-cta { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:15px; background:var(--kb-red); color:#fff; border:none; border-radius:999px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:800; letter-spacing:0.02em; cursor:pointer; box-shadow:0 6px 22px rgba(218,41,28,0.38); transition:background 0.2s, transform 0.15s, box-shadow 0.2s; margin-top:4px; }
  .ds-cta:hover:not(:disabled) { background:var(--kb-red2); transform:scale(1.015); box-shadow:0 8px 28px rgba(218,41,28,0.46); }
  .ds-cta:active:not(:disabled) { transform:scale(0.99); }
  .ds-cta:disabled { opacity:0.5; cursor:not-allowed; }

  .ds-secure { display:flex; align-items:center; justify-content:center; gap:5px; margin-top:22px; font-size:11px; color:rgba(255,248,231,0.25); letter-spacing:0.03em; }

  @keyframes kbSpin { to { transform:rotate(360deg); } }
  .ds-spin { animation:kbSpin 0.8s linear infinite; }

  @media(max-width:480px) { .ds-card { padding:36px 22px 30px; } .ds-wordmark { font-size:22px; } }
`;
