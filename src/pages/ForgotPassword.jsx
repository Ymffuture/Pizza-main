import { useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { forgotPassword } from "../api/auth.api";
import { Flame, Mail, ArrowLeft, Send, Loader, CheckCircle2 } from "lucide-react";

const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_RESET_TEMPLATE_ID;
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const APP_URL      = import.meta.env.VITE_APP_URL || "https://foodsorder.vercel.app";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await forgotPassword(email.trim());

      // Backend returned the token — now fire EmailJS client-side
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

  return (
    <div className="auth-root">
      <style>{sharedStyles}</style>

      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo"><Flame className="w-6 h-6" style={{ color: "#0e0700" }} /></div>
          <h1 className="auth-brand">KOTABITES</h1>
        </div>

        {done ? (
          <div className="fp-done">
            <div className="fp-done-icon"><CheckCircle2 className="w-8 h-8" style={{ color: "#4ade80" }} /></div>
            <h2 className="auth-title">Check your inbox</h2>
            <p className="auth-sub">
              If <strong style={{ color: "#FFC72C" }}>{email}</strong> is registered, a reset link
              has been sent. It expires in 30 minutes.
            </p>
            <Link to="/login" className="fp-back-link"><ArrowLeft className="w-4 h-4" /> Back to Sign In</Link>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <h2 className="auth-title">Forgot password?</h2>
              <p className="auth-sub">Enter your email and we'll send a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className={`auth-input-wrap${error ? " auth-input-error" : ""}`}>
                  <Mail className="auth-icon" />
                  <input
                    type="email" className="auth-input" placeholder="you@example.com"
                    value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    autoFocus
                  />
                </div>
                {error && <p className="auth-error">{error}</p>}
              </div>

              <button type="submit" disabled={loading || !email.trim()} className="auth-submit">
                {loading
                  ? <><Loader className="w-5 h-5 auth-spin" /> Sending…</>
                  : <><Send className="w-5 h-5" /> Send Reset Link</>}
              </button>
            </form>

            <p className="auth-switch">
              <Link to="/login" className="fp-back-link"><ArrowLeft className="w-4 h-4" /> Back to Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root {
    --red:#DA291C; --red2:#b91c1c; --gold:#FFC72C;
    --dark:#0e0700; --card:#1a0e00;
    --border:rgba(255,199,44,0.12); --text:#fff8e7;
    --muted:rgba(255,248,231,0.42); --input-bg:rgba(255,248,231,0.05);
  }
  .auth-root { min-height:100vh; background:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(218,41,28,0.2) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 50% 100%,rgba(255,199,44,0.08) 0%,transparent 60%),var(--dark); display:flex; align-items:center; justify-content:center; padding:24px 16px; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
  .auth-card { width:100%; max-width:420px; background:var(--card); border:1px solid var(--border); border-radius:24px; padding:36px 32px; box-shadow:0 24px 64px rgba(0,0,0,0.5); }
  .auth-logo-wrap { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:28px; }
  .auth-logo { width:40px; height:40px; background:var(--gold); border-radius:11px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(255,199,44,0.3); }
  .auth-brand { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:3px; color:var(--text); line-height:1; }
  .auth-heading { text-align:center; margin-bottom:28px; }
  .auth-title { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:2px; color:var(--text); line-height:1; margin:0; }
  .auth-sub { font-size:13px; color:var(--muted); margin-top:6px; line-height:1.5; }
  .auth-form { display:flex; flex-direction:column; gap:16px; }
  .auth-field { display:flex; flex-direction:column; gap:6px; }
  .auth-label { font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); }
  .auth-input-wrap { display:flex; align-items:center; gap:10px; background:var(--input-bg); border:1.5px solid var(--border); border-radius:12px; padding:0 14px; transition:border-color 0.2s; }
  .auth-input-wrap:focus-within { border-color:rgba(255,199,44,0.4); }
  .auth-input-error { border-color:rgba(218,41,28,0.5)!important; }
  .auth-icon { width:16px; height:16px; color:var(--muted); flex-shrink:0; }
  .auth-input { flex:1; background:none; border:none; outline:none; color:var(--text); font-size:14px; font-weight:500; font-family:'Plus Jakarta Sans',sans-serif; padding:13px 0; }
  .auth-input::placeholder { color:var(--muted); }
  .auth-error { font-size:11px; font-weight:700; color:#f87171; }
  .auth-submit { display:flex; align-items:center; justify-content:center; gap:10px; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:900; font-size:15px; padding:15px; border-radius:14px; margin-top:4px; box-shadow:0 6px 20px rgba(218,41,28,0.4); transition:all 0.2s; }
  .auth-submit:hover:not(:disabled) { background:var(--red2); transform:scale(1.02); }
  .auth-submit:disabled { opacity:0.5; cursor:not-allowed; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .auth-spin { animation:spin 0.8s linear infinite; }
  .auth-switch { text-align:center; font-size:13px; color:var(--muted); margin-top:20px; }
  .auth-link { color:var(--gold); font-weight:700; text-decoration:none; }
  .auth-link:hover { opacity:0.8; }
  .auth-divider { display:flex; align-items:center; gap:12px; }
  .auth-divider-line { flex:1; height:1px; background:var(--border); }
  .auth-divider-text { font-size:11px; color:var(--muted); font-weight:600; }
  /* ForgotPassword extras */
  .fp-done { display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center; padding:8px 0; }
  .fp-done-icon { width:64px; height:64px; background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.25); border-radius:18px; display:flex; align-items:center; justify-content:center; }
  .fp-back-link { display:inline-flex; align-items:center; gap:6px; color:var(--gold); font-size:13px; font-weight:700; text-decoration:none; margin-top:4px; }
  .fp-back-link:hover { opacity:0.8; }
  @media(max-width:480px) { .auth-card { padding:28px 20px; } }
`;
