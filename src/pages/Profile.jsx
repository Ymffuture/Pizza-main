// src/pages/Profile.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  User as UserIcon, Phone, MapPin, Lock, Camera, Save, Bell,
  Eye, EyeOff, CheckCheck, BellOff, Loader2, ShieldCheck, Mail,
} from "lucide-react";
import { FaFacebook, FaGithub, FaXTwitter, FaInstagram, FaCircleNotch } from "react-icons/fa6";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useBilling } from "../context/BillingContext";
import { useToast } from "../components/Toast";
import Avatar from "../components/Avatar";

const TABS = [
  { id: "profile",       label: "Profile",       Icon: UserIcon },
  { id: "social",        label: "Social",        Icon: FaFacebook },
  { id: "security",      label: "Security",      Icon: Lock },
  { id: "notifications", label: "Notifications", Icon: Bell },
];

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { isProBite } = useBilling();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading]     = useState(true);

  // ── Profile info ─────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [address, setAddress]   = useState("");
  const [email, setEmail]       = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // ── Avatar ───────────────────────────────────────────────────────────
  const [picture, setPicture]         = useState(null);
  const [uploadingAvatar, setUploading] = useState(false);

  // ── Social links ─────────────────────────────────────────────────────
  const [social, setSocial] = useState({ facebook: "", github: "", x: "", instagram: "" });
  const [savingSocial, setSavingSocial] = useState(false);

  // ── Security / password ──────────────────────────────────────────────
  const [hasPassword, setHasPassword]   = useState(true);
  const [currentPw, setCurrentPw]       = useState("");
  const [newPw, setNewPw]               = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError]   = useState("");

  // ── Notifications ────────────────────────────────────────────────────
  const [notifications, setNotifications]     = useState([]);
  const [loadingNotifs, setLoadingNotifs]     = useState(true);
  const [markingAll, setMarkingAll]           = useState(false);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  /* ── Load profile ─────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axiosClient.get("/users/me");
        if (cancelled) return;
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setEmail(data.email || "");
        setEmailVerified(!!data.email_verified);
        setPicture(data.picture || null);
        setHasPassword(!!data.has_password);
        setSocial({
          facebook:  data.social_links?.facebook  || "",
          github:    data.social_links?.github    || "",
          x:         data.social_links?.x         || "",
          instagram: data.social_links?.instagram || "",
        });
      } catch (err) {
        toast.show({ type: "error", title: "Couldn't load your profile", message: err?.response?.data?.detail || err.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Load notifications ───────────────────────────────────────────── */
  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const { data } = await axiosClient.get("/notifications/my");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[Profile] Failed to load notifications:", err.message);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  /* ── Avatar upload ────────────────────────────────────────────────── */
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.show({ type: "error", title: "Unsupported file", message: "Please upload a JPG, PNG, WEBP, or GIF image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.show({ type: "error", title: "Image too large", message: "Max size is 5MB." });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await axiosClient.post("/users/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPicture(data.picture);
      updateUser({ picture: data.picture });
      toast.show({ type: "success", title: "Profile picture updated" });
    } catch (err) {
      toast.show({ type: "error", title: "Upload failed", message: err?.response?.data?.detail || err.message });
    } finally {
      setUploading(false);
    }
  };

  /* ── Save profile info ────────────────────────────────────────────── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileErrors({});

    if (fullName.trim().length < 2) {
      setProfileErrors({ fullName: "Full name must be at least 2 characters." });
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await axiosClient.patch("/users/me", {
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      updateUser({ full_name: data.full_name });
      toast.show({ type: "success", title: "Profile updated" });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        toast.show({ type: "error", title: "Couldn't save", message: detail });
      } else {
        toast.show({ type: "error", title: "Couldn't save", message: "Please check your details and try again." });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Save social links ────────────────────────────────────────────── */
  const handleSaveSocial = async (e) => {
    e.preventDefault();
    setSavingSocial(true);
    try {
      const { data } = await axiosClient.patch("/users/me", { social_links: social });
      setSocial({
        facebook:  data.social_links?.facebook  || "",
        github:    data.social_links?.github    || "",
        x:         data.social_links?.x         || "",
        instagram: data.social_links?.instagram || "",
      });
      toast.show({ type: "success", title: "Social links saved" });
    } catch (err) {
      toast.show({ type: "error", title: "Couldn't save links", message: err?.response?.data?.detail || err.message });
    } finally {
      setSavingSocial(false);
    }
  };

  /* ── Change password ──────────────────────────────────────────────── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (hasPassword && !currentPw) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPw.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setSavingPassword(true);
    try {
      await axiosClient.post("/users/me/password", {
        current_password: hasPassword ? currentPw : undefined,
        new_password: newPw,
      });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setHasPassword(true);
      toast.show({ type: "success", title: hasPassword ? "Password changed" : "Password set" });
    } catch (err) {
      setPasswordError(err?.response?.data?.detail || "Couldn't update your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  /* ── Notification actions ─────────────────────────────────────────── */
  const markRead = async (id) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.warn("[Profile] mark read failed:", err.message);
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unreadIds.map((id) => axiosClient.patch(`/notifications/${id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.warn("[Profile] mark-all failed:", err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="pf-page pf-loading">
          <FaCircleNotch className="pf-spin" style={{ width: 28, height: 28 }} />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="pf-page">
        <div className="pf-container">
<div className="mn-notif-bell-wrapper right-4">
        <NotificationBell />
      </div>
          {/* ── Header ── */}
          <div className="pf-header">
            <div className="pf-avatar-wrap" onClick={handleAvatarClick}>
              <Avatar picture={picture} name={fullName} email={email} size={84} />
              <div className="pf-avatar-overlay">
                {uploadingAvatar ? <FaCircleNotch className="pf-spin" style={{ width: 18, height: 18 }} /> : <Camera style={{ width: 18, height: 18 }} />}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>
            <div className="pf-header-info">
              <h1 className="pf-name">
                {fullName || "Your Profile"}
                {isProBite && (
                  <span className="pf-pro-badge">
                    <RiVerifiedBadgeFill style={{ width: 14, height: 14 }} /> ProBite
                  </span>
                )}
              </h1>
              <p className="pf-email">
                <Mail style={{ width: 12, height: 12 }} /> {email}
                {emailVerified ? (
                  <span className="pf-verified"><ShieldCheck style={{ width: 12, height: 12 }} /> Verified</span>
                ) : (
                  <span className="pf-unverified">Unverified</span>
                )}
              </p>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="pf-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`pf-tab${activeTab === id ? " pf-tab-active" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon style={{ width: 14, height: 14 }} />
                {label}
                {id === "notifications" && unreadCount > 0 && <span className="pf-tab-badge">{unreadCount}</span>}
              </button>
            ))}
          </div>

          {/* ── Profile tab ── */}
          {activeTab === "profile" && (
            <form className="pf-card" onSubmit={handleSaveProfile}>
              <FieldLabel Icon={UserIcon} label="Full name" />
              <input className="pf-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              {profileErrors.fullName && <p className="pf-field-error">{profileErrors.fullName}</p>}

              <FieldLabel Icon={Phone} label="Phone number" />
              <input className="pf-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 65 393 5339" />

              <FieldLabel Icon={MapPin} label="Delivery address" />
              <textarea className="pf-input pf-textarea" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, unit, suburb, city…" />

              <button type="submit" className="pf-save-btn" disabled={savingProfile}>
                {savingProfile ? <FaCircleNotch className="pf-spin" style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
                Save changes
              </button>
            </form>
          )}

          {/* ── Social tab ── */}
          {activeTab === "social" && (
            <form className="pf-card" onSubmit={handleSaveSocial}>
              <p className="pf-hint">Add your handle or a full profile URL — we'll fill in the rest.</p>

              <SocialField Icon={FaFacebook} color="#1877F2" label="Facebook" placeholder="username" value={social.facebook} onChange={(v) => setSocial((s) => ({ ...s, facebook: v }))} />
              <SocialField Icon={FaGithub} color="#e6e6e6" label="GitHub" placeholder="username" value={social.github} onChange={(v) => setSocial((s) => ({ ...s, github: v }))} />
              <SocialField Icon={FaXTwitter} color="#e6e6e6" label="X (Twitter)" placeholder="username" value={social.x} onChange={(v) => setSocial((s) => ({ ...s, x: v }))} />
              <SocialField Icon={FaInstagram} color="#E1306C" label="Instagram" placeholder="username" value={social.instagram} onChange={(v) => setSocial((s) => ({ ...s, instagram: v }))} />

              <button type="submit" className="pf-save-btn" disabled={savingSocial}>
                {savingSocial ? <FaCircleNotch className="pf-spin" style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
                Save links
              </button>
            </form>
          )}

          {/* ── Security tab ── */}
          {activeTab === "security" && (
            <form className="pf-card" onSubmit={handleChangePassword}>
              <p className="pf-hint">
                {hasPassword
                  ? "Change your password. You'll need your current one."
                  : "Your account signed in via a social login — set a password to also sign in with email."}
              </p>

              {hasPassword && (
                <>
                  <FieldLabel Icon={Lock} label="Current password" />
                  <div className="pf-pw-wrap">
                    <input
                      className="pf-input"
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className="pf-pw-toggle" onClick={() => setShowCurrentPw((v) => !v)}>
                      {showCurrentPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </>
              )}

              <FieldLabel Icon={Lock} label={hasPassword ? "New password" : "Set a password"} />
              <div className="pf-pw-wrap">
                <input
                  className="pf-input"
                  type={showNewPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button type="button" className="pf-pw-toggle" onClick={() => setShowNewPw((v) => !v)}>
                  {showNewPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>

              <FieldLabel Icon={Lock} label="Confirm new password" />
              <input className="pf-input" type={showNewPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" />

              {passwordError && <p className="pf-field-error">{passwordError}</p>}

              <button type="submit" className="pf-save-btn" disabled={savingPassword}>
                {savingPassword ? <FaCircleNotch className="pf-spin" style={{ width: 14, height: 14 }} /> : <Lock style={{ width: 14, height: 14 }} />}
                {hasPassword ? "Change password" : "Set password"}
              </button>
            </form>
          )}

          {/* ── Notifications tab ── */}
          {activeTab === "notifications" && (
            <div className="pf-card pf-card-flush">
              <div className="pf-notifs-header">
                <p className="pf-notifs-title">
                  {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
                </p>
                {unreadCount > 0 && (
                  <button className="pf-mark-all-btn" onClick={markAllRead} disabled={markingAll}>
                    {markingAll ? <FaCircleNotch className="pf-spin" style={{ width: 12, height: 12 }} /> : <CheckCheck style={{ width: 12, height: 12 }} />}
                    Mark all read
                  </button>
                )}
              </div>

              {loadingNotifs ? (
                <div className="pf-notifs-empty"><FaCircleNotch className="pf-spin" style={{ width: 20, height: 20 }} /></div>
              ) : notifications.length === 0 ? (
                <div className="pf-notifs-empty">
                  <BellOff style={{ width: 26, height: 26, opacity: 0.35 }} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="pf-notifs-list">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      className={`pf-notif-item${n.is_read ? "" : " pf-notif-unread"}`}
                      onClick={() => !n.is_read && markRead(n.id)}
                    >
                      {!n.is_read && <span className="pf-notif-dot" />}
                      <div className="pf-notif-body">
                        <p className="pf-notif-title-text">{n.title}</p>
                        <p className="pf-notif-msg">{n.message}</p>
                        <p className="pf-notif-time">{timeAgo(n.created_at)}{n.created_by_name ? ` · ${n.created_by_name}` : ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function FieldLabel({ Icon, label }) {
  return (
    <label className="pf-label">
      <Icon style={{ width: 12, height: 12 }} />
      {label}
    </label>
  );
}

function SocialField({ Icon, color, label, placeholder, value, onChange }) {
  return (
    <div className="pf-social-field">
      <div className="pf-social-icon" style={{ color }}>
        <Icon style={{ width: 18, height: 18 }} />
      </div>
      <div className="pf-social-input-wrap">
        <label className="pf-label" style={{ marginBottom: 4 }}>{label}</label>
        <input className="pf-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .pf-page {
    min-height: 100vh;
    background: var(--background, #04111A);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    padding: 32px 16px 80px;
  }
  .pf-loading { display:flex; align-items:center; justify-content:center; color: var(--gold,#06B6D4); }
  .pf-spin { animation: pfSpin 0.8s linear infinite; }
  @keyframes pfSpin { to { transform: rotate(360deg); } }

  .pf-container { max-width: 640px; margin: 0 auto; }

  /* ── Header ── */
  .pf-header { display:flex; align-items:center; gap:18px; margin-bottom:24px; }
  .pf-avatar-wrap { position:relative; cursor:pointer; flex-shrink:0; border-radius:50%; }
  .pf-avatar-overlay {
    position:absolute; inset:0; border-radius:50%;
    background:rgba(0,0,0,0.5); color:#fff;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity 0.18s;
  }
  .pf-avatar-wrap:hover .pf-avatar-overlay { opacity:1; }
  .pf-header-info { min-width:0; flex:1; }
  .pf-name {
    display:flex; align-items:center; gap:10px; flex-wrap:wrap;
    font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:1.5px;
    color:var(--text,#F8F5EE); margin:0;
  }
  .pf-pro-badge {
    display:inline-flex; align-items:center; gap:4px;
    background:rgba(6,182,212,0.15); border:1px solid rgba(6,182,212,0.35);
    color:var(--gold,#06B6D4); font-size:11px; font-weight:800;
    padding:3px 9px; border-radius:50px; letter-spacing:0.02em;
  }
  .pf-email {
    display:flex; align-items:center; gap:6px; flex-wrap:wrap;
    font-size:12.5px; color:var(--muted,rgba(248,245,238,0.45)); margin:6px 0 0;
  }
  .pf-verified { display:flex; align-items:center; gap:3px; color:#4ade80; font-weight:700; }
  .pf-unverified { color:#fbbf24; font-weight:700; }

  /* ── Tabs ── */
  .pf-tabs { display:flex; gap:6px; margin-bottom:18px; overflow-x:auto; padding-bottom:2px; }
  .pf-tab {
    display:flex; align-items:center; gap:6px; flex-shrink:0;
    background:var(--card,#071C26); border:1px solid var(--border,rgba(6,182,212,0.15));
    color:var(--muted,rgba(248,245,238,0.45)); font-size:12.5px; font-weight:700;
    padding:9px 14px; border-radius:11px; cursor:pointer; transition:all 0.18s;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .pf-tab:hover { color:var(--text,#F8F5EE); border-color:rgba(6,182,212,0.3); }
  .pf-tab-active { color:var(--gold,#06B6D4); border-color:rgba(6,182,212,0.5); background:rgba(6,182,212,0.08); }
  .pf-tab-badge {
    background:var(--red2,#EA6B0A); color:#fff; font-size:10px; font-weight:800;
    min-width:16px; height:16px; border-radius:50px; display:flex; align-items:center; justify-content:center; padding:0 4px;
  }

  /* ── Card / form ── */
  .pf-card {
    background:var(--card,#071C26); border:1px solid var(--border,rgba(6,182,212,0.15));
    border-radius:18px; padding:22px; display:flex; flex-direction:column; gap:4px;
  }
  .pf-card-flush { padding:0; overflow:hidden; }
  .pf-hint { font-size:12.5px; color:var(--muted,rgba(248,245,238,0.45)); margin:0 0 12px; line-height:1.5; }
  .pf-label {
    display:flex; align-items:center; gap:6px; font-size:11px; font-weight:800;
    text-transform:uppercase; letter-spacing:0.08em; color:var(--gold,#06B6D4);
    margin:14px 0 6px;
  }
  .pf-input {
    width:100%; background:rgba(248,245,238,0.04); border:1.5px solid var(--border,rgba(6,182,212,0.15));
    border-radius:11px; padding:10px 13px; color:var(--text,#F8F5EE); font-size:13.5px;
    font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:border-color 0.18s;
  }
  .pf-input:focus { border-color:var(--gold,#06B6D4); }
  .pf-input::placeholder { color:rgba(248,245,238,0.3); }
  .pf-textarea { resize:vertical; min-height:70px; }
  .pf-field-error { font-size:11.5px; color:#f87171; margin:6px 0 0; font-weight:600; }

  .pf-save-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    margin-top:18px; background:linear-gradient(135deg,var(--gold,#06B6D4),var(--accent-hover,#0EA5E9));
    color:#04111A; border:none; border-radius:11px; padding:11px 18px;
    font-size:13px; font-weight:800; cursor:pointer; transition:all 0.18s;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .pf-save-btn:hover:not(:disabled) { filter:brightness(1.1); }
  .pf-save-btn:disabled { opacity:0.6; cursor:not-allowed; }

  /* ── Password ── */
  .pf-pw-wrap { position:relative; }
  .pf-pw-wrap .pf-input { padding-right:38px; }
  .pf-pw-toggle {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    background:none; border:none; color:var(--muted,rgba(248,245,238,0.45)); cursor:pointer;
    display:flex; align-items:center; justify-content:center; padding:2px;
  }
  .pf-pw-toggle:hover { color:var(--text,#F8F5EE); }

  /* ── Social ── */
  .pf-social-field { display:flex; align-items:flex-end; gap:12px; margin-top:6px; }
  .pf-social-field:first-of-type { margin-top:0; }
  .pf-social-icon {
    width:38px; height:38px; border-radius:11px; flex-shrink:0;
    background:rgba(248,245,238,0.05); display:flex; align-items:center; justify-content:center;
    margin-bottom:1px;
  }
  .pf-social-input-wrap { flex:1; min-width:0; }

  /* ── Notifications ── */
  .pf-notifs-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 18px; border-bottom:1px solid var(--border,rgba(6,182,212,0.15));
  }
  .pf-notifs-title { font-size:12.5px; font-weight:700; color:var(--muted,rgba(248,245,238,0.45)); margin:0; }
  .pf-mark-all-btn {
    display:flex; align-items:center; gap:5px;
    background:none; border:1px solid var(--border,rgba(6,182,212,0.15)); color:var(--gold,#06B6D4);
    font-size:11px; font-weight:700; padding:5px 10px; border-radius:8px; cursor:pointer;
  }
  .pf-mark-all-btn:hover:not(:disabled) { background:rgba(6,182,212,0.08); }
  .pf-mark-all-btn:disabled { opacity:0.5; cursor:not-allowed; }

  .pf-notifs-empty {
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
    padding:48px 24px; color:var(--muted,rgba(248,245,238,0.45)); font-size:13px;
  }

  .pf-notifs-list { display:flex; flex-direction:column; max-height:480px; overflow-y:auto; }
  .pf-notif-item {
    display:flex; align-items:flex-start; gap:10px; width:100%; text-align:left;
    background:none; border:none; border-bottom:1px solid rgba(248,245,238,0.05);
    padding:13px 18px; cursor:pointer; transition:background 0.15s;
  }
  .pf-notif-item:hover { background:rgba(248,245,238,0.03); }
  .pf-notif-unread { background:rgba(6,182,212,0.05); }
  .pf-notif-dot { width:7px; height:7px; border-radius:50%; background:var(--gold,#06B6D4); flex-shrink:0; margin-top:6px; }
  .pf-notif-body { flex:1; min-width:0; }
  .pf-notif-title-text { font-size:13px; font-weight:700; color:var(--text,#F8F5EE); margin:0 0 3px; }
  .pf-notif-msg { font-size:12.5px; color:var(--muted,rgba(248,245,238,0.45)); margin:0 0 5px; line-height:1.4; }
  .pf-notif-time { font-size:10.5px; color:rgba(248,245,238,0.3); margin:0; font-weight:600; }

  @media (max-width: 480px) {
    .pf-header { gap:14px; }
    .pf-name { font-size:21px; }
    .pf-card { padding:16px; }
  }
`;
