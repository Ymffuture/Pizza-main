// src/pages/Appeal.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Scale, CheckCircle2, Clock, XCircle,
  AlertTriangle, ShieldOff, Lock, ChevronRight, Phone,
} from "lucide-react";
import { useUserStatus } from "../context/UserStatusContext";
import { useAuth } from "../context/AuthContext";
import { submitAppeal, getMyAppeal } from "../api/appeal.api";

// ── Category options ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "wrong_decision",    label: "Wrong Decision",   emoji: "⚖️",  desc: "The action taken was not justified"         },
  { id: "misunderstanding",  label: "Misunderstanding", emoji: "💬",  desc: "There was a miscommunication or mistake"     },
  { id: "reformed",          label: "I've Changed",     emoji: "🔄",  desc: "I understand what went wrong and have grown" },
  { id: "technical_error",   label: "Technical Error",  emoji: "⚙️",  desc: "A system error caused this restriction"      },
  { id: "other",             label: "Other",            emoji: "📝",  desc: "My situation doesn't fit the above"          },
];

// ── Status colour tokens ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  banned:     { accent: "#ff2424", bg: "rgba(255,36,36,0.08)",    border: "rgba(255,36,36,0.2)",    label: "Permanently Banned",   Icon: ShieldOff },
  suspended:  { accent: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)",  label: "Suspended",            Icon: Lock },
  restricted: { accent: "#fb923c", bg: "rgba(251,146,60,0.08)",   border: "rgba(251,146,60,0.2)",   label: "Restricted",           Icon: AlertTriangle },
  warned:     { accent: "#fbbf24", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.2)",   label: "Warned",               Icon: AlertTriangle },
  active:     { accent: "#4ade80", bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.2)",   label: "Active",               Icon: CheckCircle2 },
};

const MIN_CHARS = 80;
const MAX_CHARS = 1000;

