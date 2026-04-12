// src/components/FingerprintButton.jsx
/**
 * WebAuthn (passkey / fingerprint) login button.
 * Drop this into any login form — pass the user's email and callbacks.
 *
 * Usage:
 *   <FingerprintButton
 *     email={form.email}
 *     onSuccess={(data) => { saveToken(data.access_token); navigate("/menu"); }}
 *     onError={(err)  => toast.show({ type: "error", message: err.message })}
 *   />
 *
 * Returns null when WebAuthn is not supported by the browser.
 */

import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import axiosClient from "../api/axiosClient";

// ── base64url ↔ ArrayBuffer utilities ────────────────────────────────────

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

/**
 * Convert server-sent options (base64url strings) into the format
 * expected by navigator.credentials.get() / .create() (ArrayBuffers).
 */
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
  return {
    ...opts,
    challenge: b64urlToBuffer(opts.challenge),
    user: {
      ...opts.user,
      id: b64urlToBuffer(opts.user.id),
    },
    excludeCredentials: (opts.excludeCredentials || []).map((c) => ({
      ...c,
      id: b64urlToBuffer(c.id),
    })),
  };
}

/**
 * Serialise a PublicKeyCredential back to plain JSON for the server.
 */
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

function serializeAttestation(credential) {
  const r = credential.response;
  return {
    id:    credential.id,
    rawId: bufferToB64url(credential.rawId),
    type:  credential.type,
    response: {
      clientDataJSON:    bufferToB64url(r.clientDataJSON),
      attestationObject: bufferToB64url(r.attestationObject),
    },
  };
}

// ── Support check ─────────────────────────────────────────────────────────

function isWebAuthnSupported() {
  return (
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined
  );
}

// ── Component ─────────────────────────────────────────────────────────────

const STEPS = {
  idle:       "",
  requesting: "Preparing…",
  biometric:  "Touch your sensor…",
  verifying:  "Verifying…",
};

export default function FingerprintButton({ email, onSuccess, onError }) {
  const [step, setStep]       = useState("idle");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isWebAuthnSupported());
  }, []);

  if (!supported) return null;

  const loading = step !== "idle";

  const handleSignIn = async () => {
    if (!email?.trim()) {
      onError?.({ message: "Enter your email address first" });
      return;
    }

    try {
      // 1 ── Get challenge from server
      setStep("requesting");
      const { data: opts } = await axiosClient.post("/webauthn/auth/options", {
        email: email.trim().toLowerCase(),
      });

      // 2 ── Prompt biometric
      setStep("biometric");
      const assertion = await navigator.credentials.get({
        publicKey: prepareGetOptions(opts),
      });

      if (!assertion) throw new Error("No credential returned");

      // 3 ── Verify with server, get JWT
      setStep("verifying");
      const { data: result } = await axiosClient.post("/webauthn/auth/verify", {
        email:      email.trim().toLowerCase(),
        credential: serializeAssertion(assertion),
      });

      onSuccess?.(result);
    } catch (err) {
      const msg = _friendlyError(err);
      onError?.({ message: msg });
    } finally {
      setStep("idle");
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      style={btnStyle(loading)}
    >
      {loading ? (
        <>
          <Loader style={{ width: 18, height: 18, animation: "fp-spin 0.8s linear infinite" }} />
          <span>{STEPS[step]}</span>
        </>
      ) : (
        <>
          <FingerprintSvg />
          <span>Sign in with Fingerprint</span>
        </>
      )}
      <style>{`@keyframes fp-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

// ── Registration helper (export separately for settings page) ─────────────

export async function registerFingerprint(label = "") {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported on this device");
  }

  // 1. Get creation options (requires auth token in axiosClient)
  const { data: opts } = await axiosClient.post("/webauthn/register/options");

  // 2. Prompt biometric for registration
  const credential = await navigator.credentials.create({
    publicKey: prepareCreateOptions(opts),
  });

  if (!credential) throw new Error("Registration cancelled");

  // 3. Verify & store on server
  const { data: result } = await axiosClient.post("/webauthn/register/verify", {
    credential: serializeAttestation(credential),
    label: label || undefined,
  });

  return result;
}

// ── Inline styles ─────────────────────────────────────────────────────────

function btnStyle(disabled) {
  return {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            10,
    width:          "100%",
    padding:        "13px 16px",
    background:     "rgba(255,248,231,0.04)",
    border:         "1.5px solid rgba(255,248,231,0.14)",
    borderRadius:   14,
    color:          "rgba(255,248,231,0.85)",
    fontFamily:     "'Plus Jakarta Sans', sans-serif",
    fontWeight:     700,
    fontSize:       14,
    cursor:         disabled ? "not-allowed" : "pointer",
    opacity:        disabled ? 0.6 : 1,
    transition:     "all 0.2s",
    boxSizing:      "border-box",
  };
}

// ── Error helper ──────────────────────────────────────────────────────────

function _friendlyError(err) {
  const name = err?.name || "";
  if (name === "NotAllowedError")
    return "Fingerprint scan cancelled or timed out — please try again.";
  if (name === "SecurityError")
    return "Security error — make sure you're on HTTPS.";
  if (name === "NotSupportedError")
    return "This authenticator is not supported.";
  if (name === "InvalidStateError")
    return "This passkey is already registered.";
  const detail = err?.response?.data?.detail;
  if (detail?.includes("No fingerprint"))
    return "No fingerprint registered. Sign in with password first, then add it in Settings.";
  return detail || err?.message || "Fingerprint login failed — please try your password.";
}

// ── SVG fingerprint icon ──────────────────────────────────────────────────

function FingerprintSvg() {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 17c1.34-2.06 2-4.18 2-5" />
      <path d="M5 14a9.97 9.97 0 0 0 1.38 5" />
      <path d="M22 12a10 10 0 0 1-2.45 6.66" />
    </svg>
  );
}
