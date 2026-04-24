// src/pages/VerifyEmail.jsx — DeepSeek layout · borderless · KOTABITES
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyEmail, sendVerification } from "../api/auth.api";
import emailjs from "@emailjs/browser";
import { useAuth } from "../context/AuthContext";
import { Flame, Loader, ShieldCheck } from "lucide-react";
import { BsEnvelopeCheckFill, BsEnvelopeFill, BsXCircleFill } from "react-icons/bs";

const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_VERIFY_TEMPLATE_ID;
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const APP_URL      = import.meta.env.VITE_APP_URL || "https://foodsorder.vercel.app";

/* ── Shared state-icon pill ── */
function StateIcon({ bg, shadow, children }) {
  return (
    <div className="ds-state-icon" style={{ background: bg, boxShadow: shadow }}>
      {children}
    </div>
  );
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token    = new URLSearchParams(window.location.search).get("token");

  const [state,     setState]    = useState("idle"); // idle | loading | success | error
  const [msg,       setMsg]      = useState("");
  const [resending, setResending] = useState(false);

  /* ── Auto-verify on mount when token present ── */
  useEffect(() => {
    if (!token) return;
    setState("loading");
    verifyEmail(token)
      .then(() => {
        setState("success");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err) => {
        setState("error");
        setMsg(err?.response?.data?.detail || "Verification failed — link may have expired.");
      });
  }, [token]); // eslint-disable-line

  /* ── Resend ── */
  const handleResend = async () => {
    setResending(true);
    setMsg("");
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
      setMsg(err?.response?.data?.detail || "Could not send email. Please try again.");
    } finally {
      setResending(false);
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

        {/* ── TOKEN PRESENT: verification states ── */}
        {token && (
          <div className="ds-state">

            {/* Loading */}
            {state === "loading" && (
              <>
                <StateIcon bg="rgba(255,199,44,0.12)" shadow="none">
                  <Loader size={28} color="var(--kb-gold)" className="ds-spin" />
                </StateIcon>
                <h2 className="ds-state-title">Verifying…</h2>
                <p className="ds-state-sub">Confirming your email address, hang tight.</p>
              </>
            )}

            {/* Success */}
            {state === "success" && (
              <>
                <StateIcon bg="var(--kb-gold)" shadow="0 0 28px rgba(255,199,44,0.28)">
                  <BsEnvelopeCheckFill size={28} color="#0e0700" />
                </StateIcon>
                <h2 className="ds-state-title">Email Verified! 🎉</h2>
                <p className="ds-state-sub">Your account is active. Redirecting to sign in…</p>
                <div className="ds-redirect-bar">
                  <div className="ds-redirect-fill" />
                </div>
              </>
            )}

            {/* Error */}
            {state === "error" && (
              <>
                <StateIcon bg="rgba(218,41,28,0.1)" shadow="none">
                  <BsXCircleFill size={28} color="#f87171" />
                </StateIcon>
                <h2 className="ds-state-title">Verification Failed</h2>
                <p className="ds-state-sub">{msg}</p>
                <button className="ds-cta ds-cta--sm" onClick={handleResend} disabled={resending}>
                  {resending
                    ? <><Loader size={16} className="ds-spin" /> Sending…</>
                    : <><BsEnvelopeFill size={15} /> Resend verification</>}
                </button>
                <Link to="/login" className="ds-text-link">← Back to sign in</Link>
              </>
            )}

          </div>
        )}

        {/* ── NO TOKEN: prompt to resend ── */}
        {!token && (
          <div className="ds-state">
            <StateIcon bg="rgba(255,199,44,0.1)" shadow="none">
              <BsEnvelopeFill size={26} color="var(--kb-gold)" />
            </StateIcon>

            <h2 className="ds-state-title">Verify Your Email</h2>
            <p className="ds-state-sub">
              {user
                ? <>We&rsquo;ll send a verification link to <strong style={{ color: "var(--kb-gold)" }}>{user.email}</strong></>
                : "Sign in first to verify your email."}
            </p>

            {user && (
              <button className="ds-cta" onClick={handleResend} disabled={resending}>
                {resending
                  ? <><Loader size={18} className="ds-spin" /> Sending…</>
                  : <><BsEnvelopeFill size={16} /> Send verification email</>}
              </button>
            )}

            {msg && (
              <p className="ds-feedback" style={{ color: msg.includes("sent") ? "#4ade80" : "#f87171" }}>
                {msg}
              </p>
            )}

            <Link to="/menu" className="ds-text-link">Back to Menu →</Link>
          </div>
        )}

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

  .ds-brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:32px; }
  .ds-flame { width:38px; height:38px; background:var(--kb-gold); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 22px rgba(255,199,44,0.32); }
  .ds-wordmark { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:4px; color:var(--kb-text); line-height:1; }

  /* state layout */
  .ds-state { display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center; }
  .ds-state-icon { width:68px; height:68px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .ds-state-title { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:2px; color:var(--kb-text); margin:0; }
  .ds-state-sub   { font-size:13px; color:var(--kb-muted); max-width:280px; line-height:1.55; margin:0; }

  /* redirect bar */
  .ds-redirect-bar  { width:100%; height:3px; border-radius:999px; background:rgba(255,199,44,0.12); overflow:hidden; }
  .ds-redirect-fill { height:100%; border-radius:999px; background:var(--kb-gold); animation:kbFill 2.8s linear forwards; }
  @keyframes kbFill { from{width:0%} to{width:100%} }

  /* CTA pill */
  .ds-cta { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:15px; background:var(--kb-red); color:#fff; border:none; border-radius:999px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:800; letter-spacing:0.02em; cursor:pointer; box-shadow:0 6px 22px rgba(218,41,28,0.38); transition:background 0.2s, transform 0.15s, box-shadow 0.2s; text-decoration:none; }
  .ds-cta:hover:not(:disabled) { background:var(--kb-red2); transform:scale(1.015); box-shadow:0 8px 28px rgba(218,41,28,0.46); }
  .ds-cta:active:not(:disabled) { transform:scale(0.99); }
  .ds-cta:disabled { opacity:0.5; cursor:not-allowed; }

  /* smaller CTA for error state */
  .ds-cta--sm { width:auto; padding:12px 28px; font-size:13px; }

  .ds-text-link { font-size:13px; font-weight:600; color:var(--kb-gold); text-decoration:none; transition:opacity 0.2s; }
  .ds-text-link:hover { opacity:0.75; }

  .ds-feedback { font-size:12px; font-weight:600; }

  .ds-secure { display:flex; align-items:center; justify-content:center; gap:5px; margin-top:24px; font-size:11px; color:rgba(255,248,231,0.25); letter-spacing:0.03em; }

  @keyframes kbSpin { to { transform:rotate(360deg); } }
  .ds-spin { animation:kbSpin 0.8s linear infinite; }

  @media(max-width:480px) { .ds-card { padding:36px 22px 30px; } .ds-wordmark { font-size:22px; } }
`;
