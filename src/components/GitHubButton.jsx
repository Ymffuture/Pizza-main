// src/components/GitHubButton.jsx
import { useState } from "react";
import { Loader } from "lucide-react";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

// Matches exactly what GitHubCallback.jsx will send
const REDIRECT_URI = `${window.location.origin}/auth/github/callback`;

export default function GitHubButton({ onSuccess, onError, disabled }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!GITHUB_CLIENT_ID) {
      onError?.({ message: "GitHub OAuth is not configured" });
      return;
    }

    setLoading(true);

    // Persist the current redirect intent so the callback page can forward to it
    const searchParams = new URLSearchParams(window.location.search);
    const redirectAfter = searchParams.get("redirect") || "/menu";
    sessionStorage.setItem("oauth_redirect", redirectAfter);

    const params = new URLSearchParams({
      client_id:    GITHUB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope:        "read:user user:email",
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
    // Note: setLoading(false) is intentionally omitted — the page navigates away.
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || !GITHUB_CLIENT_ID}
      style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             10,
        width:           "100%",
        background:      "#161b22",
        border:          "1.5px solid rgba(255,255,255,0.10)",
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
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.borderColor = "rgba(255,255,255,0.30)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; }}
    >
      {loading ? (
        <Loader style={{ width: 18, height: 18, animation: "spin 0.8s linear infinite" }} />
      ) : (
        <GitHubIcon />
      )}
      Continue with GitHub
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
