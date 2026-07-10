// src/pages/Login.jsx — DeepSeek layout · react-icons · borderless · KOTABITES
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Flame, Eye, EyeOff, Loader, AlertCircle, ShieldCheck, Loader2, MailCheck } from "lucide-react";
import { FcGoogle }      from "react-icons/fc";
import { FaGithub }      from "react-icons/fa";
import { BsFingerprint } from "react-icons/bs";
import GoogleButton      from "../components/GoogleButton";
import GitHubButton      from "../components/GitHubButton";
import FingerprintButton from "../components/FingerprintButton";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, completeOtpLogin, resendOtpLogin } = useAuth();
  const toast     = useToast();

  const googleRef = useRef(null);
  const githubRef = useRef(null);
  const fpRef     = useRef(null);

  const [form, setForm]     = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading]                     = useState(false);
  const [oauthLoading, setOauthLoading]           = useState(null); // "google"|"github"|"fp"|null
  const [showPw, setShowPw]                       = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // ── Login-OTP step — shown after a correct password, before a session
  //    token is actually issued (see AuthContext.login / completeOtpLogin) ──
  const [otpStep, setOtpStep]       = useState(false);
  const [otpValue, setOtpValue]     = useState("");
  const [otpError, setOtpError]     = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);

  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/menu";

  const isAnyLoading = loading || !!oauthLoading;

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = t("auth.errEmailRequired");
    else if (!/\S+@\S+\.\S+/.test(form.email.trim().toLowerCase())) e.email = t("auth.errEmailInvalid");
    if (!form.password.trim()) e.password = t("auth.errPasswordRequired");
    return e;
  };

  /* ── Handlers ── */
  const handleSuccess = (data) => {
    const token = data.access_token;
    if (token) sessionStorage.setItem("kb_token", token);
    toast.show({ type: "success", title: t("auth.toastWelcome"), message: data.full_name || data.user?.full_name || data.email });
    navigate(redirect, { replace: true });
  };

  const handleOAuthSuccess = (data) => {
    setOauthLoading(null);
    handleSuccess(data.user ? data : { ...data, ...data.user });
  };
  const handleOAuthError = (err) => {
    setOauthLoading(null);
    toast.show({ type: "error", title: t("auth.toastSignInFailed"), message: err?.message || t("auth.toastTryAgain") });
  };
  const handleFpSuccess = (data) => { setOauthLoading(null); handleSuccess(data); };
  const handleFpError   = (err)  => { setOauthLoading(null); toast.show({ type: "error", title: t("auth.toastFingerprintFailed"), message: err?.message || t("auth.toastTryPassword") }); };

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
      await login(form); // password verified server-side; issues + emails an OTP, no token yet
      setOtpStep(true);
      toast.show({ type: "success", title: t("auth.otpSentTitle"), message: t("auth.otpSentSub", { email: form.email.trim().toLowerCase() }) });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err.message || t("auth.toastLoginFailed");
      if (msg.toLowerCase().includes("verify") || msg.toLowerCase().includes("verification")) {
        setNeedsVerification(true);
        toast.show({ type: "error", title: t("auth.emailNotVerified"), message: t("auth.checkInboxVerify") });
      } else {
        toast.show({ type: "error", title: t("auth.toastLoginFailed"), message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (ev) => {
    ev.preventDefault();
    if (otpValue.trim().length !== 6) { setOtpError(t("auth.errOtpLength")); return; }
    setOtpVerifying(true);
    setOtpError("");
    try {
      await completeOtpLogin(form.email.trim().toLowerCase(), otpValue.trim());
      toast.show({ type: "success", title: t("auth.toastWelcomeBack"), message: form.email.trim().toLowerCase() });
      navigate(redirect, { replace: true });
    } catch (err) {
      setOtpError(err?.response?.data?.detail || err.message || t("auth.errOtpInvalid"));
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleOtpResend = async () => {
    setOtpResending(true);
    setOtpError("");
    try {
      await resendOtpLogin(form.email.trim().toLowerCase());
      toast.show({ type: "success", title: t("auth.otpResentTitle"), message: t("auth.otpResentSub") });
      setOtpValue("");
    } catch (err) {
      toast.show({ type: "error", title: t("auth.toastLoginFailed"), message: err?.response?.data?.detail || err.message });
    } finally {
      setOtpResending(false);
    }
  };

  const triggerOAuth = (ref, provider) => {
    if (isAnyLoading) return;
    setOauthLoading(provider);
    // small delay so loader bar renders before popup opens
    setTimeout(() => ref.current?.querySelector("button")?.click(), 80);
  };

  /* ── OTP entry screen ── */
  if (otpStep) {
    return (
      <div className="ds-root">
        <style>{styles}</style>
        <div className="ds-card">
          <div className="ds-brand">
            <div className="ds-flame"><Flame size={22} color="#0e0700" strokeWidth={2.5} /></div>
            <span className="ds-wordmark">KOTABITES</span>
          </div>

          <div className="ds-state" style={{ marginBottom: 20 }}>
            <div className="ds-otp-icon"><MailCheck size={26} color="var(--kb-gold)" /></div>
            <h2 className="ds-state-title">{t("auth.otpTitle")}</h2>
            <p className="ds-state-sub">
              {t("auth.otpSub")}{" "}
              <strong style={{ color: "var(--kb-gold)" }}>{form.email.trim().toLowerCase()}</strong>
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="ds-form">
            <div className="ds-field">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className={`ds-input ds-otp-input${otpError ? " ds-input--err" : ""}`}
                placeholder={t("auth.otpPlaceholder")}
                value={otpValue}
                onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
                disabled={otpVerifying}
                autoFocus
              />
              {otpError && <p className="ds-err">{otpError}</p>}
            </div>

            <button type="submit" disabled={otpVerifying || otpValue.length !== 6} className="ds-cta">
              {otpVerifying
                ? <><Loader size={18} className="ds-spin" /> {t("auth.otpVerifying")}</>
                : t("auth.otpVerify")}
            </button>
          </form>

          <div className="ds-row" style={{ justifyContent: "center", marginTop: 16 }}>
            <button type="button" className="ds-text-link" onClick={handleOtpResend} disabled={otpResending} style={{ background: "none", border: "none", cursor: "pointer" }}>
              {otpResending ? t("auth.otpResending") : t("auth.otpResend")}
            </button>
          </div>

          <div className="ds-row" style={{ justifyContent: "center" }}>
            <button type="button" className="ds-text-link" onClick={() => { setOtpStep(false); setOtpValue(""); setOtpError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--kb-muted)" }}>
              {t("auth.otpBack")}
            </button>
          </div>

          <div className="ds-secure">
            <ShieldCheck size={12} color="rgba(255,248,231,0.25)" />
            <span>{t("auth.secured256")}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="ds-root">
      <style>{styles}</style>

      <div className="ds-card">

        {/* ── Google-style top loading bar ── */}
        <div className="ds-topbar-track">
          {isAnyLoading && (
            <>
              <div className={`ds-topbar-fill${loading ? " ds-topbar-fill-form" : " ds-topbar-fill-oauth"}`} />
              <div className="ds-topbar-shimmer" />
            </>
          )}
        </div>

        {/* ── OAuth loading overlay label ── */}
        {oauthLoading && (
          <div className="ds-oauth-label">
            {oauthLoading === "google"  && <><FcGoogle size={14} /> {t("auth.connectingGoogle")}</>}
            {oauthLoading === "github"  && <><FaGithub size={13} color="#fff" /> {t("auth.connectingGithub")}</>}
            {oauthLoading === "fp"      && <><BsFingerprint size={13} color="#FFC72C" /> {t("auth.scanningFingerprint")}</>}
          </div>
        )}

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
              <p className="ds-banner-title">{t("auth.emailNotVerified")}</p>
              <p className="ds-banner-body">{t("auth.checkInboxVerify")}</p>
            </div>
            <Link to="/verify-email" className="ds-banner-link">{t("auth.resend")}</Link>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="ds-form">

          <div className="ds-field">
            <input
              type="email" className={`ds-input${errors.email ? " ds-input--err" : ""}`}
              placeholder={t("auth.emailPlaceholder")}
              value={form.email} onChange={handleChange("email")}
              autoComplete="email" disabled={isAnyLoading}
            />
            {errors.email && <p className="ds-err">{errors.email}</p>}
          </div>

          <div className="ds-field">
            <div className={`ds-pw-wrap${errors.password ? " ds-pw-err" : ""}`}>
              <input
                type={showPw ? "text" : "password"}
                className="ds-input ds-input--pw"
                placeholder={t("auth.passwordPlaceholder")}
                value={form.password} onChange={handleChange("password")}
                autoComplete="current-password" disabled={isAnyLoading}
              />
              <button type="button" className="ds-eye"
                onClick={() => setShowPw((s) => !s)} tabIndex={-1}
                aria-label={showPw ? "Hide" : "Show"}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="ds-err">{errors.password}</p>}
          </div>

          <p className="ds-terms">
            {t("auth.termsPrefix")}{" "}
            <Link to="/terms" className="ds-terms-link">{t("auth.termsOfUse")}</Link>{" "}
            {t("auth.and")} <Link to="/privacy" className="ds-terms-link">{t("auth.privacyPolicy")}</Link>.
          </p>

          <div className="ds-row">
            <Link to="/forgot-password" className="ds-text-link">{t("auth.forgotPassword")}</Link>
            <Link to={`/register${redirect !== "/menu" ? `?redirect=${redirect}` : ""}`} className="ds-text-link">
              {t("auth.signUp")}
            </Link>
          </div>

          <button type="submit" disabled={isAnyLoading} className="ds-cta">
            {loading
              ? <><Loader size={18} className="ds-spin" /> {t("auth.signingIn")}</>
              : t("auth.signIn")}
          </button>
        </form>

        {/* Divider */}
        <div className="ds-divider">
          <div className="ds-line" />
          <span className="ds-divider-text">{t("auth.or")}</span>
          <div className="ds-line" />
        </div>

        {/* Social circles */}
        <div className="ds-socials">
          {/* Google */}
          <button
            type="button"
            className={`ds-social-btn${oauthLoading === "google" ? " ds-social-btn-active" : ""}`}
            onClick={() => triggerOAuth(googleRef, "google")}
            disabled={isAnyLoading}
            aria-label={t("auth.continueWithGoogle")}
            title={t("auth.continueWithGoogle")}
          >
            {oauthLoading === "google"
              ? <Loader2 size={20} className="ds-spin" style={{ color: "#4285F4" }} />
              : <FcGoogle size={22} />}
          </button>

          {/* GitHub */}
          <button
            type="button"
            className={`ds-social-btn${oauthLoading === "github" ? " ds-social-btn-active" : ""}`}
            onClick={() => triggerOAuth(githubRef, "github")}
            disabled={isAnyLoading}
            aria-label={t("auth.continueWithGithub")}
            title={t("auth.continueWithGithub")}
          >
            {oauthLoading === "github"
              ? <Loader2 size={20} className="ds-spin" style={{ color: "#e0e0e0" }} />
              : <FaGithub size={20} color="var(--kb-text)" />}
          </button>

          {/* Fingerprint */}
          <button
            type="button"
            className={`ds-social-btn${oauthLoading === "fp" ? " ds-social-btn-active" : ""}`}
            onClick={() => triggerOAuth(fpRef, "fp")}
            disabled={isAnyLoading}
            aria-label={t("auth.signInWithFingerprint")}
            title={t("auth.signInWithFingerprint")}
          >
            {oauthLoading === "fp"
              ? <Loader2 size={20} className="ds-spin" style={{ color: "#FFC72C" }} />
              : <BsFingerprint size={22} color="var(--kb-gold)" />}
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

        {/* Social labels */}
        <div className="ds-social-labels">
          <span>{t("auth.google")}</span>
          <span>{t("auth.github")}</span>
          <span>{t("auth.fingerprint")}</span>
        </div>

        {/* Security badge */}
        <div className="ds-secure">
          <ShieldCheck size={12} color="rgba(255,248,231,0.25)" />
          <span>{t("auth.secured256")}</span>
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

  /* ── Card ── */
  .ds-card {
    width: 100%; max-width: 400px;
    background: var(--kb-card);
    border-radius: 28px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,199,44,0.06);
    overflow: hidden;           /* clips the top loading bar */
    position: relative;
    padding: 0;                 /* padding applied inside */
  }

  /* ── TOP LOADING BAR (Google-style) ── */
  .ds-topbar-track {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: rgba(255,199,44,0.08);
    z-index: 10;
    overflow: hidden;
    border-radius: 28px 28px 0 0;
  }

  /* Indeterminate fill for OAuth (bounces back and forth) */
  .ds-topbar-fill {
    position: absolute;
    top: 0; left: 0;
    height: 100%;
    border-radius: 2px;
  }
  .ds-topbar-fill-oauth {
    width: 45%;
    background: linear-gradient(90deg, #4285F4, #FFC72C, #DA291C);
    animation: kbBarOAuth 1.6s cubic-bezier(0.4,0,0.6,1) infinite;
  }
  .ds-topbar-fill-form {
    width: 100%;
    background: linear-gradient(90deg, var(--kb-red), var(--kb-gold));
    animation: kbBarForm 1.8s ease-out forwards;
  }

  /* shimmer overlay */
  .ds-topbar-shimmer {
    position: absolute;
    top: 0; left: -60%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    animation: kbBarShimmer 1.4s ease infinite;
  }

  @keyframes kbBarOAuth {
    0%   { left: -50%; width: 45%; }
    50%  { left: 55%;  width: 45%; }
    100% { left: -50%; width: 45%; }
  }
  @keyframes kbBarForm {
    0%   { width: 20%; opacity: 1; }
    70%  { width: 85%; opacity: 1; }
    100% { width: 100%; opacity: 0.6; }
  }
  @keyframes kbBarShimmer {
    0%   { left: -60%; }
    100% { left: 120%; }
  }

  /* ── OAuth status label ── */
  .ds-oauth-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 700;
    color: var(--kb-muted);
    letter-spacing: 0.03em;
    padding: 10px 36px 0;
    margin-top: 6px;
    animation: kbSlide 0.2s ease;
  }

  /* ── Inner padding wrapper (replaces padding on .ds-card) ── */
  .ds-brand {
    display:flex; align-items:center; justify-content:center; gap:10px;
    margin-bottom: 32px;
    padding: 44px 36px 0;
  }
  .ds-flame { width:38px; height:38px; background:var(--kb-gold); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 22px rgba(255,199,44,0.32); }
  .ds-wordmark { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:4px; color:var(--kb-text); line-height:1; }

  .ds-banner { display:flex; align-items:flex-start; gap:10px; background:rgba(218,41,28,0.08); border-radius:14px; padding:12px 14px; margin:0 36px 20px; animation:kbSlide 0.28s ease; }
  @keyframes kbSlide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .ds-banner-title { font-size:12px; font-weight:800; color:var(--kb-text); margin:0 0 2px; }
  .ds-banner-body  { font-size:11px; color:var(--kb-muted); margin:0; line-height:1.4; }
  .ds-banner-link  { color:var(--kb-gold); font-size:12px; font-weight:700; text-decoration:none; white-space:nowrap; margin-left:auto; }
  .ds-banner-link:hover { opacity:0.8; }

  .ds-form  { display:flex; flex-direction:column; gap:14px; padding: 0 36px; }
  .ds-field { display:flex; flex-direction:column; gap:5px; }

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

  .ds-pw-wrap { display:flex; align-items:center; background:var(--kb-input); border:none; border-radius:999px; padding:0 16px 0 20px; transition:background 0.2s, box-shadow 0.2s; }
  .ds-pw-wrap:focus-within { background:rgba(255,248,231,0.1); box-shadow:0 0 0 2.5px var(--kb-ring); }
  .ds-pw-err { box-shadow:0 0 0 2px rgba(218,41,28,0.55) !important; background:rgba(218,41,28,0.05) !important; }
  .ds-input--pw { flex:1; background:none; border:none; border-radius:0; padding:14px 0; box-shadow:none !important; outline:none; color:var(--kb-text); font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500; }
  .ds-input--pw::placeholder { color:var(--kb-muted); }
  .ds-eye { background:none; border:none; cursor:pointer; color:var(--kb-muted); display:flex; align-items:center; padding:0; transition:color 0.2s; flex-shrink:0; }
  .ds-eye:hover { color:var(--kb-text); }
  .ds-err { font-size:11px; font-weight:700; color:#f87171; padding-left:8px; }

  /* OTP step */
  .ds-otp-icon {
    width:60px; height:60px; margin:0 auto 4px; border-radius:50%;
    background:rgba(255,199,44,0.1); display:flex; align-items:center; justify-content:center;
  }
  .ds-otp-input {
    text-align:center; font-size:22px; font-weight:800; letter-spacing:10px;
    padding-left:10px;
  }
  .ds-state { display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; }
  .ds-state-title { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:2px; color:var(--kb-text); margin:6px 0 0; }
  .ds-state-sub   { font-size:13px; color:var(--kb-muted); max-width:280px; line-height:1.55; margin:0; }

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

  /* ── Divider with "or" ── */
  .ds-divider { display:flex; align-items:center; gap:12px; margin:24px 36px 20px; }
  .ds-line { flex:1; height:1px; background:rgba(255,199,44,0.1); }
  .ds-divider-text { font-size:11px; font-weight:700; color:rgba(255,248,231,0.2); letter-spacing:0.08em; text-transform:uppercase; white-space:nowrap; }

  /* ── Social buttons ── */
  .ds-socials { display:flex; justify-content:center; gap:16px; padding: 0 36px; }
  .ds-social-btn {
    width:52px; height:52px; border-radius:50%;
    background:var(--kb-input); border:1.5px solid rgba(255,248,231,0.06);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    box-shadow:0 2px 12px rgba(0,0,0,0.28);
    transition:background 0.2s, transform 0.15s, box-shadow 0.2s, border-color 0.2s;
    position: relative;
  }
  .ds-social-btn:hover:not(:disabled) {
    background:rgba(255,248,231,0.11);
    transform:translateY(-3px);
    box-shadow:0 8px 20px rgba(0,0,0,0.4);
    border-color: rgba(255,199,44,0.2);
  }
  .ds-social-btn:active:not(:disabled) { transform:scale(0.95) translateY(0); }
  .ds-social-btn:disabled { opacity:0.55; cursor:not-allowed; }
  .ds-social-btn-active {
    border-color: rgba(255,199,44,0.35) !important;
    background: rgba(255,199,44,0.07) !important;
    box-shadow: 0 0 0 3px rgba(255,199,44,0.12), 0 4px 16px rgba(0,0,0,0.3) !important;
  }

  /* ── Social labels ── */
  .ds-social-labels {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 8px 36px 0;
  }
  .ds-social-labels span {
    width: 52px;
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    color: rgba(255,248,231,0.22);
    letter-spacing: 0.02em;
  }

  .ds-secure { display:flex; align-items:center; justify-content:center; gap:5px; margin-top:20px; padding-bottom:32px; font-size:11px; color:rgba(255,248,231,0.2); letter-spacing:0.03em; }

  @keyframes kbSpin { to { transform:rotate(360deg); } }
  .ds-spin { animation:kbSpin 0.8s linear infinite; }

  @media(max-width:480px) {
    .ds-brand   { padding: 36px 22px 0; margin-bottom: 24px; }
    .ds-form    { padding: 0 22px; }
    .ds-divider { margin: 24px 22px 20px; }
    .ds-socials { padding: 0 22px; }
    .ds-social-labels { padding: 8px 22px 0; }
    .ds-wordmark { font-size:22px; }
    .ds-secure  { padding-bottom: 24px; }
  }
`;
