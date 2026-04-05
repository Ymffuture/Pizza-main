// src/components/Toast.jsx
// Powered by Sonner — drop-in replacement.
// All existing useToast() call-sites work unchanged.
import { createContext, useContext, useCallback } from "react";
import { toast as sonner, Toaster } from "sonner";
import { ShoppingCart, CheckCircle, XCircle, Info } from "lucide-react";

const ToastContext = createContext();

/* ── Map your old type → sonner variant ── */
const ICONS = {
  cart:    <ShoppingCart size={16} />,
  success: <CheckCircle  size={16} />,
  error:   <XCircle      size={16} />,
  info:    <Info         size={16} />,
};

export function ToastProvider({ children }) {
  const show = useCallback(({
    type = "info",
    title,
    message,
    sub,
    image,
    duration = 5000,
  }) => {
    const description = sub ? `${message} · ${sub}` : message;
    const icon = image
      ? <img src={image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
      : ICONS[type] ?? ICONS.info;

    const opts = { description, duration, icon };

    switch (type) {
      case "success": return sonner.success(title || "Done",   opts);
      case "error":   return sonner.error  (title || "Error",  opts);
      case "cart":    return sonner         (title || "Added",  opts);
      default:        return sonner.info    (title || "Notice", opts);
    }
  }, []);

  const dismiss = useCallback((id) => sonner.dismiss(id), []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ── Toaster widget — place once at the app root ── */
export function KotaToaster() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors={false}
      toastOptions={{
        style: {
          background:   "#0a1a1f",
          border:       "1px solid rgba(6,182,212,0.25)",
          borderRadius: 14,
          color:        "#F8F5EE",
          fontFamily:   "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize:     13,
          fontWeight:   600,
          boxShadow:    "0 8px 32px rgba(0,0,0,0.55)",
        },
        classNames: {
          title:       "kota-toast-title",
          description: "kota-toast-desc",
          icon:        "kota-toast-icon",
        },
      }}
    />
  );
}
