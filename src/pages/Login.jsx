// src/pages/Login.jsx — DeepSeek layout · react-icons · borderless · KOTABITES
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Flame, Eye, EyeOff, Loader, AlertCircle, ShieldCheck, Loader2} from "lucide-react";
import { FcGoogle }      from "react-icons/fc";
import { FaGithub }      from "react-icons/fa";
import { BsFingerprint } from "react-icons/bs";
import GoogleButton      from "../components/GoogleButton";
import GitHubButton      from "../components/GitHubButton";
import FingerprintButton from "../components/FingerprintButton";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast     = useToast();

  /* refs to trigger hidden OAuth/passkey components */
  const googleRef = useRef(null);
  const githubRef = useRef(null);
  const fpRef     = useRef(null);

  const [form, setForm]     = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading]                   = useState(false);
  const [showPw,  setShowPw]                    = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/menu";

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email.trim().toLowerCase())) e.email = "Invalid email";
    if (!form.password.trim()) e.password = "Password is required";
    return e;
  };

  /* ── Handlers ── */
  const handleSuccess = (data) => {
    const token = data.access_token;
    if (token) sessionStorage.setItem("kb_token", token);
    toast.show({ type: "success", title: "Welcome!", message: data.full_name || data.user?.full_name || data.email });
    navigate(redirect, { replace: true });
  };

  const handleOAuthSuccess = (data) => handleSuccess(data.user ? data : { ...data, ...data.user });
  const handleOAuthError   = (err)  => toast.show({ type: "error", title: "Sign-in failed", message: err?.message || "Try again" });
  const handleFpSuccess    = (data) => handleSuccess(data);
  const handleFpError      = (err)  => toast.show({ type: "error", title: "Fingerprint failed", message: err?.message || "Try your password" });

  const handleChange = (field) => (ev) => {
    setForm((p) => ({ ...p, [field]: ev.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
    setNeedsVerification(false);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setNeedsVerification(false);
    try {
      await login(form);
      toast.show({ type: "success", title: "Welcome back!", message: form.email.trim().toLowerCase() });
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err.message || "Login failed";
      if (msg.toLowerCase().includes("verify") || msg.toLowerCase().includes("verification")) {
        setNeedsVerification(true);
        toast.show({ type: "error", title: "Email not verified", message: "Please verify your email before logging in." });
      } else {
        toast.show({ type: "error", title: "Login failed", message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  /* trigger the hidden component's root button */
  const triggerHidden = (ref) =>
    ref.current?.querySelector("button")?.click();

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

        {/* Verification banner */}
        {needsVerification && (
          <div className="ds-banner">
            <AlertCircle size={15} style={{ flexShrink: 0, color: "#f87171" }} />
            <div>
              <p className="ds-banner-title">Email not verified</p>
              <p className="ds-banner-body">Check your inbox for the verification link.</p>
            </div>
            <Link to="/verify-email" className="ds-banner-link">Resend →</Link>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="ds-form">

          {/* Email */}
          <div className="ds-field">
            <input
              type="email" className={`ds-input${errors.email ? " ds-input--err" : ""}`}
              placeholder="Phone number / email address"
              value={form.email} onChange={handleChange("email")}
              autoComplete="email" disabled={loading}
            />
            {errors.email && <p className="ds-err">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="ds-field">
            <div className={`ds-pw-wrap${errors.password ? " ds-pw-err" : ""}`}>
              <input
                type={showPw ? "text" : "password"}
                className="ds-input ds-input--pw"
                placeholder="Password"
                value={form.password} onChange={handleChange("password")}
                autoComplete="current-password" disabled={loading}
              />
              <button type="button" className="ds-eye"
                onClick={() => setShowPw((s) => !s)} tabIndex={-1}
                aria-label={showPw ? "Hide" : "Show"}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="ds-err">{errors.password}</p>}
          </div>

          {/* Terms */}
          <p className="ds-terms">
            By signing in you agree to KOTABITES&rsquo;{" "}
            <Link to="/terms" className="ds-terms-link">Terms of Use</Link>{" "}
            and <Link to="/privacy" className="ds-terms-link">Privacy Policy</Link>.
          </p>

          {/* Forgot / Sign up */}
          <div className="ds-row">
            <Link to="/forgot-password" className="ds-text-link">Forgot password?</Link>
            <Link to={`/register${redirect !== "/menu" ? `?redirect=${redirect}` : ""}`} className="ds-text-link">
              Sign up
            </Link>
          </div>

          {/* CTA */}
          <button type="submit" disabled={loading} className="ds-cta">
            {loading ? <><Loader size={18} className="ds-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="ds-divider">
          <div className="ds-line" /><div className="ds-line" />
        </div>

        {/* Social circles */}
<div className="ds-socials">
  <button
    type="button"
    className="ds-social-btn"
    onClick={() => !loading && triggerHidden(googleRef)}
    disabled={loading}
    aria-label="Continue with Google"
  >
    {loading ? (
      <Loader2 size={22} className="ds-spin" color="var(--kb-muted)" />
    ) : (
      <FcGoogle size={22} />
    )}
  </button>

  <button
    type="button"
    className="ds-social-btn"
    onClick={() => !loading && triggerHidden(githubRef)}
    disabled={loading}
    aria-label="Continue with GitHub"
  >
    {loading ? (
      <Loader2 size={22} className="ds-spin" color="var(--kb-muted)" />
    ) : (
      <FaGithub size={20} color="var(--kb-text)" />
    )}
  </button>

  <button
    type="button"
    className="ds-social-btn"
    onClick={() => !loading && triggerHidden(fpRef)}
    disabled={loading}
    aria-label="Sign in with fingerprint"
  >
    {loading ? (
      <Loader2 size={22} className="ds-spin" color="var(--kb-muted)" />
    ) : (
      <BsFingerprint size={22} color="var(--kb-gold)" />
    )}
  </button>

  {/* Hidden auth components */}
  <div ref={googleRef} style={{ display: "none" }}>
    <GoogleButton onSuccess={handleOAuthSuccess} onError={handleOAuthError} />
  </div>
  <div ref={githubRef} style={{ display: "none" }}>
    <GitHubButton onSuccess={handleOAuthSuccess} onError={handleOAuthError} />
  </div>
  <div ref={fpRef} style={{ display: "none" }}>
    <FingerprintButton email={form.email} onSuccess={handleFpSuccess} onError={handleFpError} />
  </div>
</div>

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
    min-height: 100vh;
    background:
      radial-gradient(ellipse 90% 55% at 50% -10%, rgba(218,41,28,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 50% 110%, rgba(255,199,44,0.07) 0%, transparent 55%),
      var(--kb-dark);
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  /* no border on card */
  .ds-card {
    width: 100%; max-width: 400px;
    padding: 48px 36px 36px;
    background: var(--kb-card);
    border-radius: 28px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,199,44,0.04);
  }

  .ds-brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:40px; }
  .ds-flame { width:38px; height:38px; background:var(--kb-gold); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 22px rgba(255,199,44,0.32); }
  .ds-wordmark { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:4px; color:var(--kb-text); line-height:1; }

  .ds-banner { display:flex; align-items:flex-start; gap:10px; background:rgba(218,41,28,0.08); border-radius:14px; padding:12px 14px; margin-bottom:20px; animation:kbSlide 0.28s ease; }
  @keyframes kbSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  .ds-banner-title { font-size:12px; font-weight:800; color:var(--kb-text); margin:0 0 2px; }
  .ds-banner-body  { font-size:11px; color:var(--kb-muted); margin:0; line-height:1.4; }
  .ds-banner-link  { color:var(--kb-gold); font-size:12px; font-weight:700; text-decoration:none; white-space:nowrap; margin-left:auto; }
  .ds-banner-link:hover { opacity:0.8; }

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
  .ds-input--err { box-shadow:0 0 0 2px rgba(218,41,28,0.55) !important; background:rgba(218,41,28,0.05) !important; }

  /* password pill */
  .ds-pw-wrap { display:flex; align-items:center; background:var(--kb-input); border:none; border-radius:999px; padding:0 16px 0 20px; transition:background 0.2s, box-shadow 0.2s; }
  .ds-pw-wrap:focus-within { background:rgba(255,248,231,0.1); box-shadow:0 0 0 2.5px var(--kb-ring); }
  .ds-pw-err { box-shadow:0 0 0 2px rgba(218,41,28,0.55) !important; background:rgba(218,41,28,0.05) !important; }
  .ds-input--pw { flex:1; background:none; border:none; border-radius:0; padding:14px 0; box-shadow:none !important; outline:none; color:var(--kb-text); font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500; }
  .ds-input--pw::placeholder { color:var(--kb-muted); }
  .ds-eye { background:none; border:none; cursor:pointer; color:var(--kb-muted); display:flex; align-items:center; padding:0; transition:color 0.2s; flex-shrink:0; }
  .ds-eye:hover { color:var(--kb-text); }
  .ds-err { font-size:11px; font-weight:700; color:#f87171; padding-left:8px; }

  .ds-terms { font-size:12px; color:var(--kb-muted); line-height:1.5; margin:0; }
  .ds-terms-link { color:var(--kb-text); font-weight:600; text-decoration:underline; text-underline-offset:2px; text-decoration-color:rgba(255,248,231,0.25); }
  .ds-terms-link:hover { color:var(--kb-gold); text-decoration-color:var(--kb-gold); }

  .ds-row { display:flex; justify-content:space-between; align-items:center; }
  .ds-text-link { font-size:13px; font-weight:600; color:var(--kb-gold); text-decoration:none; transition:opacity 0.2s; }
  .ds-text-link:hover { opacity:0.75; }

  .ds-cta { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:15px; background:var(--kb-red); color:#fff; border:none; border-radius:999px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:800; letter-spacing:0.02em; cursor:pointer; box-shadow:0 6px 22px rgba(218,41,28,0.38); transition:background 0.2s, transform 0.15s, box-shadow 0.2s; margin-top:4px; }
  .ds-cta:hover:not(:disabled) { background:var(--kb-red2); transform:scale(1.015); box-shadow:0 8px 28px rgba(218,41,28,0.46); }
  .ds-cta:active:not(:disabled) { transform:scale(0.99); }
  .ds-cta:disabled { opacity:0.5; cursor:not-allowed; }

  .ds-divider { display:flex; align-items:center; margin:28px 0 20px; }
  .ds-line { flex:1; height:1px; background:rgba(255,199,44,0.1); }

  .ds-socials { display:flex; justify-content:center; gap:14px; }
  .ds-social-btn { width:52px; height:52px; border-radius:50%; background:var(--kb-input); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 12px rgba(0,0,0,0.28); transition:background 0.2s, transform 0.15s, box-shadow 0.2s; }
  .ds-social-btn:hover { background:rgba(255,248,231,0.11); transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.35); }
  .ds-social-btn:active { transform:scale(0.95); }

  .ds-loading { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--kb-muted); justify-content:center; }

  .ds-secure { display:flex; align-items:center; justify-content:center; gap:5px; margin-top:22px; font-size:11px; color:rgba(255,248,231,0.25); letter-spacing:0.03em; }

  @keyframes kbSpin { to { transform:rotate(360deg); } }
  .ds-spin { animation:kbSpin 0.8s linear infinite; }

  @media(max-width:480px) { .ds-card { padding:36px 22px 30px; } .ds-wordmark { font-size:22px; } }
`;
