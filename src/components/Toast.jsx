// src/components/Toast.jsx
// Powered by Sonner with fully custom per-type colours + collapsible "Learn more"
import { createContext, useContext, useCallback, useState } from "react";
import { toast as sonner, Toaster } from "sonner";
import {
  ShoppingCart, CheckCircle2, XCircle, Info,
  AlertTriangle, X, ChevronDown, ChevronUp,
  ExternalLink,
} from "lucide-react";

const ToastContext = createContext();

/* ─────────────────────────────────────────────
   Colour map — one entry per type
───────────────────────────────────────────── */
const TYPE_CFG = {
  success: {
    bg:      "rgba(20, 83, 45,  0.95)",
    border:  "rgba(74,  222, 128, 0.4)",
    accent:  "#4ade80",
    glow:    "rgba(74,  222, 128, 0.18)",
    Icon:    CheckCircle2,
  },
  error: {
    bg:      "rgba(69,  10,  10,  0.97)",
    border:  "rgba(248, 113, 113, 0.45)",
    accent:  "#f87171",
    glow:    "rgba(239,  68,  68,  0.18)",
    Icon:    XCircle,
  },
  warn: {
    bg:      "rgba(78,  52,   0,  0.97)",
    border:  "rgba(251, 191,  36,  0.45)",
    accent:  "#fbbf24",
    glow:    "rgba(245, 158,  11,  0.18)",
    Icon:    AlertTriangle,
  },
  warning: {
    bg:      "rgba(78,  52,   0,  0.97)",
    border:  "rgba(251, 191,  36,  0.45)",
    accent:  "#fbbf24",
    glow:    "rgba(245, 158,  11,  0.18)",
    Icon:    AlertTriangle,
  },
  info: {
    bg:      "rgba(12,  44,  92,  0.97)",
    border:  "rgba(96,  165, 250, 0.45)",
    accent:  "#60a5fa",
    glow:    "rgba(59,  130, 246, 0.18)",
    Icon:    Info,
  },
  cart: {
    bg:      "rgba(67,  20,   0,  0.97)",
    border:  "rgba(251, 146,  60,  0.45)",
    accent:  "#fb923c",
    glow:    "rgba(249, 115,  22,  0.18)",
    Icon:    ShoppingCart,
  },
};
const DEFAULT_CFG = TYPE_CFG.info;