export default function Appeal() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { status, reason, expiresAt, appealed: ctxAppealed } = useUserStatus();

  const [pageState,    setPageState]    = useState("loading"); // loading | not_needed | pending | form | success
  const [existingAppeal, setExistingAppeal] = useState(null);
  const [category,     setCategory]     = useState("");
  const [appealText,   setAppealText]   = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.active;
  const { Icon: StatusIcon } = colors;

  // ── Load existing appeal or set initial state ─────────────────────────────
  useEffect(() => {
    const check = async () => {
      if (status === "active") {
        setPageState("not_needed");
        return;
      }
      try {
        const { data } = await getMyAppeal();
        if (data?.appeal) {
          setExistingAppeal(data.appeal);
          setPageState("pending");
        } else {
          setPageState("form");
        }
      } catch {
        setPageState("form");
      }
    };
    if (status) check();
  }, [status]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!category)                          { setError("Please select a category.");               return; }
    if (appealText.trim().length < MIN_CHARS) { setError(`Please write at least ${MIN_CHARS} characters.`); return; }
    setError("");
    setSubmitting(true);
    try {
      await submitAppeal({ category, reason: appealText.trim(), account_status: status });
      setPageState("success");
    } catch (err) {
      const msg = err?.response?.data?.detail;
      if (typeof msg === "string") setError(msg);
      else setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const charCount  = appealText.length;
  const charOk     = charCount >= MIN_CHARS;
  const canSubmit  = category && charOk && !submitting;

  return (
    <>
      <style>{css}</style>
      <div className="ap-root">

        {/* Back nav */}
        <div className="ap-topbar">
          <button className="ap-back" onClick={() => navigate(-1)}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            <span>Back</span>
          </button>
        </div>

        <div className="ap-container">

          {/* ── LOADING ──────────────────────────────────────────────── */}
          {pageState === "loading" && (
            <div className="ap-skeleton-wrap">
              <div className="ap-skeleton ap-sk-title" />
              <div className="ap-skeleton ap-sk-card" />
              <div className="ap-skeleton ap-sk-chips" />
              <div className="ap-skeleton ap-sk-textarea" />
            </div>
          )}

          {/* ── NOT NEEDED ───────────────────────────────────────────── */}
          {pageState === "not_needed" && (
            <div className="ap-state-card">
              <CheckCircle2 style={{ width: 40, height: 40, color: "#4ade80" }} />
              <h2 className="ap-state-title" style={{ color: "#4ade80" }}>Account in Good Standing</h2>
              <p className="ap-state-body">Your account is active — there's nothing to appeal right now.</p>
              <Link to="/menu" className="ap-cta-btn" style={{ background: "#DA291C" }}>
                Browse Menu <ChevronRight style={{ width: 15, height: 15 }} />
              </Link>
            </div>
          )}

          {/* ── ALREADY PENDING ──────────────────────────────────────── */}
          {pageState === "pending" && existingAppeal && (
            <div className="ap-card">
              <div className="ap-card-strip" style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }} />
              <div className="ap-pending-icon">
                <Clock style={{ width: 28, height: 28, color: "#fbbf24" }} />
              </div>
              <h2 className="ap-card-title">Appeal Under Review</h2>
              <p className="ap-card-sub">
                Your appeal was submitted on{" "}
                <strong>{new Date(existingAppeal.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</strong>.
                Our team reviews appeals within 24–48 hours.
              </p>

              <div className="ap-detail-row">
                <span className="ap-detail-label">Category</span>
                <span className="ap-detail-value">
                  {CATEGORIES.find(c => c.id === existingAppeal.category)?.label ?? existingAppeal.category}
                </span>
              </div>
              <div className="ap-detail-row">
                <span className="ap-detail-label">Status</span>
                <span className="ap-pending-chip">
                  <Clock style={{ width: 10, height: 10 }} /> Pending
                </span>
              </div>

              <div className="ap-reason-preview">
                <p className="ap-reason-preview-label">Your statement</p>
                <p className="ap-reason-preview-text">{existingAppeal.reason}</p>
              </div>

              <p className="ap-contact-note">
                Need to follow up?{" "}
                <a href="tel:0653935339" className="ap-inline-link">065 393 5339</a>
                {" "}or{" "}
                <a href="mailto:futurekgomotso@gmail.com" className="ap-inline-link">futurekgomotso@gmail.com</a>
              </p>
            </div>
          )}

          {/* ── FORM ─────────────────────────────────────────────────── */}
          {pageState === "form" && (
            <>
              {/* Page heading */}
              <div className="ap-heading">
                <div className="ap-heading-icon" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                  <Scale style={{ width: 22, height: 22, color: colors.accent }} />
                </div>
                <div>
                  <h1 className="ap-title">Submit an Appeal</h1>
                  <p className="ap-subtitle">Make your case — we read every submission</p>
                </div>
              </div>

              {/* Current status card */}
              <div className="ap-status-card" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                <div className="ap-status-card-left">
                  <StatusIcon style={{ width: 18, height: 18, color: colors.accent, flexShrink: 0 }} />
                  <div>
                    <span className="ap-status-label" style={{ color: colors.accent }}>
                      {colors.label}
                    </span>
                    {reason && (
                      <span className="ap-status-reason">"{reason}"</span>
                    )}
                    {expiresAt && (
                      <span className="ap-status-expires">
                        Lifts: {new Date(expiresAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="ap-card">
                <div className="ap-card-strip" style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }} />

                {/* Step 1 — Category */}
                <div className="ap-section">
                  <p className="ap-section-label">
                    <span className="ap-step-num">1</span>
                    What best describes your situation?
                  </p>
                  <div className="ap-chips">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        className={`ap-chip${category === cat.id ? " ap-chip-active" : ""}`}
                        style={category === cat.id ? {
                          background: colors.bg,
                          border: `1.5px solid ${colors.accent}`,
                          color: colors.accent,
                        } : {}}
                        onClick={() => setCategory(cat.id)}
                      >
                        <span className="ap-chip-emoji">{cat.emoji}</span>
                        <div className="ap-chip-text">
                          <span className="ap-chip-label">{cat.label}</span>
                          <span className="ap-chip-desc">{cat.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2 — Reason */}
                <div className="ap-section">
                  <p className="ap-section-label">
                    <span className="ap-step-num">2</span>
                    Tell us your side of the story
                  </p>
                  <p className="ap-section-hint">
                    Be specific and honest. Include any relevant context, dates, or details that support your case.
                  </p>
                  <div className={`ap-textarea-wrap${appealText.length > 0 && !charOk ? " ap-textarea-warn" : charOk ? " ap-textarea-ok" : ""}`}>
                    <textarea
                      className="ap-textarea"
                      placeholder={`Explain what happened and why your account restriction should be reviewed…\n\nMinimum ${MIN_CHARS} characters.`}
                      value={appealText}
                      onChange={e => setAppealText(e.target.value.slice(0, MAX_CHARS))}
                      rows={7}
                    />
                    <div className="ap-char-row">
                      <span className={`ap-char-count${charOk ? " ap-char-ok" : ""}`}>
                        {charCount < MIN_CHARS
                          ? `${MIN_CHARS - charCount} more characters needed`
                          : `${charCount} / ${MAX_CHARS}`}
                      </span>
                      {charOk && <CheckCircle2 style={{ width: 13, height: 13, color: "#4ade80" }} />}
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="ap-error">
                    <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  className="ap-submit-btn"
                  style={canSubmit ? { background: "#DA291C", boxShadow: "0 6px 24px rgba(218,41,28,0.4)" } : {}}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <span className="ap-spinner" />
                  ) : (
                    <>
                      <Scale style={{ width: 16, height: 16 }} />
                      Submit Appeal
                    </>
                  )}
                </button>

                {/* What happens next */}
                <div className="ap-next-steps">
                  <p className="ap-next-title">What happens next</p>
                  <div className="ap-next-list">
                    {[
                      ["📬", "We receive your appeal immediately"],
                      ["🔍", "Our team reviews within 24–48 hrs"],
                      ["📩", "You'll be contacted at " + (user?.email ?? "your email")],
                      ["✅", "Approved appeals restore access instantly"],
                    ].map(([icon, text]) => (
                      <div key={text} className="ap-next-item">
                        <span>{icon}</span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct contact */}
                <a href="tel:0653935339" className="ap-phone-link">
                  <Phone style={{ width: 14, height: 14 }} />
                  Prefer to call? 065 393 5339
                </a>
              </div>
            </>
          )}

          {/* ── SUCCESS ──────────────────────────────────────────────── */}
          {pageState === "success" && (
            <div className="ap-card ap-success-card">
              <div className="ap-card-strip" style={{ background: "linear-gradient(90deg, transparent, #4ade80, transparent)" }} />
              <div className="ap-success-icon">
                <CheckCircle2 style={{ width: 36, height: 36, color: "#4ade80" }} />
              </div>
              <h2 className="ap-card-title" style={{ color: "#4ade80" }}>Appeal Submitted</h2>
              <p className="ap-card-sub">
                We've received your appeal and will review it within <strong>24–48 hours</strong>.
                You'll hear from us at <strong>{user?.email}</strong>.
              </p>

              <div className="ap-success-steps">
                {[
                  { icon: "📬", label: "Received",      done: true  },
                  { icon: "🔍", label: "Under Review",   done: false },
                  { icon: "📩", label: "Decision Sent",  done: false },
                ].map(({ icon, label, done }) => (
                  <div key={label} className={`ap-success-step${done ? " ap-step-done" : ""}`}>
                    <span className="ap-step-icon">{icon}</span>
                    <span className="ap-step-label">{label}</span>
                    {done && <CheckCircle2 style={{ width: 12, height: 12, color: "#4ade80" }} />}
                  </div>
                ))}
              </div>

              <div className="ap-success-actions">
                <Link to="/menu" className="ap-cta-btn" style={{ background: "#DA291C" }}>
                  Browse Menu <ChevronRight style={{ width: 15, height: 15 }} />
                </Link>
                <a href="tel:0653935339" className="ap-phone-link" style={{ marginTop: 0 }}>
                  <Phone style={{ width: 13, height: 13 }} />
                  065 393 5339
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

.ap-root {
  min-height: 100vh;
  background: radial-gradient(ellipse 70% 40% at 50% 0%, rgba(218,41,28,0.12) 0%, transparent 65%), #0e0700;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  color: #fff8e7;
  padding-bottom: 64px;
}

/* ── Topbar ── */
.ap-topbar {
  padding: 16px 20px 0;
  max-width: 600px;
  margin: 0 auto;
}
.ap-back {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  color: rgba(255,248,231,0.45); font-size: 13px; font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding: 6px 0; transition: color 0.18s;
}
.ap-back:hover { color: #fff8e7; }

/* ── Container ── */
.ap-container {
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Heading ── */
.ap-heading {
  display: flex; align-items: center; gap: 14px;
}
.ap-heading-icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.ap-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 28px; letter-spacing: 2.5px; color: #fff8e7;
  margin: 0; line-height: 1;
}
.ap-subtitle {
  font-size: 12px; font-weight: 600; color: rgba(255,248,231,0.38);
  margin: 4px 0 0; letter-spacing: 0.04em;
}

/* ── Status card ── */
.ap-status-card {
  border-radius: 14px;
  padding: 14px 16px;
  display: flex; align-items: flex-start; justify-content: space-between;
}
.ap-status-card-left {
  display: flex; align-items: flex-start; gap: 10px;
}
.ap-status-label {
  display: block;
  font-size: 11px; font-weight: 900;
  text-transform: uppercase; letter-spacing: 0.1em;
}
.ap-status-reason {
  display: block;
  font-size: 12px; font-weight: 500; color: rgba(255,248,231,0.5);
  margin-top: 3px; line-height: 1.5; font-style: italic;
}
.ap-status-expires {
  display: block;
  font-size: 11px; font-weight: 700; color: rgba(255,248,231,0.3);
  margin-top: 3px;
}

/* ── Card ── */
.ap-card {
  position: relative;
  background: rgba(20,10,0,0.98);
  border: 1px solid rgba(255,199,44,0.1);
  border-radius: 22px;
  padding: 32px 24px 24px;
  display: flex; flex-direction: column; gap: 24px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
  overflow: hidden;
}
.ap-card-strip {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.ap-card-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 24px; letter-spacing: 2px; color: #fff8e7;
  margin: 0; text-align: center;
}
.ap-card-sub {
  font-size: 13px; color: rgba(255,248,231,0.45);
  line-height: 1.7; margin: 0; text-align: center;
}
.ap-card-sub strong { color: rgba(255,248,231,0.75); }

/* ── Section ── */
.ap-section { display: flex; flex-direction: column; gap: 12px; }
.ap-section-label {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 800; color: #fff8e7; margin: 0;
}
.ap-step-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(255,199,44,0.15); border: 1px solid rgba(255,199,44,0.3);
  font-size: 11px; font-weight: 900; color: #FFC72C; flex-shrink: 0;
}
.ap-section-hint {
  font-size: 12px; color: rgba(255,248,231,0.35); margin: -6px 0 0;
  line-height: 1.6;
}

/* ── Category chips ── */
.ap-chips {
  display: flex; flex-direction: column; gap: 8px;
}
.ap-chip {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 13px;
  background: rgba(255,248,231,0.04); border: 1.5px solid rgba(255,248,231,0.08);
  cursor: pointer; transition: all 0.2s; text-align: left; width: 100%;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: rgba(255,248,231,0.55);
}
.ap-chip:hover {
  background: rgba(255,248,231,0.07);
  border-color: rgba(255,199,44,0.2);
  color: #fff8e7;
}
.ap-chip-emoji { font-size: 20px; flex-shrink: 0; line-height: 1; }
.ap-chip-text  { display: flex; flex-direction: column; gap: 2px; }
.ap-chip-label { font-size: 13px; font-weight: 800; color: inherit; }
.ap-chip-desc  { font-size: 11px; color: rgba(255,248,231,0.3); font-weight: 500; }
.ap-chip-active .ap-chip-label { font-weight: 900; }
.ap-chip-active .ap-chip-desc  { color: currentColor; opacity: 0.6; }

/* ── Textarea ── */
.ap-textarea-wrap {
  border-radius: 14px;
  border: 1.5px solid rgba(255,248,231,0.1);
  background: rgba(255,248,231,0.03);
  overflow: hidden;
  transition: border-color 0.2s;
}
.ap-textarea-warn { border-color: rgba(251,191,36,0.3); }
.ap-textarea-ok   { border-color: rgba(74,222,128,0.3); }
.ap-textarea {
  width: 100%; box-sizing: border-box;
  background: transparent; border: none; outline: none;
  padding: 16px; resize: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 500; line-height: 1.7;
  color: #fff8e7;
}
.ap-textarea::placeholder { color: rgba(255,248,231,0.2); }
.ap-char-row {
  display: flex; align-items: center; justify-content: flex-end; gap: 5px;
  padding: 6px 14px 10px;
  border-top: 1px solid rgba(255,248,231,0.05);
}
.ap-char-count {
  font-size: 10px; font-weight: 700;
  color: rgba(255,248,231,0.25); letter-spacing: 0.06em;
  text-transform: uppercase;
}
.ap-char-ok { color: #4ade80; }

/* ── Error ── */
.ap-error {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 10px;
  background: rgba(218,41,28,0.1); border: 1px solid rgba(218,41,28,0.25);
  font-size: 12px; font-weight: 700; color: #f87171;
}

/* ── Submit ── */
.ap-submit-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 15px;
  border-radius: 14px; border: none; cursor: pointer;
  background: rgba(255,248,231,0.08);
  color: rgba(255,248,231,0.3);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 900;
  transition: all 0.22s; letter-spacing: 0.04em;
}
.ap-submit-btn:not(:disabled) { color: #fff; }
.ap-submit-btn:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-1px); }
.ap-submit-btn:disabled { cursor: not-allowed; }

/* Spinner */
.ap-spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  animation: apSpin 0.7s linear infinite;
  display: inline-block;
}
@keyframes apSpin { to { transform: rotate(360deg); } }

/* ── What happens next ── */
.ap-next-steps {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255,248,231,0.03);
  border: 1px solid rgba(255,248,231,0.07);
}
.ap-next-title {
  font-size: 10px; font-weight: 900; color: rgba(255,248,231,0.3);
  text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px;
}
.ap-next-list { display: flex; flex-direction: column; gap: 8px; }
.ap-next-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; font-weight: 600; color: rgba(255,248,231,0.45);
}

/* ── Phone link ── */
.ap-phone-link {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; font-weight: 800; color: rgba(255,248,231,0.25);
  text-decoration: none; margin-top: 4px;
  transition: color 0.18s;
}
.ap-phone-link:hover { color: rgba(255,248,231,0.6); }

/* ── Existing appeal detail rows ── */
.ap-detail-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,248,231,0.06);
  font-size: 12px;
}
.ap-detail-label { font-weight: 700; color: rgba(255,248,231,0.35); }
.ap-detail-value { font-weight: 700; color: rgba(255,248,231,0.7); }
.ap-pending-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 20px;
  background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25);
  font-size: 10px; font-weight: 900; color: #fbbf24;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.ap-reason-preview {
  background: rgba(255,248,231,0.03);
  border: 1px solid rgba(255,248,231,0.07);
  border-radius: 12px; padding: 14px 16px;
}
.ap-reason-preview-label {
  font-size: 10px; font-weight: 900; color: rgba(255,248,231,0.25);
  text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px;
}
.ap-reason-preview-text {
  font-size: 13px; color: rgba(255,248,231,0.5);
  line-height: 1.7; margin: 0; font-style: italic;
}
.ap-contact-note {
  font-size: 12px; color: rgba(255,248,231,0.3); text-align: center; margin: 0;
}
.ap-inline-link {
  color: #FFC72C; text-decoration: none; font-weight: 800;
}
.ap-inline-link:hover { text-decoration: underline; }

