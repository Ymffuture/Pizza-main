// src/components/FingerprintGate.jsx
/**
 * Wraps any page requiring biometric verification before access.
 *
 * - Checks if the user has passkeys registered.
 * - If yes  → shows a fingerprint prompt before revealing children.
 * - If no   → passes through (no passkeys = no gate).
 * - Verification is cached in sessionStorage for the tab's lifetime.
 *
 * Usage:
 *   <FingerprintGate pageKey="wallet">
 *     <WalletPage />
 *   </FingerprintGate>
 */

import { useState, useEffect, useCallback } from "react";
import { Fingerprint, Loader, ShieldCheck, ShieldX, KeyRound, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

// ── base64url ↔ ArrayBuffer ─────────────────────────────────────────────────

function b64urlToBuffer(b64url) {
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}

function bufferToB64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function prepareGetOptions(opts) {
  return {
    ...opts,
    challenge: b64urlToBuffer(opts.challenge),
    allowCredentials: (opts.allowCredentials || []).map((c) => ({
      ...c,
      id: b64urlToBuffer(c.id),
    })),
  };
}

function serializeAssertion(credential) {
  const r = credential.response;
  return {
    id:    credential.id,
    rawId: bufferToB64url(credential.rawId),
    type:  credential.type,
    response: {
      clientDataJSON:    bufferToB64url(r.clientDataJSON),
      authenticatorData: bufferToB64url(r.authenticatorData),
      signature:         bufferToB64url(r.signature),
      ...(r.userHandle ? { userHandle: bufferToB64url(r.userHandle) } : {}),
    },
  };
}

// ── Session cache ────────────────────────────────────────────────────────────

function isVerified(pageKey) {
  return sessionStorage.getItem(`kb_fp_verified_${pageKey}`) === "1";
}

function markVerified(pageKey) {
  sessionStorage.setItem(`kb_fp_verified_${pageKey}`, "1");
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function FingerprintGate({ children, pageKey = "protected" }) {
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | gate | verified | no_passkeys
  const [step,   setStep]   = useState("idle");    // idle | scanning | verifying | error | success
  const [errMsg, setErrMsg] = useState("");
  const [email,  setEmail]  = useState("");

  const supportsWebAuthn =
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined;

  // 1. On mount: check cache → check if user has passkeys
  useEffect(() => {
    if (isVerified(pageKey)) { setStatus("verified"); return; }
    if (!supportsWebAuthn)   { setStatus("no_passkeys"); return; }

    axiosClient.get("/webauthn/credentials")
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setStatus("gate");
        } else {
          setStatus("no_passkeys");
        }
      })
      .catch(() => {
        // Can't reach server / no auth → skip gate
        setStatus("no_passkeys");
      });

    // Pre-fetch user email for the auth/options call
    axiosClient.get("/auth/me").catch(() => {}).then(res => {
      if (res?.data?.email) setEmail(res.data.email);
    });
  }, [pageKey, supportsWebAuthn]);

  const handleVerify = useCallback(async () => {
    if (!email) {
      setStep("error");
      setErrMsg("Could not determine your account. Please sign in again.");
      return;
    }

    setStep("scanning");
    setErrMsg("");

    try {
      // Get challenge
      const { data: opts } = await axiosClient.post("/webauthn/auth/options", { email });
      setStep("verifying");

      // Prompt biometric
      const assertion = await navigator.credentials.get({
        publicKey: prepareGetOptions(opts),
      });

      if (!assertion) throw new Error("No credential returned");

      // Verify with server (don't need the JWT — just confirm identity)
      await axiosClient.post("/webauthn/auth/verify", {
        email,
        credential: serializeAssertion(assertion),
      });

      setStep("success");
      markVerified(pageKey);
      setTimeout(() => setStatus("verified"), 800);

    } catch (err) {
      const name = err?.name || "";
      if (name === "NotAllowedError") {
        setErrMsg("Fingerprint scan was cancelled.");
      } else if (err?.response?.status === 401 || err?.response?.status === 400) {
        setErrMsg("Verification failed — identity not confirmed.");
      } else {
        setErrMsg(err?.message || "Fingerprint verification failed.");
      }
      setStep("error");
    }
  }, [email, pageKey]);

  // ── Pass-through states ────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div style={screenStyle}>
        <Loader style={{ width: 28, height: 28, color: "var(--gold, #FFC72C)", animation: "fpgSpin 0.8s linear infinite" }} />
        <style>{`@keyframes fpgSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "no_passkeys" || status === "verified") {
    return children;
  }

  // ── Gate UI ────────────────────────────────────────────────────────────────

  const isSuccess = step === "success";
  const isError   = step === "error";
  const isScanning = step === "scanning" || step === "verifying";

  return (
    <div style={screenStyle}>
      <style>{gateStyles}</style>

      <div style={cardStyle}>

        {/* Back button */}
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          <ArrowLeft style={{ width: 14, height: 14 }} />
          <span>Back</span>
        </button>

        {/* Icon */}
        <div style={iconWrapStyle(isSuccess, isError)}>
          {isSuccess
            ? <ShieldCheck style={{ width: 36, height: 36, color: "#4ade80" }} />
            : isError
              ? <ShieldX style={{ width: 36, height: 36, color: "#f87171" }} />
              : isScanning
                ? <Loader style={{ width: 36, height: 36, color: "var(--gold, #FFC72C)", animation: "fpgSpin 0.8s linear infinite" }} />
                : <Fingerprint style={{ width: 36, height: 36, color: "var(--gold, #FFC72C)" }} />
          }

          {/* Pulse rings when idle */}
          {!isScanning && !isSuccess && !isError && (
            <>
              <div style={pulseRingStyle(1)} />
              <div style={pulseRingStyle(2)} />
            </>
          )}
        </div>

        {/* Text */}
        <h2 style={headingStyle}>
          {isSuccess  ? "Identity Verified"
           : isError  ? "Verification Failed"
           : isScanning ? (step === "scanning" ? "Scanning…" : "Verifying…")
           : "Secure Access"}
        </h2>

        <p style={subStyle}>
          {isSuccess
            ? "Welcome! Opening your wallet."
            : isError
              ? errMsg
              : isScanning
                ? "Touch your fingerprint sensor or use your passkey."
                : "Your wallet is protected. Verify your identity with your fingerprint or passkey to continue."}
        </p>

        {/* Verify button (idle + error) */}
        {(step === "idle" || step === "error") && (
          <>
            <button onClick={handleVerify} style={verifyBtnStyle}>
              <Fingerprint style={{ width: 18, height: 18 }} />
              {step === "error" ? "Try Again" : "Verify with Fingerprint"}
            </button>

            <button onClick={() => navigate(-1)} style={skipBtnStyle}>
              <KeyRound style={{ width: 13, height: 13 }} />
              Use password login instead
            </button>
          </>
        )}

        {/* Success checkmark */}
        {isSuccess && (
          <div style={successBarStyle}>
            <ShieldCheck style={{ width: 14, height: 14 }} />
            Opening wallet…
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const screenStyle = {
  minHeight:      "100vh",
  background:     "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,199,44,0.07) 0%, transparent 65%), var(--dark, #0e0700)",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  padding:        24,
  fontFamily:     "'Plus Jakarta Sans', system-ui, sans-serif",
};

const cardStyle = {
  width:          "100%",
  maxWidth:       380,
  background:     "var(--card, #1a0e00)",
  border:         "1px solid var(--border, rgba(255,199,44,0.12))",
  borderRadius:   24,
  padding:        "36px 28px",
  textAlign:      "center",
  display:        "flex",
  flexDirection:  "column",
  alignItems:     "center",
  gap:            16,
  boxShadow:      "0 24px 64px rgba(0,0,0,0.5)",
  position:       "relative",
};

const backBtnStyle = {
  position:       "absolute",
  top:            16,
  left:           16,
  display:        "flex",
  alignItems:     "center",
  gap:            5,
  background:     "rgba(255,248,231,0.05)",
  border:         "1px solid rgba(255,248,231,0.1)",
  borderRadius:   8,
  padding:        "5px 10px",
  color:          "rgba(255,248,231,0.45)",
  fontSize:       11,
  fontWeight:     700,
  cursor:         "pointer",
  fontFamily:     "'Plus Jakarta Sans', sans-serif",
};

const iconWrapStyle = (success, error) => ({
  width:          80,
  height:         80,
  borderRadius:   22,
  background:     success ? "rgba(74,222,128,0.12)"
                : error   ? "rgba(248,113,113,0.1)"
                : "rgba(255,199,44,0.08)",
  border:         `1px solid ${success ? "rgba(74,222,128,0.3)" : error ? "rgba(248,113,113,0.25)" : "rgba(255,199,44,0.2)"}`,
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  position:       "relative",
  marginTop:      24,
});

const pulseRingStyle = (n) => ({
  position:     "absolute",
  inset:        n === 1 ? -8 : -18,
  borderRadius: "50%",
  border:       "1px solid rgba(255,199,44,0.15)",
  animation:    `fpgRing ${1.8 + n * 0.4}s ease-out infinite`,
  animationDelay: `${n * 0.3}s`,
});

const headingStyle = {
  fontFamily:    "'Bebas Neue', sans-serif",
  fontSize:      26,
  letterSpacing: "2px",
  color:         "var(--text, #fff8e7)",
  margin:        0,
};

const subStyle = {
  fontSize:   13,
  color:      "var(--muted, rgba(255,248,231,0.42))",
  lineHeight: 1.6,
  maxWidth:   280,
  margin:     0,
};

const verifyBtnStyle = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  gap:            10,
  width:          "100%",
  padding:        "14px 20px",
  background:     "var(--red, #DA291C)",
  border:         "none",
  borderRadius:   14,
  color:          "#fff",
  fontFamily:     "'Plus Jakarta Sans', sans-serif",
  fontWeight:     900,
  fontSize:       15,
  cursor:         "pointer",
  boxShadow:      "0 6px 20px rgba(218,41,28,0.4)",
  transition:     "all 0.2s",
  marginTop:      4,
};

const skipBtnStyle = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  gap:            6,
  background:     "none",
  border:         "none",
  color:          "rgba(255,248,231,0.35)",
  fontSize:       12,
  fontWeight:     600,
  cursor:         "pointer",
  fontFamily:     "'Plus Jakarta Sans', sans-serif",
};

const successBarStyle = {
  display:       "flex",
  alignItems:    "center",
  gap:           8,
  padding:       "10px 16px",
  background:    "rgba(74,222,128,0.1)",
  border:        "1px solid rgba(74,222,128,0.25)",
  borderRadius:  10,
  color:         "#4ade80",
  fontSize:      12,
  fontWeight:    700,
  width:         "100%",
  justifyContent:"center",
};

const gateStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  @keyframes fpgSpin { to { transform: rotate(360deg); } }
  @keyframes fpgRing {
    0%   { opacity: 0.6; transform: scale(0.9); }
    60%  { opacity: 0.15; }
    100% { opacity: 0;   transform: scale(1.5); }
  }
`;
