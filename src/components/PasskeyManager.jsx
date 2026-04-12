// src/components/PasskeyManager.jsx
/**
 * Passkey / fingerprint management panel.
 * Drop into any settings or profile page (user must be logged in).
 *
 * Usage:
 *   import PasskeyManager from "../components/PasskeyManager";
 *   <PasskeyManager />
 */

import { useState, useEffect, useCallback } from "react";
import { Fingerprint, Plus, Trash2, Pencil, Loader, ShieldCheck, AlertCircle } from "lucide-react";
import { registerFingerprint } from "./FingerprintButton";
import axiosClient from "../api/axiosClient";

export default function PasskeyManager() {
  const [creds, setCreds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId]   = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/webauthn/credentials");
      setCreds(data);
    } catch {
      // ignore — user may not have any yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const notify = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else          { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError("");
    try {
      const label = `Passkey ${creds.length + 1}`;
      await registerFingerprint(label);
      notify("Fingerprint registered! 🔒");
      await load();
    } catch (err) {
      const name = err?.name || "";
      if (name === "NotAllowedError")
        notify("Registration cancelled — please try again.", true);
      else if (name === "InvalidStateError")
        notify("This authenticator is already registered.", true);
      else
        notify(err?.response?.data?.detail || err?.message || "Registration failed.", true);
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this passkey? You won't be able to use fingerprint login with it anymore.")) return;
    try {
      await axiosClient.delete(`/webauthn/credentials/${id}`);
      notify("Passkey removed.");
      await load();
    } catch {
      notify("Could not remove passkey.", true);
    }
  };

  const handleRename = async (id) => {
    if (!editLabel.trim()) return;
    try {
      await axiosClient.patch(`/webauthn/credentials/${id}`, { label: editLabel.trim() });
      setEditId(null);
      setEditLabel("");
      await load();
    } catch {
      notify("Could not rename passkey.", true);
    }
  };

  const startEdit = (cred) => {
    setEditId(cred.id);
    setEditLabel(cred.label || "Passkey");
  };

  const formatDate = (dt) => {
    if (!dt) return "never";
    return new Date(dt).toLocaleDateString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={iconWrapStyle}>
            <Fingerprint style={{ width: 18, height: 18, color: "#FFC72C" }} />
          </div>
          <div>
            <h3 style={titleStyle}>Passkeys & Fingerprints</h3>
            <p style={subtitleStyle}>Sign in without a password using your device's biometrics</p>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={registering}
          style={addBtnStyle(registering)}
        >
          {registering ? (
            <Loader style={{ width: 14, height: 14, animation: "pm-spin 0.8s linear infinite" }} />
          ) : (
            <Plus style={{ width: 14, height: 14 }} />
          )}
          {registering ? "Touch sensor…" : "Add Fingerprint"}
        </button>
      </div>

      {/* Feedback */}
      {error   && <Banner type="error"   msg={error}   />}
      {success && <Banner type="success" msg={success} />}

      {/* List */}
      {loading ? (
        <div style={emptyStyle}>
          <Loader style={{ width: 20, height: 20, animation: "pm-spin 0.8s linear infinite", opacity: 0.4 }} />
        </div>
      ) : creds.length === 0 ? (
        <div style={emptyStyle}>
          <Fingerprint style={{ width: 32, height: 32, opacity: 0.2, marginBottom: 8 }} />
          <p style={{ color: "rgba(255,248,231,0.35)", fontSize: 13, margin: 0 }}>
            No passkeys registered yet.
          </p>
          <p style={{ color: "rgba(255,248,231,0.25)", fontSize: 12, margin: "4px 0 0" }}>
            Click "Add Fingerprint" to set one up.
          </p>
        </div>
      ) : (
        <ul style={listStyle}>
          {creds.map((c) => (
            <li key={c.id} style={itemStyle}>
              <div style={itemIconStyle}>
                <ShieldCheck style={{ width: 16, height: 16, color: "#4ade80" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {editId === c.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(c.id); if (e.key === "Escape") setEditId(null); }}
                      autoFocus
                      style={inputStyle}
                    />
                    <button onClick={() => handleRename(c.id)} style={saveStyle}>Save</button>
                    <button onClick={() => setEditId(null)}    style={cancelStyle}>×</button>
                  </div>
                ) : (
                  <>
                    <p style={credLabelStyle}>{c.label || "Passkey"}</p>
                    <p style={credMetaStyle}>
                      Added {formatDate(c.created_at)}
                      {c.last_used_at && ` · Last used ${formatDate(c.last_used_at)}`}
                      {c.backed_up && " · ☁️ Synced"}
                    </p>
                  </>
                )}
              </div>

              {editId !== c.id && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => startEdit(c)}
                    style={iconBtnStyle}
                    title="Rename"
                  >
                    <Pencil style={{ width: 14, height: 14 }} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{ ...iconBtnStyle, color: "#f87171" }}
                    title="Remove"
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p style={hintStyle}>
        🔒 Passkeys use your device's secure enclave — your fingerprint never leaves your device.
      </p>

      <style>{`@keyframes pm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Banner({ type, msg }) {
  const isError = type === "error";
  return (
    <div style={{
      display:      "flex",
      alignItems:   "center",
      gap:          10,
      padding:      "10px 14px",
      borderRadius: 12,
      background:   isError ? "rgba(218,41,28,0.08)" : "rgba(74,222,128,0.08)",
      border:       `1px solid ${isError ? "rgba(218,41,28,0.25)" : "rgba(74,222,128,0.25)"}`,
      marginBottom: 12,
      fontSize:     13,
      color:        isError ? "#f87171" : "#4ade80",
    }}>
      {isError
        ? <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
        : <ShieldCheck  style={{ width: 14, height: 14, flexShrink: 0 }} />}
      {msg}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const containerStyle = {
  background:   "#1a0e00",
  border:       "1px solid rgba(255,199,44,0.12)",
  borderRadius: 20,
  padding:      "20px 20px 16px",
  fontFamily:   "'Plus Jakarta Sans', system-ui, sans-serif",
};

const headerStyle = {
  display:        "flex",
  alignItems:     "flex-start",
  justifyContent: "space-between",
  gap:            12,
  marginBottom:   16,
  flexWrap:       "wrap",
};

const iconWrapStyle = {
  width:          36,
  height:         36,
  borderRadius:   10,
  background:     "rgba(255,199,44,0.1)",
  border:         "1px solid rgba(255,199,44,0.2)",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  flexShrink:     0,
};

const titleStyle    = { color: "#fff8e7", fontSize: 15, fontWeight: 800, margin: 0 };
const subtitleStyle = { color: "rgba(255,248,231,0.45)", fontSize: 12, margin: "3px 0 0" };

const addBtnStyle = (disabled) => ({
  display:        "flex",
  alignItems:     "center",
  gap:            6,
  padding:        "8px 14px",
  background:     disabled ? "rgba(255,199,44,0.05)" : "rgba(255,199,44,0.1)",
  border:         "1px solid rgba(255,199,44,0.25)",
  borderRadius:   10,
  color:          "#FFC72C",
  fontSize:       13,
  fontWeight:     700,
  cursor:         disabled ? "not-allowed" : "pointer",
  opacity:        disabled ? 0.6 : 1,
  fontFamily:     "'Plus Jakarta Sans', sans-serif",
  whiteSpace:     "nowrap",
  transition:     "all 0.2s",
  flexShrink:     0,
});

const emptyStyle = {
  display:        "flex",
  flexDirection:  "column",
  alignItems:     "center",
  padding:        "28px 0",
  textAlign:      "center",
};

const listStyle = {
  listStyle:    "none",
  margin:       0,
  padding:      0,
  display:      "flex",
  flexDirection:"column",
  gap:          8,
};

const itemStyle = {
  display:      "flex",
  alignItems:   "center",
  gap:          12,
  padding:      "12px 14px",
  background:   "rgba(255,248,231,0.03)",
  border:       "1px solid rgba(255,248,231,0.06)",
  borderRadius: 12,
};

const itemIconStyle = {
  width:          32,
  height:         32,
  borderRadius:   9,
  background:     "rgba(74,222,128,0.08)",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  flexShrink:     0,
};

const credLabelStyle = { color: "#fff8e7",  fontSize: 13, fontWeight: 700, margin: 0 };
const credMetaStyle  = { color: "rgba(255,248,231,0.4)", fontSize: 11, margin: "3px 0 0" };

const iconBtnStyle = {
  background:   "none",
  border:       "1px solid rgba(255,248,231,0.08)",
  borderRadius: 8,
  color:        "rgba(255,248,231,0.4)",
  cursor:       "pointer",
  padding:      "6px",
  display:      "flex",
  alignItems:   "center",
  transition:   "all 0.2s",
};

const inputStyle = {
  flex:         1,
  background:   "rgba(255,248,231,0.05)",
  border:       "1.5px solid rgba(255,199,44,0.35)",
  borderRadius: 8,
  color:        "#fff8e7",
  fontSize:     13,
  padding:      "5px 10px",
  fontFamily:   "'Plus Jakarta Sans', sans-serif",
  outline:      "none",
};

const saveStyle = {
  padding:    "5px 12px",
  background: "rgba(255,199,44,0.15)",
  border:     "1px solid rgba(255,199,44,0.35)",
  borderRadius: 8,
  color:      "#FFC72C",
  fontSize:   12,
  fontWeight: 700,
  cursor:     "pointer",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const cancelStyle = {
  ...saveStyle,
  background: "transparent",
  border:     "1px solid rgba(255,248,231,0.1)",
  color:      "rgba(255,248,231,0.5)",
};

const hintStyle = {
  fontSize:   11,
  color:      "rgba(255,248,231,0.25)",
  marginTop:  14,
  textAlign:  "center",
};
