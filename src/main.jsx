import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "antd/dist/reset.css";
import "./i18n";

import { THEMES, applyTheme } from "./hooks/useTheme";

// ✅ Service Worker (safe)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registered", reg))
      .catch((err) => console.warn("SW failed:", err));
  });
}

// ✅ Theme (safe)
try {
  const savedId = localStorage.getItem("kb_theme") || "fire";
  const theme = THEMES.find(t => t.id === savedId) || THEMES[0];
  if (theme) applyTheme(theme);
} catch (e) {
  console.warn("Theme error:", e);
}

// ✅ Root check
const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element not found");
}

// ✅ Env check
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  console.error("Missing VITE_GOOGLE_CLIENT_ID");
}

// ✅ Render
ReactDOM.createRoot(rootEl).render(
  <GoogleOAuthProvider clientId={clientId || ""}>
    <App />
  </GoogleOAuthProvider>
);
