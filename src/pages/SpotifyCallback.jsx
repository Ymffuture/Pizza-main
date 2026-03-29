// src/pages/SpotifyCallback.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Flame, Loader, XCircle } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const REDIRECT_URI = `${window.location.origin}/auth/spotify/callback`;

export default function SpotifyCallback() {
  const navigate  = useNavigate();
  const { loginWithOAuth } = useAuth();
  const toast     = useToast();
  const ran       = useRef(false);

  const [status,  setStatus]  = useState("loading");
  const [message, setMessage] = useState("Connecting your Spotify account…");
  const [errMsg,  setErrMsg]  = useState("");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const error  = params.get("error");

    if (error || !code) {
      setStatus("error");
      setErrMsg(
        error === "access_denied"
          ? "You cancelled the Spotify sign-in."
          : "Spotify returned an error. Please try again."
      );
      return;
    }

    (async () => {
      try {
        setMessage("Verifying with Spotify…");
        const { data } = await axios.post(`${API}/auth/spotify`, {
          code,
          redirect_uri: REDIRECT_URI,
        });

        setMessage("Signing you in…");
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
          "Spotify sign-in failed";

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
              <SpotifyMark size={44} />
              <div style={styles.spinnerRing} />
            </div>
            <h2 style={styles.title}>Signing in with Spotify</h2>
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

function SpotifyMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.241-3.021-1.858-6.832-2.278-11.322-1.237-.422.1-.851-.16-.949-.583-.1-.422.16-.851.583-.949 4.911-1.121 9.128-.638 12.521 1.431.38.249.49.73.241 1.1l.027-.003zm1.473-3.26c-.299.469-.939.619-1.408.32-3.459-2.13-8.73-2.748-12.821-1.5-.529.16-1.08-.141-1.24-.67-.159-.529.141-1.081.67-1.241 4.671-1.42 10.469-.729 14.439 1.71.47.3.621.941.36 1.381zm.127-3.39c-4.149-2.469-10.999-2.698-14.96-1.493-.64.189-1.31-.17-1.5-.809-.19-.641.17-1.311.81-1.5 4.551-1.381 12.111-1.111 16.89 1.73.58.34.77 1.08.43 1.66-.34.58-1.081.771-1.661.43l-.009-.018z" />
    </svg>
  );
}

const styles = {
  root: {
    minHeight:       "100vh",
    background:      "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(29,185,84,0.08) 0%, transparent 60%), #0e0700",
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
    border:       "1px solid rgba(29,185,84,0.12)",
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
    border:       "2px solid rgba(29,185,84,0.15)",
    borderTop:    "2px solid #1DB954",
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
    color:     "#1DB954",
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
