// src/pages/GitHubCallback.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Flame, Loader, XCircle } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const REDIRECT_URI = `${window.location.origin}/auth/github/callback`;

export default function GitHubCallback() {
  const navigate  = useNavigate();
  const { loginWithOAuth } = useAuth();
  const toast     = useToast();
  const ran       = useRef(false);

  const [status,  setStatus]  = useState("loading"); // "loading" | "error"
  const [message, setMessage] = useState("Connecting your GitHub account…");
  const [errMsg,  setErrMsg]  = useState("");

  useEffect(() => {
    // StrictMode fires effects twice in dev — guard against double-call
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const error  = params.get("error");

    if (error || !code) {
      setStatus("error");
      setErrMsg(
        error === "access_denied"
          ? "You cancelled the GitHub sign-in."
          : "GitHub returned an error. Please try again."
      );
      return;
    }

    (async () => {
      try {
        setMessage("Verifying with GitHub…");
        const { data } = await axios.post(`${API}/auth/github`, {
          code,
          redirect_uri: REDIRECT_URI,
        });

        setMessage("Signing you in…");
        // loginWithOAuth stores the token + user in context/localStorage
        await loginWithOAuth(data.access_token, data.user);

        toast.show({
          type:    "success",
          title:   "Welcome!",
          message: data.user?.full_name || data.user?.email,
        });

        const redirectTo = sessionStorage.getItem("oauth_redirect") || "/menu";
        sessionStorage.removeItem("oauth_redirect");
        navigate(redirectTo, { replace: true });

      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err.message ||
          "GitHub sign-in failed";

        setStatus("error");
        setErrMsg(detail);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.root}>
      <style>{keyframes}</style>
      <div style={styles.card}>

        {/* Brand */}
        <div style={styles.logoWrap}>
          <div style={styles.logo}>
            <Flame style={{ width: 22, height: 22, color: "#0e0700" }} />
          </div>
          <span style={styles.brand}>KOTABITES</span>
        </div>

        {status === "loading" ? (
          <>
            <div style={styles.iconWrap}>
              <GitHubMark size={44} />
              <div style={styles.spinnerRing} />
            </div>
            <h2 style={styles.title}>Signing in with GitHub</h2>
            <p style={styles.sub}>{message}</p>
            <Loader style={{ ...styles.loader, animation: "spin 0.9s linear infinite" }} />
          </>
        ) : (
          <>
            <XCircle style={{ width: 44, height: 44, color: "#f87171", margin: "0 auto 16px" }} />
            <h2 style={styles.title}>Sign-in Failed</h2>
            <p style={{ ...styles.sub, color: "#fca5a5", marginBottom: 24 }}>{errMsg}</p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              style={styles.btn}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GitHubMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f0f6fc">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const styles = {
  root: {
    minHeight:       "100vh",
    background:      "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(218,41,28,0.15) 0%, transparent 65%), #0e0700",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    padding:         24,
    fontFamily:      "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  card: {
    width:        "100%",
    maxWidth:     380,
    background:   "#1a0e00",
    border:       "1px solid rgba(255,199,44,0.12)",
    borderRadius: 24,
    padding:      "40px 32px",
    textAlign:    "center",
    boxShadow:    "0 24px 64px rgba(0,0,0,0.5)",
  },
  logoWrap: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            10,
    marginBottom:   32,
  },
  logo: {
    width:          38, height: 38,
    background:     "#FFC72C",
    borderRadius:   10,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    boxShadow:      "0 0 20px rgba(255,199,44,0.3)",
  },
  brand: {
    fontFamily:    "'Bebas Neue', sans-serif",
    fontSize:      22,
    letterSpacing: 3,
    color:         "#fff8e7",
  },
  iconWrap: {
    position:       "relative",
    width:          70,
    height:         70,
    margin:         "0 auto 20px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
  },
  spinnerRing: {
    position:     "absolute",
    inset:        0,
    borderRadius: "50%",
    border:       "2px solid rgba(255,199,44,0.15)",
    borderTop:    "2px solid #FFC72C",
    animation:    "spin 1s linear infinite",
  },
  title: {
    fontFamily:    "'Bebas Neue', sans-serif",
    fontSize:      26,
    letterSpacing: 2,
    color:         "#fff8e7",
    margin:        "0 0 8px",
  },
  sub: {
    fontSize:   13,
    color:      "rgba(255,248,231,0.45)",
    lineHeight: 1.5,
    margin:     0,
  },
  loader: {
    width:     20,
    height:    20,
    color:     "#FFC72C",
    marginTop: 20,
  },
  btn: {
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    background:     "#DA291C",
    color:          "#fff",
    border:         "none",
    borderRadius:   12,
    padding:        "13px 28px",
    fontFamily:     "'Plus Jakarta Sans', sans-serif",
    fontWeight:     800,
    fontSize:       14,
    cursor:         "pointer",
    boxShadow:      "0 6px 20px rgba(218,41,28,0.35)",
    transition:     "all 0.2s",
  },
};

const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
`;
