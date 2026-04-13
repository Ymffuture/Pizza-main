// src/pages/GitHubCallback.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Github, XCircle, CheckCircle2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loader3 from "../components/Loader";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const REDIRECT_URI = `${window.location.origin}/auth/github/callback`;

export default function GitHubCallback() {
  const navigate = useNavigate();
  const { loginWithOAuth } = useAuth();
  const toast = useToast();
  const ran = useRef(false);

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("Connecting to GitHub...");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

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
        setMessage("Verifying with GitHub...");
        const { data } = await axios.post(`${API}/auth/github`, {
          code,
          redirect_uri: REDIRECT_URI,
        });

        setMessage("Signing you in...");
        await loginWithOAuth(data.access_token, data.user);

        setStatus("success");
        
        toast.show({
          type: "success",
          title: "Welcome!",
          message: data.user?.full_name || data.user?.email,
        });

        setTimeout(() => {
          const redirectTo = sessionStorage.getItem("oauth_redirect") || "/menu";
          sessionStorage.removeItem("oauth_redirect");
          navigate(redirectTo, { replace: true });
        }, 1500);

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
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
      {/* GitHub-style dot pattern background */}
      <div 
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#58a6ff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Main Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 shadow-2xl">
          
          {/* Header / Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-2xl bg-[#21262d] border border-[#30363d] flex items-center justify-center mb-4"
            >
              <Github className="w-8 h-8 text-[#f0f6fc]" />
            </motion.div>
            <h1 className="text-xl font-semibold text-[#f0f6fc]">
              Nemo Online Exam
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Secure authentication
            </p>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-8"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-[#30363d] flex items-center justify-center">
                    <Loader3 size={40} className="text-[#58a6ff]" />
                  </div>
                  {/* Orbiting dots */}
                  <motion.div 
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#58a6ff]" />
                  </motion.div>
                </div>
                
                <h2 className="text-lg font-medium text-[#f0f6fc] mb-2">
                  Connecting to GitHub
                </h2>
                <p className="text-sm text-[#8b949e] text-center">
                  {message}
                </p>

                {/* Progress steps */}
                <div className="flex items-center gap-2 mt-6">
                  <div className="w-2 h-2 rounded-full bg-[#238636] animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-[#30363d] animate-pulse delay-75" />
                  <div className="w-2 h-2 rounded-full bg-[#30363d] animate-pulse delay-150" />
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-[#238636]/20 border-2 border-[#238636] flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-[#3fb950]" />
                </motion.div>
                
                <h2 className="text-lg font-medium text-[#f0f6fc] mb-2">
                  Authentication Successful
                </h2>
                <p className="text-sm text-[#8b949e] text-center">
                  Redirecting you to the dashboard...
                </p>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-[#f85149]/10 border-2 border-[#f85149]/30 flex items-center justify-center mb-6"
                >
                  <XCircle className="w-8 h-8 text-[#f85149]" />
                </motion.div>
                
                <h2 className="text-lg font-medium text-[#f0f6fc] mb-2">
                  Authentication Failed
                </h2>
                <p className="text-sm text-[#f85149] text-center mb-6 px-4">
                  {errMsg}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/login", { replace: true })}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#f0f6fc] font-medium transition-colors"
                >
                  Back to Login
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Footer */}
          <div className="mt-8 pt-6 border-t border-[#21262d] flex items-center justify-center gap-2 text-xs text-[#8b949e]">
            <Shield className="w-3 h-3" />
            <span>Secured with OAuth 2.0</span>
            <span className="text-[#484f58]">•</span>
            <span>GitHub</span>
          </div>
        </div>

        {/* GitHub Octocat watermark */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 opacity-[0.03] pointer-events-none">
          <Github className="w-64 h-64" />
        </div>
      </motion.div>
    </div>
  );
}
