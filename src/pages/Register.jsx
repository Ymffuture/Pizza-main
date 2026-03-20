import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import {
  Flame, Mail, Lock, User, Phone,
  UserPlus, Loader, Eye, EyeOff, CheckCircle2
} from "lucide-react";

/* ── Field component OUTSIDE Register — prevents remount on every keystroke ── */
function Field({ name, label, type = "text", placeholder, icon: Icon, autoComplete, value, onChange, error, showPw, onTogglePw }) {
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <div className={`auth-input-wrap${error ? " auth-input-error" : ""}`}>
        <Icon className="auth-icon" />
        <input
          type={type === "password" ? (showPw ? "text" : "password") : type}
          className="auth-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
        />
        {type === "password" && (
          <button
            type="button"
            className="auth-pw-toggle"
            onClick={onTogglePw}
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

export default function Register() {
  const navigate      = useNavigate();
  const { register }  = useAuth();
  const toast         = useToast();

  const [form, setForm]       = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);

  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/menu";

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())  e.full_name = "Full name is required";
    if (!form.email.trim())      e.email     = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())      e.phone     = "Phone is required";
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
      
      // ✅ Show success message and verification instructions
      toast.show({ 
        type: "success", 
        title: "Account created!", 
        message: "Check your email to verify your account." 
      });
      
      setRegistered(true);
      
      // Redirect to verify email page after 1min 30 seconds
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

  // Show success screen after registration
  if (registered) {
    return (
      <div className="auth-root">
        <style>{authStyles}</style>
        <div className="auth-card">
          <div className="auth-logo-wrap">
            <div className="auth-logo">
              <Flame className="w-6 h-6" style={{ color: "#0e0700" }} />
            </div>
            <h1 className="auth-brand">KOTABITES</h1>
          </div>
          
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: "#4ade80" }} />
            <h2 className="auth-title">Check Your Email!</h2>
            <p className="auth-sub" style={{ marginTop: 12, marginBottom: 20 }}>
              We've sent a verification link to <strong style={{ color: "#FFC72C" }}>{form.email}</strong>
            </p>
            <p className="auth-sub">
              Please verify your email before signing in.
            </p>
            <Link 
              to="/verify-email" 
              className="auth-link" 
              style={{ display: "block", marginTop: 20, fontSize: 14 }}
            >
              Go to verification page →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <style>{authStyles}</style>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <div className="auth-logo">
            <Flame className="w-6 h-6" style={{ color: "#0e0700" }} />
          </div>
          <h1 className="auth-brand">KOTABITES</h1>
        </div>

        <div className="auth-heading">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-sub">Join us and start ordering</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Field
            name="full_name" label="Full Name" placeholder="Kgomotso Nkosi"
            icon={User} autoComplete="name"
            value={form.full_name} onChange={handleChange("full_name")} error={errors.full_name}
          />
          <Field
            name="email" label="Email" placeholder="you@example.com"
            icon={Mail} autoComplete="email"
            value={form.email.trim().toLowerCase()} onChange={handleChange("email")} error={errors.email}
          />
          <Field
            name="phone" label="Phone Number" placeholder="082 123 4567"
            icon={Phone} autoComplete="tel"
            value={form.phone} onChange={handleChange("phone")} error={errors.phone}
          />
          <Field
            name="password" label="Password" placeholder="Min. 6 characters"
            icon={Lock} type="password" autoComplete="new-password"
            value={form.password} onChange={handleChange("password")} error={errors.password}
            showPw={showPw} onTogglePw={() => setShowPw((s) => !s)}
          />
          <Field
  name="confirm"
  label="Confirm Password"
  placeholder="Repeat password"
  icon={Lock}
  type="password"
  autoComplete="new-password"          // ← Keep this (best for new-password UX)
  value={form.confirm}
  onChange={handleChange("confirm")}
  error={errors.confirm}
  showPw={showConfirm}
  onTogglePw={() => setShowConfirm((s) => !s)}
  
  // Add these to disable paste / copy / cut
  onPaste={(e) => e.preventDefault()}
  onCopy={(e) => e.preventDefault()}
  onCut={(e) => e.preventDefault()}
  
  // Optional: also block drag & drop (extra thorough)
  onDrop={(e) => e.preventDefault()}
  onDragStart={(e) => e.preventDefault()}
/>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? (
              <><Loader className="w-5 h-5 auth-spin" /> Creating account…</>
            ) : (
              <><UserPlus className="w-5 h-5" /> Create Account</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link
            to={`/login${redirect !== "/menu" ? `?redirect=${redirect}` : ""}`}
            className="auth-link"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --red:   #DA291C;
    --red2:  #b91c1c;
    --gold:  #FFC72C;
    --dark:  #0e0700;
    --card:  #1a0e00;
    --border: rgba(255,199,44,0.12);
    --text:  #fff8e7;
    --muted: rgba(255,248,231,0.42);
    --input-bg: rgba(255,248,231,0.05);
  }

  .auth-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(218,41,28,0.2) 0%, transparent 65%),
      radial-gradient(ellipse 50% 40% at 50% 100%, rgba(255,199,44,0.08) 0%, transparent 60%),
      var(--dark);
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .auth-card {
    width: 100%; max-width: 420px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 36px 32px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,199,44,0.06);
  }

  .auth-logo-wrap {
    display: flex; align-items: center; gap: 10px;
    justify-content: center; margin-bottom: 24px;
  }
  .auth-logo {
    width: 40px; height: 40px; background: var(--gold); border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(255,199,44,0.3);
  }
  .auth-brand {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px; letter-spacing: 3px; color: var(--text); line-height: 1;
  }

  .auth-heading { text-align: center; margin-bottom: 24px; }
  .auth-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 30px; letter-spacing: 2px; color: var(--text); line-height: 1;
  }
  .auth-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }

  .auth-form { display: flex; flex-direction: column; gap: 14px; }

  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-label {
    font-size: 11px; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
  }
  .auth-input-wrap {
    display: flex; align-items: center; gap: 10px;
    background: var(--input-bg);
    border: 1.5px solid var(--border); border-radius: 12px;
    padding: 0 14px; transition: border-color 0.2s;
  }
  .auth-input-wrap:focus-within { border-color: rgba(255,199,44,0.4); }
  .auth-input-error { border-color: rgba(218,41,28,0.5) !important; }
  .auth-icon { width: 16px; height: 16px; color: var(--muted); flex-shrink: 0; }
  .auth-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 12px 0;
  }
  .auth-input::placeholder { color: var(--muted); }
  .auth-pw-toggle {
    color: var(--muted); background: none; border: none; cursor: pointer;
    display: flex; align-items: center; padding: 0; transition: color 0.2s;
  }
  .auth-pw-toggle:hover { color: var(--text); }
  .auth-error { font-size: 11px; font-weight: 700; color: #f87171; }

  .auth-submit {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900; font-size: 15px;
    padding: 15px; border-radius: 14px; margin-top: 4px;
    box-shadow: 0 6px 20px rgba(218,41,28,0.4);
    transition: all 0.2s;
  }
  .auth-submit:hover:not(:disabled) { background: var(--red2); transform: scale(1.02); }
  .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .auth-spin { animation: spin 0.8s linear infinite; }

  .auth-switch {
    text-align: center; font-size: 13px;
    color: var(--muted); margin-top: 20px;
  }
  .auth-link {
    color: var(--gold); font-weight: 700; text-decoration: none;
    transition: opacity 0.2s;
  }
  .auth-link:hover { opacity: 0.8; }

  @media (max-width: 480px) {
    .auth-card { padding: 24px 16px; }
  }
`;