/* ── Pending icon ── */
.ap-pending-icon {
  display: flex; justify-content: center;
  width: 64px; height: 64px; border-radius: 50%; margin: 0 auto;
  background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25);
  align-items: center;
  box-shadow: 0 0 30px rgba(251,191,36,0.15);
}

/* ── Success ── */
.ap-success-card { text-align: center; }
.ap-success-icon {
  width: 72px; height: 72px; border-radius: 50%; margin: 0 auto;
  background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.25);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 40px rgba(74,222,128,0.15);
}
.ap-success-steps {
  display: flex; justify-content: center; gap: 0;
  width: 100%; position: relative;
}
.ap-success-steps::before {
  content: '';
  position: absolute; top: 20px; left: 15%; right: 15%;
  height: 1px; background: rgba(255,248,231,0.08);
}
.ap-success-step {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  flex: 1; position: relative;
}
.ap-step-icon {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,248,231,0.04); border: 1px solid rgba(255,248,231,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; position: relative; z-index: 1;
}
.ap-step-done .ap-step-icon {
  background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.3);
}
.ap-step-label {
  font-size: 10px; font-weight: 800; color: rgba(255,248,231,0.3);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.ap-step-done .ap-step-label { color: #4ade80; }
.ap-success-actions {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}

/* ── CTA button ── */
.ap-cta-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 13px 28px; border-radius: 50px;
  color: #fff; font-size: 13px; font-weight: 900;
  text-decoration: none; transition: all 0.2s;
  box-shadow: 0 4px 18px rgba(218,41,28,0.35);
}
.ap-cta-btn:hover { filter: brightness(1.1); transform: scale(1.02); }

/* ── State card (not_needed) ── */
.ap-state-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 48px 24px; text-align: center;
}
.ap-state-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 26px; letter-spacing: 2px; margin: 0;
}
.ap-state-body {
  font-size: 13px; color: rgba(255,248,231,0.4);
  max-width: 280px; line-height: 1.65; margin: 0;
}

/* ── Skeleton ── */
.ap-skeleton-wrap {
  display: flex; flex-direction: column; gap: 16px;
}
.ap-skeleton {
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(255,248,231,0.04) 25%, rgba(255,248,231,0.07) 50%, rgba(255,248,231,0.04) 75%);
  background-size: 200% 100%;
  animation: apShimmer 1.4s infinite;
}
.ap-sk-title    { height: 52px; }
.ap-sk-card     { height: 80px; }
.ap-sk-chips    { height: 220px; }
.ap-sk-textarea { height: 160px; }
@keyframes apShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 520px) {
  .ap-container  { padding: 16px 14px 0; }
  .ap-card       { padding: 28px 16px 20px; }
  .ap-title      { font-size: 24px; }
}
`;
