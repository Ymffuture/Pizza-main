// src/pages/Profile.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  User as UserIcon, Phone, MapPin, Lock, Camera, Save, Bell,
  Eye, EyeOff, CheckCheck, BellOff, Loader2, ShieldCheck, Mail,
  ArrowLeft, Link2, AtSign, Globe, KeyRound, Sparkles, Zap, ChevronRight
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
  { id: "social",        label: "Social",        Icon: Globe },
  { id: "security",      label: "Security",      Icon: KeyRound },
  { id: "notifications", label: "Notifications", Icon: Bell },
];

const SOCIAL_CONFIG = [
  { key: "facebook",  label: "Facebook",  Icon: FaFacebook,  color: "#1877F2", baseUrl: "https://facebook.com/" },
  { key: "github",    label: "GitHub",    Icon: FaGithub,    color: "#e6e6e6", baseUrl: "https://github.com/" },
  { key: "x",         label: "X",         Icon: FaXTwitter,  color: "#e6e6e6", baseUrl: "https://x.com/" },
  { key: "instagram", label: "Instagram", Icon: FaInstagram, color: "#E1306C", baseUrl: "https://instagram.com/" },
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
  const [mounted, setMounted]     = useState(false);
  const [tabAnimating, setTabAnimating] = useState(false);

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

  // Active social links for overview
  const activeSocials = useMemo(() => {
    return SOCIAL_CONFIG.filter(s => social[s.key] && social[s.key].trim().length > 0);
  }, [social]);

  /* ── Mount animation ──────────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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

  /* ── Tab switch with animation ────────────────────────────────────── */
  const handleTabSwitch = (tabId) => {
    if (tabId === activeTab) return;
    setTabAnimating(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setTabAnimating(false);
    }, 200);
  };

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
          <div className="pf-loader-ring">
            <div></div><div></div><div></div><div></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className={`pf-page ${mounted ? "pf-mounted" : ""}`}>
        <div className="pf-container">

          {/* ── Back Button ── */}
          <button className="pf-back-btn" onClick={() => window.history.back()}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            <span>Back</span>
          </button>

          {/* ── Header ── */}
          <div className="pf-header">
            <div className="pf-avatar-wrap" onClick={handleAvatarClick}>
              <div className="pf-avatar-glow">
                <Avatar picture={picture} name={fullName} email={email} size={84} />
              </div>
              <div className="pf-avatar-overlay">
                {uploadingAvatar ? (
                  <div className="pf-loader-ring-sm"><div></div><div></div><div></div><div></div></div>
                ) : (
                  <Camera style={{ width: 18, height: 18 }} />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>
            <div className="pf-header-info">
              <h1 className="pf-name">
                {fullName || "Your Profile"}
                {isProBite && (
                  <span className="pf-pro-badge">
                    <Sparkles style={{ width: 13, height: 13 }} />
                    <span>ProBite</span>
                    <RiVerifiedBadgeFill style={{ width: 13, height: 13 }} />
                  </span>
                )}
              </h1>
              <p className="pf-email">
                <Mail style={{ width: 12, height: 12 }} /> {email}
                {emailVerified ? (
                  <span className="pf-verified"><ShieldCheck style={{ width: 12, height: 12 }} /> Verified</span>
                ) : (
                  <span className="pf-unverified"><Zap style={{ width: 12, height: 12 }} /> Unverified</span>
                )}
              </p>
              {/* Social icons on overview */}
              {activeSocials.length > 0 && (
                <div className="pf-social-overview">
                  {activeSocials.map((s) => (
                    <a
                      key={s.key}
                      href={`${s.baseUrl}${social[s.key].replace(/^@/, "").replace(s.baseUrl, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pf-social-chip"
                      style={{ "--social-color": s.color }}
                      title={s.label}
                    >
                      <s.Icon style={{ width: 14, height: 14 }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="pf-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`pf-tab${activeTab === id ? " pf-tab-active" : ""}`}
                onClick={() => handleTabSwitch(id)}
              >
                <Icon style={{ width: 14, height: 14 }} />
                {label}
                {id === "notifications" && unreadCount > 0 && <span className="pf-tab-badge">{unreadCount}</span>}
              </button>
            ))}
          </div>

          {/* ── Content with transition ── */}
          <div className={`pf-content-wrap ${tabAnimating ? "pf-content-exit" : "pf-content-enter"}`}>

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
                  {savingProfile ? <div className="pf-loader-ring-sm"><div></div><div></div><div></div><div></div></div> : <Save style={{ width: 14, height: 14 }} />}
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
                  {savingSocial ? <div className="pf-loader-ring-sm"><div></div><div></div><div></div><div></div></div> : <Save style={{ width: 14, height: 14 }} />}
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
                  {savingPassword ? <div className="pf-loader-ring-sm"><div></div><div></div><div></div><div></div></div> : <Lock style={{ width: 14, height: 14 }} />}
                  {hasPassword ? "Change password" : "Set password"}
                </button>
              </form>
            )}

            {/* ── Notifications tab ── */}
            {activeTab === "notifications" && (
              <div className="pf-card pf-card-flush">
                <div className="pf-notifs-header">
                  <p className="pf-notifs-title">
                    {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
                  </p>
                  {unreadCount > 0 && (
                    <button className="pf-mark-all-btn" onClick={markAllRead} disabled={markingAll}>
                      {markingAll ? <div className="pf-loader-ring-sm"><div></div><div></div><div></div><div></div></div> : <CheckCheck style={{ width: 12, height: 12 }} />}
                      Mark all read
                    </button>
                  )}
                </div>

                {loadingNotifs ? (
                  <div className="pf-notifs-empty">
                    <div className="pf-loader-ring"><div></div><div></div><div></div><div></div></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="pf-notifs-empty">
                    <BellOff style={{ width: 26, height: 26, opacity: 0.35 }} />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="pf-notifs-list">
                    {notifications.map((n, idx) => (
                      <button
                        key={n.id}
                        className={`pf-notif-item${n.is_read ? "" : " pf-notif-unread"}`}
                        onClick={() => !n.is_read && markRead(n.id)}
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        {!n.is_read && <span className="pf-notif-dot" />}
                        <div className="pf-notif-body">
                          <p className="pf-notif-title-text">{n.title}</p>
                          <p className="pf-notif-msg">{n.message}</p>
                          <p className="pf-notif-time">{timeAgo(n.created_at)}{n.created_by_name ? ` · ${n.created_by_name}` : ""}</p>
                        </div>
                        <ChevronRight style={{ width: 14, height: 14, opacity: 0.2, flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
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
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pf-page.pf-mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .pf-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
    transform: none;
  }

  .pf-container { max-width: 640px; margin: 0 auto; }

  /* ── Back Button ── */
  .pf-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(248,245,238,0.04);
    border: 1px solid rgba(6,182,212,0.12);
    color: var(--muted, rgba(248,245,238,0.5));
    font-size: 12.5px;
    font-weight: 700;
    padding: 8px 14px;
    border-radius: 10px;
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .pf-back-btn:hover {
    background: rgba(6,182,212,0.08);
    border-color: rgba(6,182,212,0.3);
    color: var(--gold, #06B6D4);
    transform: translateX(-3px);
  }
  .pf-back-btn:active {
    transform: translateX(-1px) scale(0.97);
  }

  /* ── Header ── */
  .pf-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 28px;
    animation: pfSlideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
  }
  .pf-avatar-wrap {
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
    border-radius: 50%;
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pf-avatar-wrap:hover {
    transform: scale(1.05);
  }
  .pf-avatar-wrap:active {
    transform: scale(0.97);
  }
  .pf-avatar-glow {
    position: relative;
    border-radius: 50%;
    transition: box-shadow 0.4s ease;
  }
  .pf-avatar-wrap:hover .pf-avatar-glow {
    box-shadow: 0 0 24px rgba(6, 182, 212, 0.25), 0 0 48px rgba(6, 182, 212, 0.1);
  }
  .pf-avatar-overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0,0,0,0.55);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    backdrop-filter: blur(2px);
  }
  .pf-avatar-wrap:hover .pf-avatar-overlay {
    opacity: 1;
  }
  .pf-header-info {
    min-width: 0;
    flex: 1;
    animation: pfSlideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
  }
  .pf-name {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 1.5px;
    color: var(--text, #F8F5EE);
    margin: 0;
  }
  .pf-pro-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: linear-gradient(135deg, rgba(6,182,212,0.18), rgba(14,165,233,0.1));
    border: 1px solid rgba(6,182,212,0.35);
    color: var(--gold, #06B6D4);
    font-size: 11px;
    font-weight: 800;
    padding: 4px 11px;
    border-radius: 50px;
    letter-spacing: 0.02em;
    animation: pfGlowPulse 3s ease-in-out infinite;
  }
  @keyframes pfGlowPulse {
    0%, 100% { box-shadow: 0 0 6px rgba(6,182,212,0.15); }
    50% { box-shadow: 0 0 16px rgba(6,182,212,0.35); }
  }
  .pf-email {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 12.5px;
    color: var(--muted, rgba(248,245,238,0.45));
    margin: 8px 0 0;
  }
  .pf-verified {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #4ade80;
    font-weight: 700;
  }
  .pf-unverified {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #fbbf24;
    font-weight: 700;
  }

  /* ── Social Overview (header icons) ── */
  .pf-social-overview {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .pf-social-chip {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba(248,245,238,0.04);
    border: 1px solid rgba(248,245,238,0.08);
    color: var(--social-color, #e6e6e6);
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    text-decoration: none;
    animation: pfPopIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .pf-social-chip:nth-child(1) { animation-delay: 0.3s; }
  .pf-social-chip:nth-child(2) { animation-delay: 0.4s; }
  .pf-social-chip:nth-child(3) { animation-delay: 0.5s; }
  .pf-social-chip:nth-child(4) { animation-delay: 0.6s; }
  .pf-social-chip:hover {
    background: rgba(248,245,238,0.1);
    border-color: var(--social-color, rgba(248,245,238,0.2));
    transform: translateY(-3px) scale(1.12);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3), 0 0 12px var(--social-color, rgba(6,182,212,0.2));
  }
  .pf-social-chip:active {
    transform: translateY(-1px) scale(1.05);
  }

  /* ── Tabs ── */
  .pf-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    overflow-x: auto;
    padding-bottom: 4px;
    animation: pfSlideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
  }
  .pf-tabs::-webkit-scrollbar { height: 3px; }
  .pf-tabs::-webkit-scrollbar-track { background: transparent; }
  .pf-tabs::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.2); border-radius: 3px; }
  .pf-tab {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
    background: var(--card, #071C26);
    border: 1px solid var(--border, rgba(6,182,212,0.12));
    color: var(--muted, rgba(248,245,238,0.4));
    font-size: 12.5px;
    font-weight: 700;
    padding: 10px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }
  .pf-tab::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(6,182,212,0.1), rgba(14,165,233,0.05));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .pf-tab:hover {
    color: var(--text, #F8F5EE);
    border-color: rgba(6,182,212,0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(6,182,212,0.08);
  }
  .pf-tab:hover::before {
    opacity: 1;
  }
  .pf-tab-active {
    color: var(--gold, #06B6D4);
    border-color: rgba(6,182,212,0.5);
    background: rgba(6,182,212,0.08);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(6,182,212,0.12);
  }
  .pf-tab-active::before {
    opacity: 1;
  }
  .pf-tab-badge {
    background: var(--red2, #EA6B0A);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    min-width: 17px;
    height: 17px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    animation: pfBadgePop 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes pfBadgePop {
    0% { transform: scale(0); }
    70% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  /* ── Content transition ── */
  .pf-content-wrap {
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pf-content-enter {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  .pf-content-exit {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    filter: blur(2px);
  }

  /* ── Card / form ── */
  .pf-card {
    background: var(--card, #071C26);
    border: 1px solid var(--border, rgba(6,182,212,0.12));
    border-radius: 20px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    animation: pfSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .pf-card:hover {
    border-color: rgba(6,182,212,0.2);
    box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(6,182,212,0.05);
  }
  .pf-card-flush {
    padding: 0;
    overflow: hidden;
  }
  .pf-hint {
    font-size: 12.5px;
    color: var(--muted, rgba(248,245,238,0.45));
    margin: 0 0 14px;
    line-height: 1.5;
  }
  .pf-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--gold, #06B6D4);
    margin: 16px 0 7px;
  }
  .pf-input {
    width: 100%;
    background: rgba(248,245,238,0.04);
    border: 1.5px solid var(--border, rgba(6,182,212,0.12));
    border-radius: 12px;
    padding: 11px 14px;
    color: var(--text, #F8F5EE);
    font-size: 13.5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pf-input:hover {
    border-color: rgba(6,182,212,0.25);
    background: rgba(248,245,238,0.06);
  }
  .pf-input:focus {
    border-color: var(--gold, #06B6D4);
    background: rgba(248,245,238,0.06);
    box-shadow: 0 0 0 3px rgba(6,182,212,0.1), 0 4px 16px rgba(6,182,212,0.08);
  }
  .pf-input::placeholder {
    color: rgba(248,245,238,0.25);
  }
  .pf-textarea {
    resize: vertical;
    min-height: 80px;
  }
  .pf-field-error {
    font-size: 11.5px;
    color: #f87171;
    margin: 7px 0 0;
    font-weight: 600;
    animation: pfShake 0.4s ease;
  }
  @keyframes pfShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }

  .pf-save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
    background: linear-gradient(135deg, var(--gold, #06B6D4), var(--accent-hover, #0EA5E9));
    color: #04111A;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }
  .pf-save-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .pf-save-btn:hover:not(:disabled) {
    filter: brightness(1.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(6,182,212,0.25);
  }
  .pf-save-btn:hover:not(:disabled)::after {
    opacity: 1;
  }
  .pf-save-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
  .pf-save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Password ── */
  .pf-pw-wrap {
    position: relative;
  }
  .pf-pw-wrap .pf-input {
    padding-right: 42px;
  }
  .pf-pw-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--muted, rgba(248,245,238,0.4));
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  .pf-pw-toggle:hover {
    color: var(--text, #F8F5EE);
    background: rgba(248,245,238,0.06);
  }

  /* ── Social ── */
  .pf-social-field {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    margin-top: 8px;
    animation: pfSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .pf-social-field:nth-of-type(1) { animation-delay: 0.1s; }
  .pf-social-field:nth-of-type(2) { animation-delay: 0.2s; }
  .pf-social-field:nth-of-type(3) { animation-delay: 0.3s; }
  .pf-social-field:nth-of-type(4) { animation-delay: 0.4s; }
  .pf-social-field:first-of-type {
    margin-top: 0;
  }
  .pf-social-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    flex-shrink: 0;
    background: rgba(248,245,238,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1px;
    transition: all 0.25s ease;
  }
  .pf-social-field:hover .pf-social-icon {
    background: rgba(248,245,238,0.1);
    transform: scale(1.08);
  }
  .pf-social-input-wrap {
    flex: 1;
    min-width: 0;
  }

  /* ── Notifications ── */
  .pf-notifs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border, rgba(6,182,212,0.12));
  }
  .pf-notifs-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted, rgba(248,245,238,0.5));
    margin: 0;
  }
  .pf-mark-all-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 1px solid var(--border, rgba(6,182,212,0.15));
    color: var(--gold, #06B6D4);
    font-size: 11.5px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 9px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .pf-mark-all-btn:hover:not(:disabled) {
    background: rgba(6,182,212,0.1);
    border-color: rgba(6,182,212,0.35);
    transform: translateY(-1px);
  }
  .pf-mark-all-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.97);
  }
  .pf-mark-all-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pf-notifs-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 56px 24px;
    color: var(--muted, rgba(248,245,238,0.4));
    font-size: 13px;
    animation: pfFadeIn 0.5s ease;
  }

  .pf-notifs-list {
    display: flex;
    flex-direction: column;
    max-height: 480px;
    overflow-y: auto;
  }
  .pf-notifs-list::-webkit-scrollbar { width: 4px; }
  .pf-notifs-list::-webkit-scrollbar-track { background: transparent; }
  .pf-notifs-list::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.15); border-radius: 4px; }
  .pf-notif-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(248,245,238,0.04);
    padding: 14px 20px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    animation: pfSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .pf-notif-item:hover {
    background: rgba(248,245,238,0.04);
    padding-left: 24px;
  }
  .pf-notif-unread {
    background: rgba(6,182,212,0.04);
  }
  .pf-notif-unread:hover {
    background: rgba(6,182,212,0.07);
  }
  .pf-notif-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold, #06B6D4);
    flex-shrink: 0;
    margin-top: 7px;
    animation: pfPulse 2s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(6,182,212,0.4);
  }
  @keyframes pfPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }
  .pf-notif-body {
    flex: 1;
    min-width: 0;
  }
  .pf-notif-title-text {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text, #F8F5EE);
    margin: 0 0 4px;
  }
  .pf-notif-msg {
    font-size: 12.5px;
    color: var(--muted, rgba(248,245,238,0.45));
    margin: 0 0 6px;
    line-height: 1.4;
  }
  .pf-notif-time {
    font-size: 10.5px;
    color: rgba(248,245,238,0.3);
    margin: 0;
    font-weight: 600;
  }

  /* ── Spinners ── */
  .pf-loader-ring {
    display: inline-block;
    position: relative;
    width: 32px;
    height: 32px;
  }
  .pf-loader-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 26px;
    height: 26px;
    margin: 3px;
    border: 2.5px solid var(--gold, #06B6D4);
    border-radius: 50%;
    animation: pfLoaderRing 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: var(--gold, #06B6D4) transparent transparent transparent;
  }
  .pf-loader-ring div:nth-child(1) { animation-delay: -0.45s; }
  .pf-loader-ring div:nth-child(2) { animation-delay: -0.3s; }
  .pf-loader-ring div:nth-child(3) { animation-delay: -0.15s; }
  .pf-loader-ring-sm {
    display: inline-block;
    position: relative;
    width: 16px;
    height: 16px;
  }
  .pf-loader-ring-sm div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 13px;
    height: 13px;
    margin: 1.5px;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    animation: pfLoaderRing 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: currentColor transparent transparent transparent;
  }
  .pf-loader-ring-sm div:nth-child(1) { animation-delay: -0.45s; }
  .pf-loader-ring-sm div:nth-child(2) { animation-delay: -0.3s; }
  .pf-loader-ring-sm div:nth-child(3) { animation-delay: -0.15s; }
  @keyframes pfLoaderRing {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* ── Keyframes ── */
  @keyframes pfSlideUp {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes pfFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes pfPopIn {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 480px) {
    .pf-header { gap: 14px; }
    .pf-name { font-size: 22px; }
    .pf-card { padding: 18px; }
    .pf-back-btn { margin-bottom: 16px; }
    .pf-tabs { gap: 6px; }
    .pf-tab { padding: 8px 12px; font-size: 12px; }
  }
`;
