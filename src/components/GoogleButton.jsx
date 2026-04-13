import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => handleLogin()}
      disabled={isLoading}
      className="group relative w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-[#1C2541] hover:bg-[#1C2541]/80 border border-[#5BC0BE]/20 hover:border-[#5BC0BE]/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#5BC0BE]/0 via-[#5BC0BE]/5 to-[#5BC0BE]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Loading or Google Icon */}
      {isLoading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-[#5BC0BE]/30 border-t-[#5BC0BE] rounded-full"
          />
          <span className="text-[#F4F1DE] font-semibold text-sm">Connecting...</span>
        </>
      ) : (
        <>
          {/* Official Google "G" with subtle glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#5BC0BE]/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg width="20" height="20" viewBox="0 0 18 18" className="relative">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
          </div>
          
          <span className="text-[#F4F1DE] font-semibold text-sm tracking-wide">
            {label}
          </span>
        </>
      )}

      {/* Right side decoration */}
      <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#5BC0BE]/30 group-hover:bg-[#5BC0BE]/60 transition-colors" />
    </motion.button>
  );
}
