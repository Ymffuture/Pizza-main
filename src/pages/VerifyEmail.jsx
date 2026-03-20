import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyEmail, sendVerification } from "../api/auth.api";
import emailjs from "@emailjs/browser";
import { useAuth } from "../context/AuthContext";
import { Flame, CheckCircle2, XCircle, Loader, Mail } from "lucide-react";

const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_VERIFY_TEMPLATE_ID;
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const APP_URL      = import.meta.env.VITE_APP_URL || "https://foodsorder.vercel.app";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = new URLSearchParams(window.location.search).get("token");

  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [msg,   setMsg]   = useState("");
  const [resending, setResending] = useState(false);

  // Auto-verify on mount if token present
  useEffect(() => {
    if (!token) return;
    setState("loading");
    verifyEmail(token)
      .then(() => { setState("success"); setTimeout(() => navigate("/login"), 3000); })
      .catch((err) => {
        setState("error");
        setMsg(err?.response?.data?.detail || "Verification failed — link may have expired.");
      });
  }, [token]); // eslint-disable-line

  // Resend verification email
  const handleResend = async () => {
    setResending(true);
    try {
      const res = await sendVerification();
      if (res.data.token) {
        const verifyLink = `${APP_URL}/verify-email?token=${res.data.token}`;
        await emailjs.send(
          EJS_SERVICE, EJS_TEMPLATE,
          { to_email: res.data.email, to_name: res.data.full_name, verify_link: verifyLink },
          EJS_KEY,
        );
      }
      setMsg("Verification email sent! Check your inbox.");
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Could not send email. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{styles}</style>
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-logo-wrap">
          <div className="auth-logo"><Flame className="w-6 h-6" style={{ color: "#0e0700" }} /></div>
          <h1 className="auth-brand">KOTABITES</h1>
        </div>

        {/* Token present — show verification state */}
        {token && (
          <>
            {state === "loading" && (
              <div className="ve-state">
                <Loader className="w-10 h-10 ve-spin" style={{ color: "#FFC72C" }} />
                <p className="ve-title">Verifying your email…</p>
              </div>
            )}
            {state === "success" && (
              <div className="ve-state">
                <CheckCircle2 className="w-12 h-12" style={{ color: "#4ade80" }} />
                <p className="ve-title">Email Successfully Verified! 🎉</p>
                <p className="ve-sub">Redirecting to the sign in…</p>
              </div>
            )}
            {state === "error" && (
              <div className="ve-state">
                <XCircle className="w-10 h-10" style={{ color: "#f87171" }} />
                <p className="ve-title">Verification Failed</p>
                <p className="ve-sub">{msg}</p>
                <button className="ve-resend-btn" onClick={handleResend} disabled={resending}>
                  {resending ? <Loader className="w-4 h-4 ve-spin" /> : <Mail className="w-4 h-4" />}
                  {resending ? "Sending…" : "Resend Verification"}
                </button>
              </div>
            )}
          </>
        )}

        {/* No token — show "resend" prompt */}
        {!token && (
          <div className="ve-state">
            <div className="ve-mail-icon"><Mail className="w-8 h-8" style={{ color: "#FFC72C" }} /></div>
            <p className="ve-title">Verify Your Email</p>
            <p className="ve-sub">
              {user ? `We'll send a verification link to ${user.email}` : "Sign in first to verify your email"}
            </p>
            {user && (
              <button className="ve-resend-btn" onClick={handleResend} disabled={resending}>
                {resending ? <Loader className="w-4 h-4 ve-spin" /> : <Mail className="w-4 h-4" />}
                {resending ? "Sending…" : "Send Verification Email"}
              </button>
            )}
            {msg && <p className="ve-feedback">{msg}</p>}
            <Link to="/menu" className="ve-link">Back to Menu →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root { --red:#DA291C; --gold:#FFC72C; --dark:#0e0700; --card:#1a0e00; --border:rgba(255,199,44,0.12); --text:#fff8e7; --muted:rgba(255,248,231,0.42); }
  .auth-root { min-height:100vh; background:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(218,41,28,0.2) 0%,transparent 65%),var(--dark); display:flex; align-items:center; justify-content:center; padding:24px 16px; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
  .auth-card { width:100%; max-width:420px; background:var(--card); border:1px solid var(--border); border-radius:24px; padding:40px 32px; box-shadow:0 24px 64px rgba(0,0,0,0.5); }
  .auth-logo-wrap { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:28px; }
  .auth-logo { width:40px; height:40px; background:var(--gold); border-radius:11px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(255,199,44,0.3); }
  .auth-brand { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:3px; color:var(--text); line-height:1; }
  .ve-state { display:flex; flex-direction:column; align-items:center; gap:14px; }
  .ve-title { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:2px; color:var(--text); margin:0; }
  .ve-sub { font-size:13px; color:var(--muted); max-width:300px; line-height:1.5; margin:0; }
  .ve-mail-icon { width:60px; height:60px; background:rgba(255,199,44,0.1); border:1px solid rgba(255,199,44,0.25); border-radius:18px; display:flex; align-items:center; justify-content:center; }
  .ve-resend-btn { display:flex; align-items:center; gap:8px; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:14px; padding:12px 24px; border-radius:50px; margin-top:6px; box-shadow:0 4px 16px rgba(218,41,28,0.35); transition:all 0.2s; }
  .ve-resend-btn:hover:not(:disabled) { background:#b91c1c; transform:scale(1.03); }
  .ve-resend-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .ve-feedback { font-size:12px; color:var(--gold); font-weight:600; }
  .ve-link { font-size:13px; color:var(--gold); font-weight:700; text-decoration:none; margin-top:4px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .ve-spin { animation:spin 0.8s linear infinite; }
`;
