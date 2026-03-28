import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { RiLoader5Line } from "react-icons/ri";

export default function GoogleButton({ onSuccess, onError, label = "Continue with Google" }) {
  const { googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      
      try {
        const data = await googleLogin(tokenResponse.access_token);
        onSuccess?.(data);
      } catch (err) {
        onError?.(err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (err) => {
      setIsLoading(false);
      onError?.(err);
    },
  });

  return (
    <>
      <style>{`
        .g-btn-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .g-btn {
          display:flex; align-items:center; justify-content:center; gap:10px;
          flex: 1;
          padding:13px; border-radius:12px;
          background:rgba(255,248,231,0.06);
          border:1.5px solid rgba(255,199,44,0.2);
          color:#fff8e7; font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:700; font-size:14px; cursor:pointer;
          transition:all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .g-btn:hover:not(:disabled) { 
          background:rgba(255,248,231,0.1); 
          border-color:rgba(255,199,44,0.4); 
        }
        .g-btn:active:not(:disabled) { transform:scale(0.98); }
        .g-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .g-loader {
          color: #FFC72C;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="g-btn-wrap">
        <button 
          className="g-btn" 
          onClick={() => handleLogin()} 
          type="button"
          disabled={isLoading}
        >
          {/* Official Google "G" colours */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {isLoading ? "Connecting..." : label}
        </button>

        {/* ✅ Spinner next to button like top websites */}
        {isLoading && <RiLoader5Line className="g-loader" />}
      </div>
    </>
  );
}
