import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/auth.api";
import { Flame, Lock, Eye, EyeOff, CheckCircle2, Loader, ShieldCheck } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");

  const [pw,        setPw]       = useState("");
  const [confirm,   setConfirm]  = useState("");
  const [showPw,    setShowPw]   = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [done,      setDone]     = useState(false);
  const [error,     setError]    = useState("");

  if (!token) {
    return (
      <div className="auth-root">
        <style>{`${styles}`}</style>
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p style={{ color: "#f87171", fontWeight: 700 }}>Invalid reset link. Please request a new one.</p>
          <Link to="/forgot-password" className="auth-link" style={{ display: "block", marginTop: 16 }}>Request reset →</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw.length < 6)         return setError("Password must be at least 6 characters");
    if (pw !== confirm)        return setError("Passwords don't match");
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

  return (
    <div className="auth-root">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo"><Flame className="w-6 h-6" style={{ color: "#0e0700" }} /></div>
          <h1 className="auth-brand">KOTABITES</h1>
        </div>

        {done ? (
          <div className="rp-done">
            <CheckCircle2 className="w-12 h-12" style={{ color: "#4ade80" }} />
            <h2 className="auth-title">Password Reset!</h2>
            <p className="auth-sub">Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <div className="rp-icon"><ShieldCheck className="w-6 h-6" style={{ color: "#FFC72C" }} /></div>
              <h2 className="auth-title" style={{ marginTop: 10 }}>Set New Password</h2>
              <p className="auth-sub">Choose a strong password to secure your account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* New password */}
              <div className="auth-field">
                <label className="auth-label">New Password</label>
                <div className={`auth-input-wrap${error ? " auth-input-error" : ""}`}>
                  <Lock className="auth-icon" />
                  <input
                    type={showPw ? "text" : "password"} className="auth-input"
                    placeholder="Min. 6 characters" value={pw}
                    onChange={(e) => { setPw(e.target.value); setError(""); }}
                    autoFocus
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(s => !s)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div className="auth-field">
                <label className="auth-label">Confirm Password</label>
                <div className={`auth-input-wrap${error ? " auth-input-error" : ""}`}>
                  <Lock className="auth-icon" />
                  <input
                    type={showPw ? "text" : "password"} className="auth-input"
                    placeholder="Repeat password" value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  />
                </div>
                {error && <p className="auth-error">{error}</p>}
              </div>

              <button type="submit" disabled={loading} className="auth-submit">
                {loading
                  ? <><Loader className="w-5 h-5 auth-spin" /> Resetting…</>
                  : <><ShieldCheck className="w-5 h-5" /> Reset Password</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// Re-use the same shared styles string from ForgotPassword + additions
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root { --red:#DA291C; --red2:#b91c1c; --gold:#FFC72C; --dark:#0e0700; --card:#1a0e00; --border:rgba(255,199,44,0.12); --text:#fff8e7; --muted:rgba(255,248,231,0.42); --input-bg:rgba(255,248,231,0.05); }
  .auth-root { min-height:100vh; background:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(218,41,28,0.2) 0%,transparent 65%),var(--dark); display:flex; align-items:center; justify-content:center; padding:24px 16px; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
  .auth-card { width:100%; max-width:420px; background:var(--card); border:1px solid var(--border); border-radius:24px; padding:36px 32px; box-shadow:0 24px 64px rgba(0,0,0,0.5); }
  .auth-logo-wrap { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:28px; }
  .auth-logo { width:40px; height:40px; background:var(--gold); border-radius:11px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(255,199,44,0.3); }
  .auth-brand { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:3px; color:var(--text); line-height:1; }
  .auth-heading { text-align:center; margin-bottom:24px; }
  .rp-icon { width:48px; height:48px; background:rgba(255,199,44,0.1); border:1px solid rgba(255,199,44,0.2); border-radius:14px; display:flex; align-items:center; justify-content:center; margin:0 auto; }
  .auth-title { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:2px; color:var(--text); line-height:1; margin:0; }
  .auth-sub { font-size:13px; color:var(--muted); margin-top:6px; }
  .auth-form { display:flex; flex-direction:column; gap:16px; }
  .auth-field { display:flex; flex-direction:column; gap:6px; }
  .auth-label { font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); }
  .auth-input-wrap { display:flex; align-items:center; gap:10px; background:var(--input-bg); border:1.5px solid var(--border); border-radius:12px; padding:0 14px; transition:border-color 0.2s; }
  .auth-input-wrap:focus-within { border-color:rgba(255,199,44,0.4); }
  .auth-input-error { border-color:rgba(218,41,28,0.5)!important; }
  .auth-icon { width:16px; height:16px; color:var(--muted); flex-shrink:0; }
  .auth-input { flex:1; background:none; border:none; outline:none; color:var(--text); font-size:14px; font-weight:500; font-family:'Plus Jakarta Sans',sans-serif; padding:13px 0; }
  .auth-input::placeholder { color:var(--muted); }
  .auth-pw-toggle { color:var(--muted); background:none; border:none; cursor:pointer; display:flex; align-items:center; }
  .auth-error { font-size:11px; font-weight:700; color:#f87171; }
  .auth-submit { display:flex; align-items:center; justify-content:center; gap:10px; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:900; font-size:15px; padding:15px; border-radius:14px; box-shadow:0 6px 20px rgba(218,41,28,0.4); transition:all 0.2s; }
  .auth-submit:hover:not(:disabled) { background:var(--red2); transform:scale(1.02); }
  .auth-submit:disabled { opacity:0.5; cursor:not-allowed; }
  .auth-link { color:var(--gold); font-weight:700; text-decoration:none; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .auth-spin { animation:spin 0.8s linear infinite; }
  .rp-done { display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center; padding:16px 0; }
  @media(max-width:480px) { .auth-card { padding:24px 16px; } }
`;
