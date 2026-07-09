// src/pages/Register.jsx — DeepSeek layout · borderless · password strength · KOTABITES
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Flame, Eye, EyeOff, Loader, CheckCircle2, ShieldCheck } from "lucide-react";
import { BsCheckCircleFill, BsCircle } from "react-icons/bs";

/* ── Password strength scorer ── */
const getStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)             s++;
  if (pw.length >= 10)            s++;
  if (/[A-Z]/.test(pw))          s++;
  if (/[0-9]/.test(pw))          s++;
  if (/[^A-Za-z0-9]/.test(pw))   s++;
  return s;
};
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#eab308", "#4ade80", "#22c55e"];

/* ── Single requirement row ── */
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

/* ── Reusable pill password ── */
function PillPassword({ placeholder, value, onChange, autoComplete, disabled, hasError, show, onToggle, ...rest }) {
  return (
    <div className={`ds-pw-wrap${hasError ? " ds-pw-err" : ""}`}>
      <input
        type={show ? "text" : "password"}
        className="ds-input ds-input--pw"
        placeholder={placeholder}
        value={value} onChange={onChange}
        autoComplete={autoComplete}
        disabled={disabled}
        {...rest}
      />
      <button type="button" className="ds-eye" onClick={onToggle} tabIndex={-1}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function Register() {
  const { t }         = useTranslation();
  const navigate     = useNavigate();
  const { register } = useAuth();
  const toast        = useToast();

  const [form, setForm]         = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showPw,  setShowPw]    = useState(false);
  const [showCf,  setShowCf]    = useState(false);
  const [registered, setRegistered] = useState(false);

  const redirect     = new URLSearchParams(window.location.search).get("redirect") || "/menu";
  const referralCode = new URLSearchParams(window.location.search).get("ref") || "";
  const strength   = getStrength(form.password);
  const pwMatch    = form.confirm && form.confirm === form.password;

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.full_name.trim())  e.full_name = t("auth.errFullNameRequired");
    if (!form.email.trim())      e.email     = t("auth.errEmailRequired");
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t("auth.errEmailInvalid");
    if (!form.phone.trim())      e.phone     = t("auth.errPhoneRequired");
    else if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = t("auth.errPhoneFormat");
    if (!form.password.trim())   e.password  = t("auth.errPasswordRequired");
    else if (form.password.length < 6) e.password = t("auth.errPasswordMin");
    if (form.confirm !== form.password) e.confirm = t("auth.errConfirmMismatch");
    return e;
  };

  const handleChange = (field) => (ev) => {
    setForm((p) => ({ ...p, [field]: ev.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email:     form.email.trim().toLowerCase(),
        phone:     form.phone.replace(/\s/g, ""),
        password:  form.password,
        ...(referralCode ? { referral_code: referralCode } : {}),
      });
      toast.show({ type: "success", title: t("auth.toastAccountCreated"), message: t("auth.toastCheckEmailVerify") });
      setRegistered(true);
      setTimeout(() => navigate("/verify-email"), 90000);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err.message || t("auth.toastRegistrationFailed");
      toast.show({ type: "error", title: t("auth.toastSignupFailed"), message: msg });
    } finally {
      setLoading(false);
    }
  };

  /* ── Post-registration success ── */
  if (registered) {
    return (
      <div className="ds-root">
        <style>{styles}</style>
        <div className="ds-card" style={{ textAlign: "center" }}>
          <div className="ds-brand">
            <div className="ds-flame"><Flame size={22} color="#0e0700" strokeWidth={2.5} /></div>
            <span className="ds-wordmark">KOTABITES</span>
          </div>
          <div className="ds-success-icon">
            <CheckCircle2 size={36} color="#0e0700" strokeWidth={2.5} />
          </div>
          <h2 className="ds-success-title">{t("auth.checkEmailTitle")}</h2>
          <p className="ds-success-sub">
            {t("auth.checkEmailSub")}{" "}
            <strong style={{ color: "var(--kb-gold)" }}>{form.email}</strong>.
            <br />{t("auth.checkEmailSub2")}
          </p>
          <Link to="/verify-email" className="ds-cta" style={{ marginTop: 24, display: "flex", textDecoration: "none" }}>
            {t("auth.goToVerification")}
          </Link>
        </div>
      </div>
    );
  }

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

        <form onSubmit={handleSubmit} className="ds-form">

          {referralCode && (
            <div className="ds-referral-banner">
              <ShieldCheck size={14} /> {t("auth.referralBanner")}
            </div>
          )}

          {/* Full name */}
          <div className="ds-field">
            <input
              type="text" className={`ds-input${errors.full_name ? " ds-input--err" : ""}`}
              placeholder={t("auth.fullNamePlaceholder")}
              value={form.full_name} onChange={handleChange("full_name")}
              autoComplete="name" disabled={loading}
            />
            {errors.full_name && <p className="ds-err">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div className="ds-field">
            <input
              type="email" className={`ds-input${errors.email ? " ds-input--err" : ""}`}
              placeholder={t("auth.emailOnlyPlaceholder")}
              value={form.email} onChange={handleChange("email")}
              autoComplete="email" disabled={loading}
            />
            {errors.email && <p className="ds-err">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="ds-field">
            <input
              type="tel" className={`ds-input${errors.phone ? " ds-input--err" : ""}`}
              placeholder={t("auth.phonePlaceholder")}
              value={form.phone} onChange={handleChange("phone")}
              autoComplete="tel" disabled={loading}
            />
            {errors.phone && <p className="ds-err">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div className="ds-field">
            <PillPassword
              placeholder={t("auth.passwordMinPlaceholder")}
              value={form.password} onChange={handleChange("password")}
              autoComplete="new-password" disabled={loading}
              hasError={!!errors.password}
              show={showPw} onToggle={() => setShowPw((s) => !s)}
            />
            {errors.password && <p className="ds-err">{errors.password}</p>}

            {/* Strength bar */}
            {form.password && (
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
                  {strength ? t(`auth.strength.${strength}`) : ""}
                </span>
              </div>
            )}

            {/* Requirements checklist */}
            {form.password && (
              <div className="ds-reqs">
                <Req met={form.password.length >= 6}           text={t("auth.reqLength")} />
                <Req met={/[A-Z]/.test(form.password)}         text={t("auth.reqUppercase")} />
                <Req met={/[0-9]/.test(form.password)}         text={t("auth.reqNumber")} />
                <Req met={/[^A-Za-z0-9]/.test(form.password)}  text={t("auth.reqSpecial")} />
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="ds-field">
            <PillPassword
              placeholder={t("auth.confirmPasswordPlaceholder")}
              value={form.confirm} onChange={handleChange("confirm")}
              autoComplete="new-password" disabled={loading}
              hasError={!!errors.confirm}
              show={showCf} onToggle={() => setShowCf((s) => !s)}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
            />
            {errors.confirm
              ? <p className="ds-err">{errors.confirm}</p>
              : form.confirm && (
                  <p className="ds-match" style={{ color: pwMatch ? "#4ade80" : "#f87171" }}>
                    {pwMatch ? t("auth.passwordsMatch") : t("auth.passwordsDontMatch")}
                  </p>
                )}
          </div>

          {/* Terms */}
          <p className="ds-terms">
            {t("auth.termsPrefixRegister")}{" "}
            <Link to="/terms" className="ds-terms-link">{t("auth.termsOfUse")}</Link>{" "}
            {t("auth.and")} <Link to="/privacy" className="ds-terms-link">{t("auth.privacyPolicy")}</Link>.
          </p>

          {/* Already have an account */}
          <div className="ds-row">
            <span className="ds-muted-text">{t("auth.alreadyHaveAccount")}</span>
            <Link to={`/login${redirect !== "/menu" ? `?redirect=${redirect}` : ""}`} className="ds-text-link">
              {t("auth.signIn")}
            </Link>
          </div>

          {/* CTA */}
          <button type="submit" disabled={loading} className="ds-cta">
            {loading ? <><Loader size={18} className="ds-spin" /> {t("auth.creatingAccount")}</> : t("auth.createAccount")}
          </button>
        </form>

        {/* Security badge */}
        <div className="ds-secure">
          <ShieldCheck size={12} color="rgba(255,248,231,0.25)" />
          <span>{t("auth.secureData")}</span>
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

  .ds-brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:32px; }
  .ds-flame { width:38px; height:38px; background:var(--kb-gold); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 22px rgba(255,199,44,0.32); }
  .ds-wordmark { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:4px; color:var(--kb-text); line-height:1; }

  .ds-success-icon { width:72px; height:72px; background:var(--kb-gold); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 32px rgba(255,199,44,0.3); margin:0 auto 18px; }
  .ds-success-title { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:2px; color:var(--kb-text); margin:0 0 12px; }
  .ds-success-sub { font-size:13px; color:var(--kb-muted); line-height:1.6; margin:0; }

  .ds-form  { display:flex; flex-direction:column; gap:12px; }
  .ds-field { display:flex; flex-direction:column; gap:5px; }

  /* pill input — no border */
  .ds-input {
    width:100%; box-sizing:border-box;
    background:var(--kb-input); border:none; border-radius:999px;
    padding:13px 20px; color:var(--kb-text);
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
  .ds-input--pw { flex:1; background:none; border:none; border-radius:0; padding:13px 0; box-shadow:none !important; outline:none; color:var(--kb-text); font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500; }
  .ds-input--pw::placeholder { color:var(--kb-muted); }
  .ds-eye { background:none; border:none; cursor:pointer; color:var(--kb-muted); display:flex; align-items:center; padding:0; transition:color 0.2s; flex-shrink:0; }
  .ds-eye:hover { color:var(--kb-text); }
  .ds-err   { font-size:11px; font-weight:700; color:#f87171; padding-left:8px; }
  .ds-match { font-size:11px; font-weight:700; padding-left:8px; }

  /* strength bar */
  .ds-strength { display:flex; align-items:center; gap:8px; padding:4px 8px 0; }
  .ds-strength-bar { display:flex; gap:4px; flex:1; }
  .ds-strength-seg { flex:1; height:3px; border-radius:999px; transition:background 0.3s; }
  .ds-strength-label { font-size:10px; font-weight:700; white-space:nowrap; transition:color 0.3s; }

  /* requirements checklist */
  .ds-reqs { display:flex; flex-direction:column; gap:5px; padding:6px 8px 2px; }
  .ds-req { display:flex; align-items:center; gap:6px; font-size:11px; }
  .ds-referral-banner {
    display:flex; align-items:center; gap:8px;
    background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3);
    color:#4ade80; font-size:12px; font-weight:600; line-height:1.4;
    padding:10px 12px; border-radius:10px; margin-bottom:14px;
  }

  .ds-terms { font-size:12px; color:var(--kb-muted); line-height:1.5; margin:2px 0 0; }
  .ds-terms-link { color:var(--kb-text); font-weight:600; text-decoration:underline; text-underline-offset:2px; text-decoration-color:rgba(255,248,231,0.25); }
  .ds-terms-link:hover { color:var(--kb-gold); text-decoration-color:var(--kb-gold); }

  .ds-row { display:flex; justify-content:space-between; align-items:center; }
  .ds-muted-text { font-size:13px; color:var(--kb-muted); }
  .ds-text-link { font-size:13px; font-weight:600; color:var(--kb-gold); text-decoration:none; transition:opacity 0.2s; }
  .ds-text-link:hover { opacity:0.75; }

  .ds-cta { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:15px; background:var(--kb-red); color:#fff; border:none; border-radius:999px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:800; letter-spacing:0.02em; cursor:pointer; box-shadow:0 6px 22px rgba(218,41,28,0.38); transition:background 0.2s, transform 0.15s, box-shadow 0.2s; margin-top:4px; }
  .ds-cta:hover:not(:disabled) { background:var(--kb-red2); transform:scale(1.015); box-shadow:0 8px 28px rgba(218,41,28,0.46); }
  .ds-cta:active:not(:disabled) { transform:scale(0.99); }
  .ds-cta:disabled { opacity:0.5; cursor:not-allowed; }

  .ds-secure { display:flex; align-items:center; justify-content:center; gap:5px; margin-top:20px; font-size:11px; color:rgba(255,248,231,0.25); letter-spacing:0.03em; }

  @keyframes kbSpin { to { transform:rotate(360deg); } }
  .ds-spin { animation:kbSpin 0.8s linear infinite; }

  @media(max-width:480px) { .ds-card { padding:36px 22px 30px; } .ds-wordmark { font-size:22px; } }
`;
