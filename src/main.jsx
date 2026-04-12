import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./index.css";
import 'leaflet/dist/leaflet.css';
import { THEMES, applyTheme } from "./hooks/useTheme";


// src/main.jsx or src/index.jsx
import "antd/dist/reset.css";
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registered", reg))
      .catch((err) => console.log("SW failed:", err));
  });
}

// Before ReactDOM.createRoot:
const savedId = localStorage.getItem("kb_theme") || "fire";
const theme = THEMES.find(t => t.id === savedId) || THEMES[0];
applyTheme(theme);


ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
