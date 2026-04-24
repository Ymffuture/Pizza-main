// src/pages/Register.jsx  — DeepSeek-style layout · KOTABITES branding
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Flame, Eye, EyeOff, Loader, CheckCircle2 } from "lucide-react";

/* ── Reusable pill input (text / email / tel) ── */
function PillInput({ placeholder, type = "text", value, onChange, autoComplete, disabled, hasError, ...rest }) {
  return (
    <input
      type={type}
      className={`ds-input${hasError ? " ds-input--err" : ""}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      disabled={disabled}
      {...rest}
    />
  );
}

/* ── Reusable pill password input ── */
function PillPassword({ placeholder, value, onChange, autoComplete, disabled, hasError, show, onToggle, ...rest }) {
  return (
    <div className={`ds-pw-wrap${hasError ? " ds-input--err" : ""}`}>
      <input
        type={show ? "text" : "password"}
        className="ds-input ds-input--pw"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        disabled={disabled}
        {...rest}
      />
      <button type="button" className="ds-eye" onClick={onToggle} tabIndex={-1} aria-label={show ? "Hide" : "Show"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function Register() {
  const navigate     = useNavigate();
  const { register } = useAuth();
  const toast        = useToast();

  const [form, setForm]     = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading]       = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);

  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/menu";

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())  e.full_name = "Full name is required";
    if (!form.email.trim())      e.email     = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())      e.phone     = "Phone number is required";
    else if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Must be 10 digits starting with 0";
    if (!form.password.trim())   e.password  = "Password is required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords don't match";
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
      });
      toast.show({ type: "success", title: "Account created!", message: "Check your email to verify." });
      setRegistered(true);
      setTimeout(() => navigate("/verify-email"), 90000);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message ||
        "Registration failed";
      toast.show({ type: "error", title: "Sign up failed", message: msg });
    } finally {
      setLoading(false);
    }
  };

  /* ── Post-registration success screen ── */
  if (registered) {
    return (
      <div className="ds-root">
        <style>{styles}</style>
        <div className="ds-card ds-card--success">
          <div className="ds-brand">
            <div className="ds-flame"><Flame size={22} color="#0e0700" strokeWidth={2.5} /></div>
            <span className="ds-wordmark">KOTABITES</span>
          </div>
          <div className="ds-success-body">
            <div className="ds-success-icon">
              <CheckCircle2 size={36} color="#0e0700" strokeWidth={2.5} />
            </div>
            <h2 className="ds-success-title">Check your email</h2>
            <p className="ds-success-sub">
              We sent a verification link to{" "}
              <strong style={{ color: "var(--kb-gold)" }}>{form.email}</strong>.
              <br />Please verify before signing in.
            </p>
            <Link to="/verify-email" className="ds-cta ds-cta--link" style={{ marginTop: 24, display: "flex" }}>
              Go to verification →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-root">
      <style>{styles}</style>

      <div className="ds-card">

        {/* ── Brand ── */}
        <div className="ds-brand">
          <div className="ds-flame">
            <Flame size={22} color="#0e0700" strokeWidth={2.5} />
          </div>
          <span className="ds-wordmark">KOTABITES</span>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="ds-form">

          {/* Full name */}
          <div className="ds-field">
            <PillInput
              placeholder="Full name"
              value={form.full_name}
              onChange={handleChange("full_name")}
              autoComplete="name"
              disabled={loading}
              hasError={!!errors.full_name}
            />
            {errors.full_name && <p className="ds-err">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div className="ds-field">
            <PillInput
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange("email")}
              autoComplete="email"
              disabled={loading}
              hasError={!!errors.email}
            />
            {errors.email && <p className="ds-err">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="ds-field">
            <PillInput
              type="tel"
              placeholder="Phone number (e.g. 082 123 4567)"
              value={form.phone}
              onChange={handleChange("phone")}
              autoComplete="tel"
              disabled={loading}
              hasError={!!errors.phone}
            />
            {errors.phone && <p className="ds-err">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div className="ds-field">
            <PillPassword
              placeholder="Password (min. 6 characters)"
              value={form.password}
              onChange={handleChange("password")}
              autoComplete="new-password"
              disabled={loading}
              hasError={!!errors.password}
              show={showPw}
              onToggle={() => setShowPw((s) => !s)}
            />
            {errors.password && <p className="ds-err">{errors.password}</p>}
          </div>

          {/* Confirm password */}
          <div className="ds-field">
            <PillPassword
              placeholder="Confirm password"
              value={form.confirm}
              onChange={handleChange("confirm")}
              autoComplete="new-password"
              disabled={loading}
              hasError={!!errors.confirm}
              show={showConfirm}
              onToggle={() => setShowConfirm((s) => !s)}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
            />
            {errors.confirm && <p className="ds-err">{errors.confirm}</p>}
          </div>

          {/* Terms */}
          <p className="ds-terms">
            By creating an account you agree to KOTABITES&rsquo;{" "}
            <Link to="/terms" className="ds-terms-link">Terms of Use</Link>{" "}
            and{" "}
            <Link to="/privacy" className="ds-terms-link">Privacy Policy</Link>.
          </p>

          {/* Already have an account row */}
          <div className="ds-row">
            <span className="ds-muted-text">Already have an account?</span>
            <Link
              to={`/login${redirect !== "/menu" ? `?redirect=${redirect}` : ""}`}
              className="ds-text-link"
            >
              Sign in
            </Link>
          </div>

          {/* CTA */}
          <button type="submit" disabled={loading} className="ds-cta">
            {loading
              ? <><Loader size={18} className="ds-spin" /> Creating account…</>
              : "Create Account"}
          </button>

        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --kb-red:    #DA291C;
    --kb-red2:   #b91c1c;
    --kb-gold:   #FFC72C;
    --kb-dark:   #0e0700;
    --kb-card:   #1a0e00;
    --kb-border: rgba(255,199,44,0.14);
    --kb-text:   #fff8e7;
    --kb-muted:  rgba(255,248,231,0.42);
    --kb-input:  rgba(255,248,231,0.05);
    --kb-ring:   rgba(255,199,44,0.35);
  }

  /* ── Root ── */
  .ds-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 90% 55% at 50% -10%, rgba(218,41,28,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 50% 110%, rgba(255,199,44,0.07) 0%, transparent 55%),
      var(--kb-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  /* ── Card ── */
  .ds-card {
    width: 100%;
    max-width: 400px;
    padding: 48px 36px 40px;
    background: var(--kb-card);
    border: 1px solid var(--kb-border);
    border-radius: 28px;
    box-shadow:
      0 32px 72px rgba(0,0,0,0.55),
      0 0 0 1px rgba(255,199,44,0.05);
  }
  .ds-card--success { text-align: center; }

  /* ── Brand ── */
  .ds-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 36px;
  }
  .ds-flame {
    width: 38px; height: 38px;
    background: var(--kb-gold);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 22px rgba(255,199,44,0.32);
  }
  .ds-wordmark {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px;
    letter-spacing: 4px;
    color: var(--kb-text);
    line-height: 1;
  }

  /* ── Success screen ── */
  .ds-success-body { display: flex; flex-direction: column; align-items: center; }
  .ds-success-icon {
    width: 72px; height: 72px;
    background: var(--kb-gold);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 32px rgba(255,199,44,0.3);
    margin-bottom: 20px;
  }
  .ds-success-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px; letter-spacing: 2px;
    color: var(--kb-text); margin: 0 0 12px;
  }
  .ds-success-sub {
    font-size: 13px; color: var(--kb-muted);
    line-height: 1.6; margin: 0;
  }

  /* ── Form ── */
  .ds-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Field wrapper ── */
  .ds-field { display: flex; flex-direction: column; gap: 5px; }

  /* ── Pill input ── */
  .ds-input {
    width: 100%;
    box-sizing: border-box;
    background: var(--kb-input);
    border: 1.5px solid var(--kb-border);
    border-radius: 999px;
    padding: 13px 20px;
    color: var(--kb-text);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ds-input::placeholder { color: var(--kb-muted); }
  .ds-input:focus {
    border-color: var(--kb-ring);
    box-shadow: 0 0 0 3px rgba(255,199,44,0.08);
  }
  .ds-input--err { border-color: rgba(218,41,28,0.55) !important; }

  /* ── Password pill wrapper ── */
  .ds-pw-wrap {
    display: flex;
    align-items: center;
    background: var(--kb-input);
    border: 1.5px solid var(--kb-border);
    border-radius: 999px;
    padding: 0 16px 0 20px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ds-pw-wrap:focus-within {
    border-color: var(--kb-ring);
    box-shadow: 0 0 0 3px rgba(255,199,44,0.08);
  }
  .ds-pw-wrap.ds-input--err { border-color: rgba(218,41,28,0.55) !important; }
  .ds-input--pw {
    flex: 1;
    background: none;
    border: none;
    border-radius: 0;
    padding: 13px 0;
    box-shadow: none !important;
    outline: none;
  }
  .ds-eye {
    background: none; border: none; cursor: pointer;
    color: var(--kb-muted);
    display: flex; align-items: center;
    padding: 0; transition: color 0.2s; flex-shrink: 0;
  }
  .ds-eye:hover { color: var(--kb-text); }

  .ds-err { font-size: 11px; font-weight: 700; color: #f87171; padding-left: 8px; }

  /* ── Terms ── */
  .ds-terms {
    font-size: 12px;
    color: var(--kb-muted);
    line-height: 1.5;
    margin: 2px 0 0;
  }
  .ds-terms-link {
    color: var(--kb-text);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: rgba(255,248,231,0.25);
  }
  .ds-terms-link:hover { color: var(--kb-gold); text-decoration-color: var(--kb-gold); }

  /* ── Sign-in row ── */
  .ds-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ds-muted-text { font-size: 13px; color: var(--kb-muted); }
  .ds-text-link {
    font-size: 13px; font-weight: 600;
    color: var(--kb-gold); text-decoration: none;
    transition: opacity 0.2s;
  }
  .ds-text-link:hover { opacity: 0.75; }

  /* ── CTA button ── */
  .ds-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 15px;
    background: var(--kb-red);
    color: #fff;
    border: none;
    border-radius: 999px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.02em;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 6px 22px rgba(218,41,28,0.38);
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    margin-top: 4px;
  }
  .ds-cta:hover:not(:disabled) {
    background: var(--kb-red2);
    transform: scale(1.015);
    box-shadow: 0 8px 28px rgba(218,41,28,0.46);
  }
  .ds-cta:active:not(:disabled) { transform: scale(0.99); }
  .ds-cta:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Spinner */
  @keyframes kbSpin { to { transform: rotate(360deg); } }
  .ds-spin { animation: kbSpin 0.8s linear infinite; }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .ds-card { padding: 36px 22px 32px; }
    .ds-wordmark { font-size: 22px; }
  }
`;
