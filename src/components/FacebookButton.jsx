// src/components/FacebookButton.jsx
//
// ─── FACEBOOK LOGIN — UNCOMMENT WHEN READY ───────────────────────────────────
//
// Setup checklist before uncommenting:
//   1. Create a Facebook App at https://developers.facebook.com
//   2. Add "Facebook Login" product, set Valid OAuth Redirect URIs:
//        https://foodsorder.vercel.app/auth/facebook/callback
//        http://localhost:5173/auth/facebook/callback
//   3. Add to .env:      VITE_FACEBOOK_APP_ID=your_app_id
//   4. Add to Vercel:    VITE_FACEBOOK_APP_ID=your_app_id
//   5. Add to backend .env + config.py:
//        FACEBOOK_APP_ID=...
//        FACEBOOK_APP_SECRET=...
//   6. Create src/pages/FacebookCallback.jsx (same pattern as GitHubCallback)
//   7. Add route in App.jsx:
//        <Route path="/auth/facebook/callback" element={<FacebookCallback />} />
//   8. Add POST /auth/facebook route in backend routes/auth.py
//   9. Remove the /* */ block wrapper below
//
// ─────────────────────────────────────────────────────────────────────────────

/*
import { useState } from "react";
import { Loader } from "lucide-react";

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const REDIRECT_URI    = `${window.location.origin}/auth/facebook/callback`;

export default function FacebookButton({ onSuccess, onError, disabled }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!FACEBOOK_APP_ID) {
      onError?.({ message: "Facebook OAuth is not configured" });
      return;
    }

    setLoading(true);

    const searchParams  = new URLSearchParams(window.location.search);
    const redirectAfter = searchParams.get("redirect") || "/menu";
    sessionStorage.setItem("oauth_redirect", redirectAfter);

    const params = new URLSearchParams({
      client_id:     FACEBOOK_APP_ID,
      redirect_uri:  REDIRECT_URI,
      scope:         "email,public_profile",
      response_type: "code",
    });

    window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || !FACEBOOK_APP_ID}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            10,
        width:          "100%",
        background:     "#0c1929",
        border:         "1.5px solid rgba(24,119,242,0.25)",
        borderRadius:   12,
        padding:        "13px 16px",
        cursor:         disabled || loading ? "not-allowed" : "pointer",
        opacity:        disabled || loading ? 0.55 : 1,
        transition:     "all 0.2s",
        color:          "#f0f6fc",
        fontFamily:     "'Plus Jakarta Sans', sans-serif",
        fontSize:       14,
        fontWeight:     700,
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.borderColor = "rgba(24,119,242,0.55)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(24,119,242,0.25)"; }}
    >
      {loading ? (
        <Loader style={{ width: 18, height: 18, animation: "spin 0.8s linear infinite" }} />
      ) : (
        <FacebookIcon />
      )}
      Continue with Facebook
    </button>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}
*/

// Temporary placeholder export so imports don't break while commented out
export default function FacebookButton() {
  return null;
}
