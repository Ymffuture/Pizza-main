import { createContext, useContext, useState, useCallback, useRef } from "react";
import { ShoppingCart, CheckCircle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

const ICONS = {
  cart:    <ShoppingCart className="w-5 h-5" />,
  success: <CheckCircle className="w-5 h-5" />,
  error:   <XCircle className="w-5 h-5" />,
  info:    <Info className="w-5 h-5" />,
};

const COLORS = {
  cart:    { bg: "#1A0A00", accent: "#FFC72C", icon: "#FFC72C", text: "#FFF8E7" },
  success: { bg: "#0A1F0A", accent: "#22c55e", icon: "#22c55e", text: "#f0fdf4" },
  error:   { bg: "#1F0A0A", accent: "#ef4444", icon: "#ef4444", text: "#fef2f2" },
  info:    { bg: "#0A0F1F", accent: "#60a5fa", icon: "#60a5fa", text: "#eff6ff" },
};

function ToastItem({ toast, onRemove }) {
  const c = COLORS[toast.type] || COLORS.info;

  return (
    <div
      className="toast-item"
      style={{
        background: c.bg,
        border: `1px solid ${c.accent}30`,
        borderLeft: `3px solid ${c.accent}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${c.accent}15`,
        borderRadius: "14px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "300px",
        maxWidth: "360px",
        position: "relative",
        overflow: "hidden",
        animation: "toastIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 0% 50%, ${c.accent}12, transparent 60%)`,
        pointerEvents: "none",
      }} />

      {/* Image or icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, overflow: "hidden",
        flexShrink: 0, background: `${c.accent}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: c.icon,
      }}>
        {toast.image ? (
          <img src={toast.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ color: c.icon }}>{ICONS[toast.type] || ICONS.info}</div>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: c.accent, textTransform: "uppercase", marginBottom: 2 }}>
            {toast.title}
          </p>
        )}
        <p style={{ fontSize: 13, fontWeight: 600, color: c.text, lineHeight: 1.4, wordBreak: "break-word" }}>
          {toast.message}
        </p>
        {toast.sub && (
          <p style={{ fontSize: 11, color: `${c.text}80`, marginTop: 2 }}>{toast.sub}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{ color: `${c.text}50`, flexShrink: 0, padding: 2 }}
        className="hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        height: 2, background: c.accent,
        animation: `toastProgress ${toast.duration ?? 2500}ms linear forwards`,
        borderRadius: "0 0 14px 14px",
      }} />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(({ type = "info", title, message, sub, image, duration = 3500 }) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message, sub, image, duration }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}

      {/* Toast container */}
      <div
  style={{
    position: "fixed",
    top: 24,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    zIndex: 9999,
    pointerEvents: "none",
  }}
>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={t} onRemove={dismiss} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(110%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
