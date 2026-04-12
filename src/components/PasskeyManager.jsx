// src/components/PasskeyManager.jsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Fingerprint, 
  Plus, 
  Trash2, 
  Pencil, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  ChevronLeft 
} from "lucide-react";

import { registerFingerprint } from "./FingerprintButton";
import axiosClient from "../api/axiosClient";

export default function PasskeyManager({ onBack }) {
  const [creds, setCreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  // Load user's passkeys
  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/webauthn/credentials");
      setCreds(data || []);
    } catch (err) {
      console.error("Failed to load passkeys:", err);
      setError("Could not load your passkeys. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // Notification helper
  const notify = (message, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4500);
  };

  // Register new passkey
  const handleRegister = async () => {
    if (registering) return;

    setRegistering(true);
    setError("");

    try {
      const label = `KotaPass ${creds.length + 1}`;
      await registerFingerprint(label);   // Make sure this function exists and works
      notify("Passkey registered successfully! 🔒");
      await loadCredentials();
    } catch (err) {
      const errorMsg = err?.response?.data?.detail 
        || err?.message 
        || "Failed to register passkey";
      
      notify(errorMsg, true);
    } finally {
      setRegistering(false);
    }
  };

  // Delete passkey
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this passkey? You won't be able to use fingerprint login with it anymore.")) {
      return;
    }

    try {
      await axiosClient.delete(`/webauthn/credentials/${id}`);
      notify("Passkey removed successfully");
      await loadCredentials();
    } catch (err) {
      notify("Could not remove passkey. Please try again.", true);
    }
  };

  // Rename passkey
  const handleRename = async (id) => {
    if (!editLabel.trim()) return;

    try {
      await axiosClient.patch(`/webauthn/credentials/${id}`, { 
        label: editLabel.trim() 
      });
      setEditId(null);
      setEditLabel("");
      await loadCredentials();
      notify("Passkey renamed successfully");
    } catch (err) {
      notify("Failed to rename passkey", true);
    }
  };

  const startEdit = (cred) => {
    setEditId(cred.id);
    setEditLabel(cred.label || "Passkey");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                <Fingerprint className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Passkeys</h1>
                <p className="text-xs text-zinc-500">{creds.length} registered</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={registering}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-semibold rounded-2xl transition-all active:scale-95"
          >
            {registering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="text-sm">Add Passkey</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <p className="text-sm">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="mt-4 text-zinc-400">Loading your passkeys...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && creds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-3xl bg-zinc-800 flex items-center justify-center mb-6">
              <Fingerprint className="w-12 h-12 text-zinc-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Passkeys Yet</h3>
            <p className="text-zinc-400 max-w-xs mb-8">
              Add a fingerprint or face ID for passwordless login — quick, secure, and lekker.
            </p>
            <button
              onClick={handleRegister}
              className="flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-2xl transition-all active:scale-[0.97]"
            >
              <Plus className="w-5 h-5" />
              Add Your First Passkey
            </button>
          </div>
        )}

        {/* Passkey List */}
        {!loading && creds.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {creds.map((cred) => (
                <motion.div
                  key={cred.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 hover:border-amber-500/30 transition-colors group"
                >
                  {editId === cred.id ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(cred.id);
                          if (e.key === "Escape") {
                            setEditId(null);
                            setEditLabel("");
                          }
                        }}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(cred.id)}
                        className="px-5 py-3 bg-amber-500 text-black rounded-2xl font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditId(null); setEditLabel(""); }}
                        className="px-4 py-3 text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                          <Fingerprint className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{cred.label || "My Passkey"}</p>
                          <p className="text-xs text-zinc-500">
                            Added {formatDate(cred.created_at)}
                            {cred.last_used_at && ` • Last used ${formatDate(cred.last_used_at)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(cred)}
                          className="p-3 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cred.id)}
                          className="p-3 hover:bg-red-500/10 rounded-2xl text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Security Note */}
        <div className="mt-10 p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center">
          <ShieldCheck className="w-8 h-8 mx-auto text-amber-500 mb-3" />
          <p className="text-sm text-zinc-400">
            Your fingerprint never leaves your device.<br />
            Passkeys are stored securely in your phone’s hardware.
          </p>
        </div>
      </div>
    </div>
  );
}
