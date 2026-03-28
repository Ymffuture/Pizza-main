import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { RiLoader5Line } from "react-icons/ri";
// Loading Spinner Component
const LoadingSpinner = ({ size = "md", color = "currentColor" }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  return (
    <svg 
      className={`${sizes[size]} animate-spin`} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={color} 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Full Page Loading Screen
const PageLoadingScreen = ({ message = "Connecting to Google..." }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <style>{`
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(255,199,44,0.3); }
        50% { box-shadow: 0 0 40px rgba(255,199,44,0.6); }
      }
      .loading-card {
        animation: pulse-glow 2s ease-in-out infinite;
      }
    `}</style>
    <div className="loading-card bg-[#1a0e00] border border-[#FFC72C]/30 rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-[#FFC72C]/20 border-t-[#FFC72C] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[#FFC72C] font-bold text-lg mb-1">{message}</p>
        <p className="text-white/50 text-sm">Please wait while we verify your account</p>
      </div>
      <div className="flex gap-1 mt-2">
        <RiLoader5Line/> 
      </div>
    </div>
  </div>
);

export default function GoogleButton({ onSuccess, onError, label = "Continue with Google" }) {
  const { googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setLoadingMessage("Authenticating with Google...");
      
      try {
        setLoadingMessage("Verifying your account...");
        const data = await googleLogin(tokenResponse.access_token);
        setLoadingMessage("Success! Redirecting...");
        onSuccess?.(data);
      } catch (err) {
        setIsLoading(false);
        setLoadingMessage("");
        onError?.(err);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage("");
        }, 500);
      }
    },
    onError: (err) => {
      setIsLoading(false);
      setLoadingMessage("");
      onError?.(err);
    },
  });

  return (
    <>
      <style>{`
        .g-btn {
          display:flex; align-items:center; justify-content:center; gap:10px;
          width:100%; padding:13px; border-radius:12px;
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
        .g-btn-loading {
          position: absolute;
          inset: 0;
          background: rgba(26,14,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .g-btn-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,199,44,0.1), transparent);
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Full Page Loading Screen */}
      {isLoading && <PageLoadingScreen message={loadingMessage} />}

      <button 
        className="g-btn" 
        onClick={() => handleLogin()} 
        type="button"
        disabled={isLoading}
      >
        {/* Shimmer effect when loading */}
        {isLoading && <div className="g-btn-shimmer" />}
        
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" color="#FFC72C" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            {/* Official Google "G" colours */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {label}
          </>
        )}
      </button>
    </>
  );
}
