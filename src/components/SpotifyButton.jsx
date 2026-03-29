// src/components/SpotifyButton.jsx
import { useState } from "react";
import { Loader } from "lucide-react";

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const REDIRECT_URI = `${window.location.origin}/auth/spotify/callback`;

export default function SpotifyButton({ onSuccess, onError, disabled }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!SPOTIFY_CLIENT_ID) {
      onError?.({ message: "Spotify OAuth is not configured" });
      return;
    }

    setLoading(true);

    const searchParams = new URLSearchParams(window.location.search);
    const redirectAfter = searchParams.get("redirect") || "/menu";
    sessionStorage.setItem("oauth_redirect", redirectAfter);

    const params = new URLSearchParams({
      client_id:     SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri:  REDIRECT_URI,
      scope:         "user-read-email user-read-private",
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || !SPOTIFY_CLIENT_ID}
      style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             10,
        width:           "100%",
        background:      "#0d1f12",
        border:          "1.5px solid rgba(29,185,84,0.20)",
        borderRadius:    12,
        padding:         "13px 16px",
        cursor:          disabled || loading ? "not-allowed" : "pointer",
        opacity:         disabled || loading ? 0.55 : 1,
        transition:      "all 0.2s",
        color:           "#f0f6fc",
        fontFamily:      "'Plus Jakarta Sans', sans-serif",
        fontSize:        14,
        fontWeight:      700,
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.borderColor = "rgba(29,185,84,0.50)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(29,185,84,0.20)"; }}
    >
      {loading ? (
        <Loader style={{ width: 18, height: 18, animation: "spin 0.8s linear infinite" }} />
      ) : (
        <SpotifyIcon />
      )}
      Continue with Spotify
    </button>
  );
}

function SpotifyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.241-3.021-1.858-6.832-2.278-11.322-1.237-.422.1-.851-.16-.949-.583-.1-.422.16-.851.583-.949 4.911-1.121 9.128-.638 12.521 1.431.38.249.49.73.241 1.1l.027-.003zm1.473-3.26c-.299.469-.939.619-1.408.32-3.459-2.13-8.73-2.748-12.821-1.5-.529.16-1.08-.141-1.24-.67-.159-.529.141-1.081.67-1.241 4.671-1.42 10.469-.729 14.439 1.71.47.3.621.941.36 1.381zm.127-3.39c-4.149-2.469-10.999-2.698-14.96-1.493-.64.189-1.31-.17-1.5-.809-.19-.641.17-1.311.81-1.5 4.551-1.381 12.111-1.111 16.89 1.73.58.34.77 1.08.43 1.66-.34.58-1.081.771-1.661.43l-.009-.018z" />
    </svg>
  );
}
