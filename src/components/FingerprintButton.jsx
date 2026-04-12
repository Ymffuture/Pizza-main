// src/components/FingerprintButton.jsx — FIXED
// Fix: prepareCreateOptions now correctly handles user.id as base64url string
// (backend sends it base64url-encoded; we must decode it to ArrayBuffer)

import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import axiosClient from "../api/axiosClient";

// ── base64url helpers ─────────────────────────────────────────────────────────
function b64urlToBuffer(b64url) {
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded  = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)).buffer;
}
function bufferToB64url(buffer) {
  let binary = "";
  new Uint8Array(buffer).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ── Option transformers ────────────────────────────────────────────────────────
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

function prepareCreateOptions(opts) {
  // FIX: user.id comes as a base64url string from the server
  // It must be decoded to ArrayBuffer for navigator.credentials.create()
  const userId = opts.user?.id;
  let userIdBuf;
  try {
    userIdBuf = b64urlToBuffer(userId);
  } catch {
    // Fallback: treat as plain text
    userIdBuf = new TextEncoder().encode(String(userId)).buffer;
  }

  return {
    ...opts,
    challenge: b64urlToBuffer(opts.challenge),
    user: {
      ...opts.user,
      id: userIdBuf,
    },
    excludeCredentials: (opts.excludeCredentials || []).map((c) => ({
      ...c,
      id: b64urlToBuffer(c.id),
    })),
  };
}

// ── Serialisers ────────────────────────────────────────────────────────────────
function serializeAssertion(cred) {
  const r = cred.response;
  return {
    id: cred.id, rawId: bufferToB64url(cred.rawId), type: cred.type,
    response: {
      clientDataJSON:    bufferToB64url(r.clientDataJSON),
      authenticatorData: bufferToB64url(r.authenticatorData),
      signature:         bufferToB64url(r.signature),
      ...(r.userHandle ? { userHandle: bufferToB64url(r.userHandle) } : {}),
    },
  };
}

function serializeAttestation(cred) {
  const r = cred.response;
  return {
    id: cred.id, rawId: bufferToB64url(cred.rawId), type: cred.type,
    response: {
      clientDataJSON:    bufferToB64url(r.clientDataJSON),
      attestationObject: bufferToB64url(r.attestationObject),
    },
  };
}

// ── Support check ──────────────────────────────────────────────────────────────
function isWebAuthnSupported() {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = { idle: "", requesting: "Preparing…", biometric: "Touch sensor…", verifying: "Verifying…" };

// ── Login button ───────────────────────────────────────────────────────────────
export default function FingerprintButton({ email, onSuccess, onError }) {
  const [step,      setStep]      = useState("idle");
  const [supported, setSupported] = useState(false);

  useEffect(() => { setSupported(isWebAuthnSupported()); }, []);

  if (!supported) return null;

  const loading = step !== "idle";

  const handleSignIn = async () => {
    if (!email?.trim()) { onError?.({ message: "Enter your email address first" }); return; }
    try {
      setStep("requesting");
      const { data: opts } = await axiosClient.post("/webauthn/auth/options", {
        email: email.trim().toLowerCase(),
      });

      setStep("biometric");
      const assertion = await navigator.credentials.get({ publicKey: prepareGetOptions(opts) });
      if (!assertion) throw new Error("No credential returned");

      setStep("verifying");
      const { data: result } = await axiosClient.post("/webauthn/auth/verify", {
        email:      email.trim().toLowerCase(),
        credential: serializeAssertion(assertion),
      });
      onSuccess?.(result);
    } catch (err) {
      onError?.({ message: _friendlyError(err) });
    } finally {
      setStep("idle");
    }
  };

  return (
    <button type="button" onClick={handleSignIn} disabled={loading} style={btnStyle(loading)}>
      {loading ? (
        <><Loader style={{ width: 18, height: 18, animation: "fp-spin .8s linear infinite" }} /><span>{STEPS[step]}</span></>
      ) : (
        <><FingerprintSvg /><span>Sign in with Fingerprint</span></>
      )}
      <style>{`@keyframes fp-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

// ── Registration export (for PasskeyManager) ───────────────────────────────────
export async function registerFingerprint(label = "") {
  if (!isWebAuthnSupported()) throw new Error("WebAuthn is not supported on this device");

  // 1. Get creation options from server
  const { data: opts } = await axiosClient.post("/webauthn/register/options");

  // 2. Transform for the browser API (FIX: decode user.id correctly)
  const createOptions = prepareCreateOptions(opts);

  // 3. Prompt device biometric
  const credential = await navigator.credentials.create({ publicKey: createOptions });
  if (!credential) throw new Error("Registration cancelled");

  // 4. Verify & persist on server
  const { data: result } = await axiosClient.post("/webauthn/register/verify", {
    credential: serializeAttestation(credential),
    label:      label || undefined,
  });

  return result;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function _friendlyError(err) {
  const name   = err?.name || "";
  const detail = err?.response?.data?.detail || "";
  if (name === "NotAllowedError") return "Fingerprint scan cancelled — please try again.";
  if (name === "SecurityError")   return "Security error — make sure you're on HTTPS.";
  if (name === "NotSupportedError") return "This authenticator is not supported.";
  if (name === "InvalidStateError") return "This passkey is already registered.";
  if (detail.includes("No passkey")) return "No fingerprint registered. Sign in with password first, then add it in Settings.";
  return detail || err?.message || "Fingerprint login failed.";
}

function btnStyle(disabled) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", padding: "13px 16px",
    background: "rgba(255,248,231,0.04)", border: "1.5px solid rgba(255,248,231,0.14)",
    borderRadius: 14, color: "rgba(255,248,231,0.85)",
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1, transition: "all 0.2s", boxSizing: "border-box",
  };
}

function FingerprintSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
      <path d="M2 12a10 10 0 0 1 18-6"/>
      <path d="M2 17c1.34-2.06 2-4.18 2-5"/>
      <path d="M5 14a9.97 9.97 0 0 0 1.38 5"/>
      <path d="M22 12a10 10 0 0 1-2.45 6.66"/>
    </svg>
  );
}
