// src/components/PasskeyManager.jsx
/**
 * Passkey / fingerprint management panel - Top App Bar Style
 */

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
  ChevronLeft,
  MoreVertical,
  Lock,
  Smartphone,
  KeyRound
} from "lucide-react";
import { HiFingerPrint, HiShieldCheck, HiOutlineLockClosed } from "react-icons/hi2";
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
  const [selectedCred, setSelectedCred] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/webauthn/credentials");
      setCreds(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const notify = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError("");
    try {
      const label = `Passkey ${creds.length + 1}`;
      await registerFingerprint(label);
      notify("Fingerprint registered successfully!");
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
      notify("Passkey removed");
      setSelectedCred(null);
      await load();
    } catch {
      notify("Could not remove passkey", true);
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
      notify("Could not rename passkey", true);
    }
  };

  const startEdit = (cred) => {
    setEditId(cred.id);
    setEditLabel(cred.label || "Passkey");
  };

  const formatDate = (dt) => {
    if (!dt) return "Never";
    return new Date(dt).toLocaleDateString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const getDeviceIcon = (cred) => {
    if (cred?.backed_up) return <Smartphone className="w-5 h-5 text-[#5BC0BE]" />;
    return <KeyRound className="w-5 h-5 text-[#5BC0BE]" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] flex flex-col">
      {/* Top App Bar */}
      <motion.header 
        className="sticky top-0 z-50 bg-[#0B132B]/90 backdrop-blur-xl border-b border-[#5BC0BE]/20"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onBack}
                className="p-2 rounded-xl hover:bg-[#5BC0BE]/10 text-[#6B7A8F] hover:text-[#5BC0BE] transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#5BC0BE]/10 border border-[#5BC0BE]/30">
                <HiFingerPrint className="w-5 h-5 text-[#5BC0BE]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#F4F1DE]">Passkeys</h1>
                <p className="text-xs text-[#6B7A8F]">{creds.length} registered</p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRegister}
            disabled={registering}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5BC0BE]/10 border border-[#5BC0BE]/30 text-[#5BC0BE] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#5BC0BE]/20 transition-colors"
          >
            {registering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{registering ? "Adding..." : "Add"}</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-4">
        {/* Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#E74C3C]/10 border border-[#E74C3C]/30 text-[#E74C3C]"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#5BC0BE]/10 border border-[#5BC0BE]/30 text-[#5BC0BE]"
            >
              <HiShieldCheck className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-10 h-10 text-[#5BC0BE]/50" />
            </motion.div>
            <p className="mt-4 text-[#6B7A8F] text-sm">Loading passkeys...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && creds.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-[#5BC0BE]/10 border border-[#5BC0BE]/20 flex items-center justify-center mb-6">
              <Fingerprint className="w-12 h-12 text-[#5BC0BE]/50" />
            </div>
            <h3 className="text-xl font-bold text-[#F4F1DE] mb-2">No Passkeys Yet</h3>
            <p className="text-[#6B7A8F] max-w-xs mb-6">
              Add a fingerprint to sign in quickly and securely without a password
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRegister}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5BC0BE] text-[#0B132B] font-bold hover:bg-[#5BC0BE]/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Passkey
            </motion.button>
          </motion.div>
        )}

        {/* Passkey List */}
        {!loading && creds.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {creds.map((c, index) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                    selectedCred?.id === c.id 
                      ? 'bg-[#5BC0BE]/10 border-[#5BC0BE]/40' 
                      : 'bg-[#1C2541]/50 border-[#5BC0BE]/10 hover:border-[#5BC0BE]/30 hover:bg-[#1C2541]/70'
                  }`}
                >
                  {editId === c.id ? (
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#5BC0BE]/10">
                        {getDeviceIcon(c)}
                      </div>
                      <div className="flex-1">
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => { 
                            if (e.key === "Enter") handleRename(c.id); 
                            if (e.key === "Escape") setEditId(null); 
                          }}
                          autoFocus
                          className="w-full px-3 py-2 rounded-lg bg-[#0B132B]/50 border border-[#5BC0BE]/30 text-[#F4F1DE] text-sm font-semibold focus:outline-none focus:border-[#5BC0BE]"
                          placeholder="Passkey name"
                        />
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRename(c.id)}
                          className="p-2 rounded-lg bg-[#5BC0BE]/20 text-[#5BC0BE] hover:bg-[#5BC0BE]/30"
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditId(null)}
                          className="p-2 rounded-lg bg-[#6B7A8F]/20 text-[#6B7A8F] hover:bg-[#6B7A8F]/30"
                        >
                          <span className="text-lg leading-none">×</span>
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-[#5BC0BE]/10 border border-[#5BC0BE]/20">
                        {getDeviceIcon(c)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#F4F1DE] truncate">
                            {c.label || "Passkey"}
                          </h4>
                          {c.backed_up && (
                            <span className="px-2 py-0.5 rounded-full bg-[#5BC0BE]/20 text-[#5BC0BE] text-[10px] font-bold uppercase tracking-wider">
                              Synced
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7A8F]">
                          <span>Added {formatDate(c.created_at)}</span>
                          {c.last_used_at && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-[#3A506B]" />
                              <span>Last used {formatDate(c.last_used_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => startEdit(c)}
                          className="p-2 rounded-xl text-[#6B7A8F] hover:text-[#5BC0BE] hover:bg-[#5BC0BE]/10 transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(c.id)}
                          className="p-2 rounded-xl text-[#6B7A8F] hover:text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Security Info Card */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 rounded-2xl bg-[#1C2541]/30 border border-[#5BC0BE]/10"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#5BC0BE]/10">
                <HiOutlineLockClosed className="w-5 h-5 text-[#5BC0BE]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#F4F1DE] text-sm mb-1">Secure by Design</h4>
                <p className="text-xs text-[#6B7A8F] leading-relaxed">
                  Your fingerprint never leaves your device. Passkeys are stored in your device's secure enclave and cannot be extracted or copied.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
