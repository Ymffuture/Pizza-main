import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Flame, Mail, Lock, LogIn, Loader, Eye, EyeOff, AlertCircle } from "lucide-react";
import GoogleButton   from "../components/GoogleButton";
import GitHubButton   from "../components/GitHubButton";
// import FacebookButton from "../components/FacebookButton"; // ← uncomment when Facebook app is ready

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/menu";

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email.trim().toLowerCase())) e.email = "Invalid email";
    if (!form.password.trim()) e.password = "Password is required";
    return e;
  };

  const handleOAuthSuccess = (data) => {
    toast.show({ type: "success", title: "Welcome!", message: data.user?.full_name || data.user?.email });
    navigate(redirect, { replace: true });
  };

  const handleOAuthError = (err) => {
    toast.show({ type: "error", title: "Sign-in failed", message: err?.message || "Try again" });
  };

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
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message ||
        "Login failed";

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

        <div className="auth-heading">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-sub">Sign in to place your order</p>
        </div>

        {needsVerification && (
          <div className="verification-banner">
            <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p className="verification-title">Email Not Verified</p>
              <p className="verification-text">Please check your inbox and click the verification link.</p>
            </div>
            <Link to="/verify-email" className="verification-link">Resend →</Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className={`auth-input-wrap${errors.email ? " auth-input-error" : ""}`}>
              <Mail className="auth-icon" />
              <input
                type="email" className="auth-input" placeholder="you@example.com"
                value={form.email.trim().toLowerCase()} onChange={handleChange("email")}
                autoComplete="email" disabled={loading}
              />
            </div>
            {errors.email && <p className="auth-error">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className={`auth-input-wrap${errors.password ? " auth-input-error" : ""}`}>
              <Lock className="auth-icon" />
              <input
                type={showPw ? "text" : "password"} className="auth-input" placeholder="••••••••"
                value={form.password} onChange={handleChange("password")}
                autoComplete="current-password" disabled={loading}
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw((s) => !s)} tabIndex={-1}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="auth-error">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading
              ? <><Loader className="w-5 h-5 auth-spin" /> Signing in…</>
              : <><LogIn className="w-5 h-5" /> Sign In</>}
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">OR</span>
          <div className="auth-divider-line" />
        </div>

        <div className="social-stack">
          {loading ? (
            <div className="auth-loading-text">
              <Loader className="w-4 h-4 auth-spin" />
              <span>Signing in with email...</span>
            </div>
          ) : (
            <>
              <GoogleButton  onSuccess={handleOAuthSuccess} onError={handleOAuthError} />
              <GitHubButton  onSuccess={handleOAuthSuccess} onError={handleOAuthError} />
              {/* Facebook — uncomment the line below once your Facebook app is configured:
              <FacebookButton onSuccess={handleOAuthSuccess} onError={handleOAuthError} />
              */}
            </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 14 }}>
          <Link to="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>
            Forgot your password?
          </Link>
        </p>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link to={`/register${redirect !== "/menu" ? `?redirect=${redirect}` : ""}`} className="auth-link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --red:#DA291C; --red2:#b91c1c; --gold:#FFC72C;
    --dark:#0e0700; --card:#1a0e00;
    --border:rgba(255,199,44,0.12); --text:#fff8e7;
    --muted:rgba(255,248,231,0.42); --input-bg:rgba(255,248,231,0.05);
  }

  .auth-root {
    min-height:100vh;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%,rgba(218,41,28,0.2) 0%,transparent 65%),
      radial-gradient(ellipse 50% 40% at 50% 100%,rgba(255,199,44,0.08) 0%,transparent 60%),
      var(--dark);
    display:flex; align-items:center; justify-content:center;
    padding:24px 16px;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  }

  .auth-card {
    width:100%; max-width:420px;
    background:var(--card); border:1px solid var(--border);
    border-radius:24px; padding:36px 32px;
    box-shadow:0 24px 64px rgba(0,0,0,0.5),0 0 0 1px rgba(255,199,44,0.06);
  }

  .auth-logo-wrap { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:28px; }
  .auth-logo { width:40px; height:40px; background:var(--gold); border-radius:11px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(255,199,44,0.3); }
  .auth-brand { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:3px; color:var(--text); line-height:1; }

  .auth-heading { text-align:center; margin-bottom:28px; }
  .auth-title { font-family:'Bebas Neue',sans-serif; font-size:30px; letter-spacing:2px; color:var(--text); line-height:1; }
  .auth-sub { font-size:13px; color:var(--muted); margin-top:4px; }

  .verification-banner { display:flex; align-items:flex-start; gap:12px; background:rgba(218,41,28,0.08); border:1px solid rgba(218,41,28,0.25); border-radius:14px; padding:12px 14px; margin-bottom:20px; animation:slideIn 0.3s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  .verification-banner > svg { color:#f87171; margin-top:2px; }
  .verification-title { font-size:12px; font-weight:800; color:var(--text); margin:0 0 3px; }
  .verification-text  { font-size:11px; color:var(--muted); line-height:1.4; margin:0; }
  .verification-link  { color:var(--gold); font-size:12px; font-weight:700; text-decoration:none; white-space:nowrap; transition:opacity 0.2s; }
  .verification-link:hover { opacity:0.8; }

  .auth-form  { display:flex; flex-direction:column; gap:16px; }
  .auth-field { display:flex; flex-direction:column; gap:6px; }
  .auth-label { font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); }
  .auth-input-wrap { display:flex; align-items:center; gap:10px; background:var(--input-bg); border:1.5px solid var(--border); border-radius:12px; padding:0 14px; transition:border-color 0.2s; }
  .auth-input-wrap:focus-within { border-color:rgba(255,199,44,0.4); }
  .auth-input-error { border-color:rgba(218,41,28,0.5)!important; }
  .auth-icon { width:16px; height:16px; color:var(--muted); flex-shrink:0; }
  .auth-input { flex:1; background:none; border:none; outline:none; color:var(--text); font-size:14px; font-weight:500; font-family:'Plus Jakarta Sans',sans-serif; padding:13px 0; }
  .auth-input::placeholder { color:var(--muted); }
  .auth-pw-toggle { color:var(--muted); background:none; border:none; cursor:pointer; display:flex; align-items:center; padding:0; transition:color 0.2s; }
  .auth-pw-toggle:hover { color:var(--text); }
  .auth-error { font-size:11px; font-weight:700; color:#f87171; }

  .auth-submit { display:flex; align-items:center; justify-content:center; gap:10px; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:900; font-size:15px; padding:15px; border-radius:14px; margin-top:4px; box-shadow:0 6px 20px rgba(218,41,28,0.4); transition:all 0.2s; }
  .auth-submit:hover:not(:disabled) { background:var(--red2); transform:scale(1.02); }
  .auth-submit:disabled { opacity:0.55; cursor:not-allowed; }

  @keyframes spin { to { transform:rotate(360deg); } }
  .auth-spin { animation:spin 0.8s linear infinite; }

  .auth-divider { display:flex; align-items:center; gap:12px; margin:20px 0 16px; }
  .auth-divider-line { flex:1; height:1px; background:var(--border); }
  .auth-divider-text { font-size:11px; color:var(--muted); font-weight:600; }

  .social-stack { display:flex; flex-direction:column; gap:10px; }

  .auth-loading-text { display:flex; align-items:center; justify-content:center; gap:8px; font-size:13px; color:var(--muted); padding:10px 0; }

  .auth-switch { text-align:center; font-size:13px; color:var(--muted); margin-top:20px; }
  .auth-link { color:var(--gold); font-weight:700; text-decoration:none; transition:opacity 0.2s; }
  .auth-link:hover { opacity:0.8; }

  @media (max-width:480px) { .auth-card { padding:28px 20px; } }
`;