/* ─────────────────────────────────────────────
   Custom toast component
───────────────────────────────────────────── */
function KotaToastItem({ t, type, title, message, sub, image, detail, learnMoreUrl }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CFG[type] || DEFAULT_CFG;
  const { bg, border, accent, glow, Icon } = cfg;

  const hasLearnMore = !!(detail || learnMoreUrl);

  return (
    <>
      <style>{toastCss}</style>
      <div
        className="kt-wrap"
        style={{ "--kt-bg": bg, "--kt-border": border, "--kt-accent": accent, "--kt-glow": glow }}
      >
        {/* Left accent bar */}
        <div className="kt-bar" style={{ background: accent }} />

        {/* Body */}
        <div className="kt-body">
          {/* Row 1: icon + title + close */}
          <div className="kt-row">
            <div className="kt-icon-wrap" style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}>
              {image
                ? <img src={image} alt="" className="kt-img" />
                : <Icon size={14} style={{ color: accent }} />}
            </div>

            <div className="kt-text">
              {title && <p className="kt-title">{title}</p>}
              {(message || sub) && (
                <p className="kt-desc">
                  {message}
                  {sub && <span className="kt-sub"> · {sub}</span>}
                </p>
              )}
            </div>

            <button className="kt-close" onClick={() => sonner.dismiss(t)} title="Dismiss">
              <X size={12} />
            </button>
          </div>

          {/* Learn more toggle */}
          {hasLearnMore && (
            <>
              <button
                className="kt-learn-btn"
                style={{ color: accent }}
                onClick={() => setExpanded(e => !e)}
                aria-expanded={expanded}
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? "Hide details" : "Learn more"}
              </button>

              <div className={`kt-detail-wrap${expanded ? " kt-detail-open" : ""}`}>
                <div className="kt-detail" style={{ borderColor: `${accent}22` }}>
                  {detail && <p className="kt-detail-text">{detail}</p>}
                  {learnMoreUrl && (
                    <a
                      href={learnMoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="kt-detail-link"
                      style={{ color: accent }}
                    >
                      <ExternalLink size={11} /> Open documentation
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Provider
───────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const show = useCallback(({
    type     = "info",
    title,
    message,
    sub,
    image,
    duration = 5000,
    detail,        // ← optional: shown in the "Learn more" collapse
    learnMoreUrl,  // ← optional: external link in learn more
  }) => {
    return sonner.custom(
      (t) => (
        <KotaToastItem
          t={t}
          type={type}
          title={title}
          message={message}
          sub={sub}
          image={image}
          detail={detail}
          learnMoreUrl={learnMoreUrl}
        />
      ),
      { duration, unstyled: true, className: "kt-sonner-item" },
    );
  }, []);

  const dismiss = useCallback((id) => sonner.dismiss(id), []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ─────────────────────────────────────────────
   Toaster — place once in App root
───────────────────────────────────────────── */
export function KotaToaster() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: { toast: "kt-sonner-item" },
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Styles (injected once per render)
───────────────────────────────────────────── */
const toastCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  /* Sonner list container override */
  [data-sonner-toaster] { --width: 380px !important; }
  .kt-sonner-item       { padding: 0 !important; background: none !important; border: none !important; box-shadow: none !important; width: 100% !important; }

  /* ── Toast wrapper ── */
  .kt-wrap {
    width: 100%;
    max-width: 380px;
    background: var(--kt-bg);
    border: 1px solid var(--kt-border);
    border-radius: 14px;
    box-shadow:
      0 8px 32px rgba(0,0,0,0.55),
      0 0 0 1px rgba(255,255,255,0.03),
      0 0 20px var(--kt-glow);
    overflow: hidden;
    display: flex;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    animation: ktSlideIn 0.3s cubic-bezier(0.34,1.2,0.64,1);
    backdrop-filter: blur(16px) saturate(1.4);
    position: relative;
  }
  @keyframes ktSlideIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.95); }
    to   { opacity: 1; transform: none; }
  }

  /* Left accent bar */
  .kt-bar {
    width: 3px;
    flex-shrink: 0;
    border-radius: 14px 0 0 14px;
  }

  /* Body */
  .kt-body {
    flex: 1;
    padding: 12px 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  /* Row 1 */
  .kt-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .kt-icon-wrap {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    margin-top: 1px;
  }
  .kt-img {
    width: 28px; height: 28px; border-radius: 6px; object-fit: cover;
  }

  .kt-text  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .kt-title {
    font-size: 13px; font-weight: 800;
    color: #fff; margin: 0; line-height: 1.3;
    letter-spacing: 0.01em;
  }
  .kt-desc {
    font-size: 12px; font-weight: 500;
    color: rgba(255,255,255,0.55); margin: 0; line-height: 1.45;
    overflow: hidden; text-overflow: ellipsis;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }
  .kt-sub { opacity: 0.7; }

  /* Close button */
  .kt-close {
    width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.35); cursor: pointer;
    transition: all 0.15s;
    margin-top: 1px;
  }
  .kt-close:hover { background: rgba(255,255,255,0.14); color: #fff; }

  /* Learn more toggle */
  .kt-learn-btn {
    display: inline-flex; align-items: center; gap: 4px;
    margin-top: 8px; margin-left: 40px;
    background: none; border: none; cursor: pointer;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.03em;
    font-family: 'Plus Jakarta Sans', sans-serif;
    opacity: 0.8;
    transition: opacity 0.15s;
    padding: 0;
  }
  .kt-learn-btn:hover { opacity: 1; }

  /* Collapsible detail */
  .kt-detail-wrap {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1),
                opacity     0.22s ease;
    opacity: 0;
    margin-left: 40px;
  }
  .kt-detail-open {
    max-height: 200px;
    opacity: 1;
  }
  .kt-detail {
    margin-top: 8px;
    padding: 10px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid;
    border-radius: 9px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .kt-detail-text {
    font-size: 11px; font-weight: 500;
    color: rgba(255,255,255,0.6); line-height: 1.6; margin: 0;
  }
  .kt-detail-link {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700;
    text-decoration: none; opacity: 0.85;
    transition: opacity 0.15s;
  }
  .kt-detail-link:hover { opacity: 1; }

  @media (max-width: 420px) {
    [data-sonner-toaster] { --width: calc(100vw - 32px) !important; }
    .kt-wrap { max-width: 100%; }
  }
`;
