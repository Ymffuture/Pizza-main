// src/pages/Profile.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User as UserIcon, Phone, MapPin, Lock, Camera, Save, Bell,
  Eye, EyeOff, CheckCheck, BellOff, ShieldCheck, Mail, LayoutGrid,
  AlertTriangle, RefreshCw, Wallet as WalletIcon, Package, Zap, ChevronRight,
  ExternalLink, Pencil,ArrowLeft, X, Copy, Check, Gift, Users,
} from "lucide-react";
import { FaFacebook, FaGithub, FaXTwitter, FaInstagram, FaCircleNotch } from "react-icons/fa6";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import axiosClient from "../api/axiosClient";
import { getMyOrders } from "../api/orders.api";
import { getMenu } from "../api/menu.api";
import { getWallet } from "../api/rewards.api";
import { useAuth } from "../context/AuthContext";
import { useBilling } from "../context/BillingContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import Avatar from "../components/Avatar";
import NotificationBell from "../components/NotificationBell";

const TABS = [
  { id: "overview",      label: "Overview",      Icon: LayoutGrid },
  { id: "profile",       label: "Profile",       Icon: UserIcon },
  { id: "social",        label: "Social",        Icon: FaFacebook },
  { id: "security",      label: "Security",      Icon: Lock },
  { id: "notifications", label: "Notifications", Icon: Bell },
];

const STATUS_STYLE = {
  active:     { color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.3)",  label: "Active" },
  warned:     { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  label: "Warned" },
  restricted: { color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.3)",  label: "Restricted" },
  suspended:  { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", label: "Suspended" },
  banned:     { color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)", label: "Banned" },
};

const ORDER_STATUS_COLOR = {
  pending:   "#fbbf24", paid: "#06B6D4", preparing: "#06B6D4", ready: "#06B6D4",
  out_for_delivery: "#0EA5E9", delivered: "#4ade80", cancelled: "#f87171", refunded: "#f87171",
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

function formatCurrency(n) {
  return `R${Number(n || 0).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function isValidUrl(value) {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function extractHandle(url) {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || u.hostname;
  } catch {
    return url;
  }
}

const SOCIAL_META = {
  facebook:  { Icon: FaFacebook,  color: "#1877F2", label: "Facebook" },
  github:    { Icon: FaGithub,    color: "#E6E6E6", label: "GitHub" },
  x:         { Icon: FaXTwitter,  color: "#E6E6E6", label: "X (Twitter)" },
  instagram: { Icon: FaInstagram, color: "#E1306C", label: "Instagram" },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const billing = useBilling();
  const { isProBite, credits, expiresAt, cancelAtPeriodEnd } = billing;
  const { addItem } = useCart();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [reorderingId, setReorderingId] = useState(null); // order id currently being reordered

  // ── Core profile (name/phone/address/social/etc.) — drives the whole
  //    page's "loaded" state, but every OTHER section (orders, wallet,
  //    notifications) loads independently so one failing call never blocks
  //    the rest of the page from showing. ─────────────────────────────────
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError]     = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [address, setAddress]   = useState("");
  const [email, setEmail]       = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [accountStatus, setAccountStatus] = useState(null); // { status, reason, warning_count, affected_features }

  // ── Avatar ───────────────────────────────────────────────────────────
  const [picture, setPicture]         = useState(null);
  const [uploadingAvatar, setUploading] = useState(false);

  // ── Social links ─────────────────────────────────────────────────────
  const [social, setSocial] = useState({ facebook: "", github: "", x: "", instagram: "" });
  const [editingSocial, setEditingSocial] = useState({});
  const [savingSocialField, setSavingSocialField] = useState(null); // platform currently saving, or null

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
  const [notifsError, setNotifsError]         = useState("");
  const [markingAll, setMarkingAll]           = useState(false);

  // ── Orders (Overview tab) ────────────────────────────────────────────
  const [orders, setOrders]           = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError]     = useState("");

  // ── KotaPoints wallet (Overview tab) ─────────────────────────────────
  const [wallet, setWallet]           = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError]     = useState("");

  // ── Referrals (Overview tab, retention feature) ──────────────────────
  const [referral, setReferral]           = useState(null);
  const [referralLoading, setReferralLoading] = useState(true);
  const [referralError, setReferralError]     = useState("");
  const [copiedReferral, setCopiedReferral]   = useState(false);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  /* ── Load core profile — independent of every other section below ──── */
  const loadMe = useCallback(async () => {
    setMeLoading(true);
    setMeError("");
    try {
      const { data } = await axiosClient.get("/users/me");
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
      setAccountStatus({
        status: data.status || "active",
        reason: data.reason || null,
        warning_count: data.warning_count || 0,
        affected_features: data.affected_features || [],
      });
    } catch (err) {
      // Fall back to whatever AuthContext already has cached, so the page
      // isn't completely blank just because this one call failed —
      // and surface exactly what went wrong instead of spinning forever.
      if (user) {
        setFullName(user.full_name || "");
        setEmail(user.email || "");
        setPicture(user.picture || null);
      }
      setMeError(err?.response?.data?.detail || err.message || "Couldn't load your profile.");
    } finally {
      setMeLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  /* ── Load notifications ───────────────────────────────────────────── */
  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    setNotifsError("");
    try {
      const { data } = await axiosClient.get("/notifications/my");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotifsError(err?.response?.data?.detail || err.message || "Couldn't load notifications.");
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  /* ── Load recent orders ───────────────────────────────────────────── */
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const { data } = await getMyOrders();
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(list);
    } catch (err) {
      setOrdersError(err?.response?.data?.detail || err.message || "Couldn't load your orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  /* ── Reorder (engagement) — re-adds a past order's items to the cart,
       validated against the CURRENT menu so stale prices/removed items
       never sneak through. ─────────────────────────────────────────── */
  const handleReorder = async (order) => {
    setReorderingId(order.id);
    try {
      const { data: menuItems } = await getMenu();
      const menuById = new Map((menuItems || []).map((m) => [m.id || m._id, m]));

      let added = 0;
      let unavailable = 0;

      for (const item of order.items || []) {
        const current = menuById.get(item.menu_item_id);
        if (!current || current.is_available === false) {
          unavailable++;
          continue;
        }
        for (let i = 0; i < (item.quantity || 1); i++) {
          addItem({ id: current.id || current._id, name: current.name, price: current.price, image_url: current.image_url });
        }
        added++;
      }

      if (added === 0) {
        toast.show({ type: "error", title: "Can't reorder", message: "None of these items are available anymore." });
        return;
      }

      toast.show({
        type: "success",
        title: `${added} item${added === 1 ? "" : "s"} added to cart`,
        message: unavailable ? `${unavailable} item${unavailable === 1 ? " is" : "s are"} no longer available and was skipped.` : undefined,
      });
      navigate("/checkout");
    } catch (err) {
      toast.show({ type: "error", title: "Couldn't reorder", message: err?.response?.data?.detail || err.message });
    } finally {
      setReorderingId(null);
    }
  };

  /* ── Load KotaPoints wallet ────────────────────────────────────────── */
  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError("");
    try {
      const { data } = await getWallet();
      setWallet(data);
    } catch (err) {
      setWalletError(err?.response?.data?.detail || err.message || "Couldn't load KotaPoints.");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  /* ── Load referral stats ──────────────────────────────────────────── */
  const loadReferral = useCallback(async () => {
    setReferralLoading(true);
    setReferralError("");
    try {
      const { data } = await axiosClient.get("/referrals/me");
      setReferral(data);
    } catch (err) {
      setReferralError(err?.response?.data?.detail || err.message || "Couldn't load your referral info.");
    } finally {
      setReferralLoading(false);
    }
  }, []);

  useEffect(() => { loadReferral(); }, [loadReferral]);

  const referralLink = referral?.referral_code
    ? `${window.location.origin}/register?ref=${referral.referral_code}`
    : "";

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      toast.show({ type: "success", title: "Referral link copied" });
      setTimeout(() => setCopiedReferral(false), 2000);
    } catch {
      toast.show({ type: "error", title: "Couldn't copy", message: "Copy the link manually instead." });
    }
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
      toast.show({ type: "error", title: "Couldn't save", message: typeof detail === "string" ? detail : "Please check your details and try again." });
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Save one social link at a time (inline chip editor) ────────────── */
  const handleSaveSocialField = async (platform, value) => {
    setSavingSocialField(platform);
    try {
      const { data } = await axiosClient.patch("/users/me", { social_links: { [platform]: value } });
      setSocial((prev) => ({ ...prev, [platform]: data.social_links?.[platform] || "" }));
      setEditingSocial((prev) => ({ ...prev, [platform]: false }));
      toast.show({ type: "success", title: value ? `${SOCIAL_META[platform].label} connected` : `${SOCIAL_META[platform].label} removed` });
    } catch (err) {
      toast.show({ type: "error", title: "Couldn't save link", message: err?.response?.data?.detail || err.message });
    } finally {
      setSavingSocialField(null);
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

  const statusInfo = STATUS_STYLE[accountStatus?.status] || STATUS_STYLE.active;

  return (
    <>
      <style>{css}</style>
      <div className="pf-page">
        <button className="pf-back-btn" onClick={() => window.history.back()}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            <span>Back</span>
          </button>
        <div className="pf-container">
          <NotificationBell />
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
                {meLoading ? "Loading…" : (fullName || "Your Profile")}
                {isProBite && (
                  <span className="pf-pro-badge">
                    <RiVerifiedBadgeFill style={{ width: 14, height: 14 }} /> ProBite
                  </span>
                )}
              </h1>
              <p className="pf-email">
                <Mail style={{ width: 12, height: 12 }} /> {email || "—"}
                {emailVerified ? (
                  <span className="pf-verified"><ShieldCheck style={{ width: 12, height: 12 }} /> Verified</span>
                ) : email ? (
                  <span className="pf-unverified">Unverified</span>
                ) : null}
              </p>
            </div>
            <div className="pf-header-bell">
              
            </div>
          </div>

          {meError && (
            <div className="pf-error-banner">
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>{meError}</span>
              <button onClick={loadMe} className="pf-retry-btn"><RefreshCw style={{ width: 12, height: 12 }} /> Retry</button>
            </div>
          )}

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

          {/* ── Overview tab — everything the user has, at a glance ── */}
          {activeTab === "overview" && (
            <div className="pf-overview">

              {/* Account status */}
              <div className="pf-status-card" style={{ background: statusInfo.bg, borderColor: statusInfo.border }}>
                <div className="pf-status-dot" style={{ background: statusInfo.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="pf-status-label" style={{ color: statusInfo.color }}>Account: {statusInfo.label}</p>
                  {accountStatus?.reason && <p className="pf-status-reason">{accountStatus.reason}</p>}
                  {accountStatus?.warning_count > 0 && (
                    <p className="pf-status-reason">{accountStatus.warning_count} warning{accountStatus.warning_count > 1 ? "s" : ""} on record</p>
                  )}
                </div>
                {accountStatus?.status !== "active" && (
                  <Link to="/appeal" className="pf-appeal-link">Appeal <ChevronRight style={{ width: 12, height: 12 }} /></Link>
                )}
              </div>

              {/* Stat cards */}
              <div className="pf-stats-grid">
                <div className="pf-stat-card">
                  <div className="pf-stat-icon" style={{ color: isProBite ? "#06B6D4" : "var(--muted)" }}>
                    <RiVerifiedBadgeFill style={{ width: 18, height: 18 }} />
                  </div>
                  <p className="pf-stat-label">Plan</p>
                  <p className="pf-stat-value">{isProBite ? "ProBite 🔥" : "Free"}</p>
                  {isProBite && expiresAt && (
                    <p className="pf-stat-sub">{cancelAtPeriodEnd ? "Ends" : "Renews"} {formatDate(expiresAt)}</p>
                  )}
                  {!isProBite && <Link to="/pricing" className="pf-stat-link">Upgrade →</Link>}
                </div>

                <div className="pf-stat-card">
                  <div className="pf-stat-icon"><Zap style={{ width: 18, height: 18 }} /></div>
                  <p className="pf-stat-label">KotaBot Credits</p>
                  <p className="pf-stat-value">
                    {credits?.unlimited ? "Unlimited" : `${credits?.credits ?? "—"}/${credits?.creditsCap ?? "—"}`}
                  </p>
                  {!credits?.unlimited && credits?.resetsAt && (
                    <p className="pf-stat-sub">Refills {formatDate(credits.resetsAt)}</p>
                  )}
                </div>

                <div className="pf-stat-card">
                  <div className="pf-stat-icon"><WalletIcon style={{ width: 18, height: 18 }} /></div>
                  <p className="pf-stat-label">KotaPoints</p>
                  {walletLoading ? (
                    <p className="pf-stat-value pf-stat-loading"><FaCircleNotch className="pf-spin" style={{ width: 14, height: 14 }} /></p>
                  ) : walletError ? (
                    <button className="pf-stat-retry" onClick={loadWallet}>Retry</button>
                  ) : (
                    <>
                      <p className="pf-stat-value">{wallet?.available_points ?? 0} pts</p>
                      <p className="pf-stat-sub">{wallet?.tier?.icon} {wallet?.tier?.name || "Bronze"} tier</p>
                    </>
                  )}
                  <Link to="/rewards" className="pf-stat-link">View rewards →</Link>
                </div>

                <div className="pf-stat-card">
                  <div className="pf-stat-icon"><Package style={{ width: 18, height: 18 }} /></div>
                  <p className="pf-stat-label">Total Orders</p>
                  {ordersLoading ? (
                    <p className="pf-stat-value pf-stat-loading"><FaCircleNotch className="pf-spin" style={{ width: 14, height: 14 }} /></p>
                  ) : ordersError ? (
                    <button className="pf-stat-retry" onClick={loadOrders}>Retry</button>
                  ) : (
                    <p className="pf-stat-value">{orders.length}</p>
                  )}
                </div>
              </div>

              {/* Connected social accounts */}
              <div className="pf-card pf-connected-card">
                <div className="pf-connected-header">
                  <p className="pf-notifs-title" style={{ margin: 0 }}>Connected accounts</p>
                  <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab("social"); }} className="pf-stat-link" style={{ marginTop: 0 }}>
                    Manage →
                  </Link>
                </div>
                {Object.keys(SOCIAL_META).filter((p) => isValidUrl(social[p])).length === 0 ? (
                  <p className="pf-hint" style={{ margin: "8px 0 0" }}>No social accounts linked yet.</p>
                ) : (
                  <div className="pf-connected-icons">
                    {Object.keys(SOCIAL_META).filter((p) => isValidUrl(social[p])).map((platform) => {
                      const { Icon, color, label } = SOCIAL_META[platform];
                      return (
                        <a
                          key={platform}
                          href={social[platform]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pf-connected-icon-btn"
                          title={`${label}: @${extractHandle(social[platform])}`}
                          style={{ color }}
                        >
                          <Icon style={{ width: 20, height: 20 }} />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Refer friends (retention) */}
              <div className="pf-card pf-referral-card">
                <div className="pf-connected-header">
                  <p className="pf-notifs-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <Gift style={{ width: 14, height: 14 }} /> Refer friends, earn KotaPoints
                  </p>
                </div>

                {referralLoading ? (
                  <p className="pf-hint" style={{ margin: "10px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                    <FaCircleNotch className="pf-spin" style={{ width: 13, height: 13 }} /> Loading…
                  </p>
                ) : referralError ? (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <p className="pf-hint" style={{ margin: 0 }}>{referralError}</p>
                    <button className="pf-mark-all-btn" onClick={loadReferral}><RefreshCw style={{ width: 12, height: 12 }} /> Retry</button>
                  </div>
                ) : (
                  <>
                    <p className="pf-hint" style={{ margin: "6px 0 12px" }}>
                      Share your link — you and your friend both get {referral?.bonus_per_referral ?? 50} KotaPoints once their first order is delivered.
                    </p>
                    <div className="pf-referral-link-row">
                      <input className="pf-input" readOnly value={referralLink} onFocus={(e) => e.target.select()} />
                      <button className="pf-chip-save-btn" onClick={copyReferralLink} title="Copy link">
                        {copiedReferral ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                      </button>
                    </div>
                    <div className="pf-referral-stats">
                      <div className="pf-referral-stat">
                        <Users style={{ width: 13, height: 13 }} />
                        <span>{referral?.total_referred ?? 0} referred</span>
                      </div>
                      <div className="pf-referral-stat">
                        <CheckCheck style={{ width: 13, height: 13 }} />
                        <span>{referral?.total_converted ?? 0} converted</span>
                      </div>
                      <div className="pf-referral-stat">
                        <Zap style={{ width: 13, height: 13 }} />
                        <span>{referral?.bonus_points_earned ?? 0} pts earned</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Recent orders */}
              <div className="pf-card pf-card-flush">
                <div className="pf-notifs-header">
                  <p className="pf-notifs-title">Recent orders</p>
                </div>
                {ordersLoading ? (
                  <div className="pf-notifs-empty"><FaCircleNotch className="pf-spin" style={{ width: 20, height: 20 }} /></div>
                ) : ordersError ? (
                  <div className="pf-notifs-empty">
                    <AlertTriangle style={{ width: 22, height: 22, opacity: 0.4 }} />
                    <p>{ordersError}</p>
                    <button className="pf-mark-all-btn" onClick={loadOrders}><RefreshCw style={{ width: 12, height: 12 }} /> Retry</button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="pf-notifs-empty">
                    <Package style={{ width: 26, height: 26, opacity: 0.35 }} />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="pf-notifs-list">
                    {orders.slice(0, 6).map((o) => (
                      <Link key={o.id} to={`/order/${o.id}`} className="pf-order-item">
                        <div className="pf-order-dot" style={{ background: ORDER_STATUS_COLOR[o.status] || "var(--muted)" }} />
                        <div className="pf-notif-body">
                          <p className="pf-notif-title-text">Order #{o.id?.slice(-8).toUpperCase()} — {formatCurrency(o.total_amount)}</p>
                          <p className="pf-notif-msg">{o.items?.length || 0} item{o.items?.length === 1 ? "" : "s"} · {o.payment_method}</p>
                          <p className="pf-notif-time">{o.status.replace(/_/g, " ")} · {timeAgo(o.created_at)}</p>
                        </div>
                        {o.status === "delivered" && (
                          <button
                            className="pf-reorder-btn"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReorder(o); }}
                            disabled={reorderingId === o.id}
                            title="Reorder"
                          >
                            {reorderingId === o.id ? <FaCircleNotch className="pf-spin" style={{ width: 12, height: 12 }} /> : "Reorder"}
                          </button>
                        )}
                        <ChevronRight style={{ width: 14, height: 14, opacity: 0.4, flexShrink: 0 }} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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

              <button type="submit" className="pf-save-btn" disabled={savingProfile || meLoading}>
                {savingProfile ? <FaCircleNotch className="pf-spin" style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
                Save changes
              </button>
            </form>
          )}

          {/* ── Social tab ── */}
          {activeTab === "social" && (
            <div className="pf-card">
              <p className="pf-hint">Add your handle or a full profile URL — we'll fill in the rest. Connected accounts show up as icons on your Overview tab.</p>

              {Object.keys(SOCIAL_META).map((platform) => (
                <SocialField
                  key={platform}
                  platform={platform}
                  value={social[platform]}
                  editing={!!editingSocial[platform] || !isValidUrl(social[platform])}
                  saving={savingSocialField === platform}
                  onEdit={() => setEditingSocial((s) => ({ ...s, [platform]: true }))}
                  onCancel={() => setEditingSocial((s) => ({ ...s, [platform]: false }))}
                  onSave={(value) => handleSaveSocialField(platform, value)}
                  onRemove={() => handleSaveSocialField(platform, "")}
                />
              ))}
            </div>
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
              ) : notifsError ? (
                <div className="pf-notifs-empty">
                  <AlertTriangle style={{ width: 22, height: 22, opacity: 0.4 }} />
                  <p>{notifsError}</p>
                  <button className="pf-mark-all-btn" onClick={loadNotifications}><RefreshCw style={{ width: 12, height: 12 }} /> Retry</button>
                </div>
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

function SocialField({ platform, value, editing, saving, onEdit, onCancel, onSave, onRemove }) {
  const { Icon, color, label } = SOCIAL_META[platform];
  const [draft, setDraft] = useState(value || "");

  useEffect(() => { setDraft(value || ""); }, [value, editing]);

  const connected = isValidUrl(value) && !editing;

  if (connected) {
    return (
      <div className="pf-social-chip">
        <div className="pf-social-icon" style={{ color }}>
          <Icon style={{ width: 18, height: 18 }} />
        </div>
        <div className="pf-social-chip-text">
          <p className="pf-social-chip-label">{label}</p>
          <p className="pf-social-chip-handle">@{extractHandle(value)}</p>
        </div>
        <a href={value} target="_blank" rel="noopener noreferrer" className="pf-icon-btn" title="Open profile">
          <ExternalLink style={{ width: 14, height: 14 }} />
        </a>
        <button className="pf-icon-btn" onClick={onEdit} title="Edit">
          <Pencil style={{ width: 14, height: 14 }} />
        </button>
        <button className="pf-icon-btn pf-icon-btn-danger" onClick={onRemove} title="Remove">
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    );
  }

  return (
    <div className="pf-social-field">
      <div className="pf-social-icon" style={{ color }}>
        <Icon style={{ width: 18, height: 18 }} />
      </div>
      <div className="pf-social-input-wrap">
        <label className="pf-label" style={{ marginBottom: 4 }}>{label}</label>
        <div className="pf-social-input-row">
          <input
            className="pf-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="username or full URL"
            onKeyDown={(e) => e.key === "Enter" && onSave(draft.trim())}
          />
          <button className="pf-chip-save-btn" disabled={saving} onClick={() => onSave(draft.trim())}>
            {saving ? <FaCircleNotch className="pf-spin" style={{ width: 13, height: 13 }} /> : <Save style={{ width: 13, height: 13 }} />}
          </button>
          {isValidUrl(value) && (
            <button className="pf-chip-cancel-btn" onClick={onCancel} title="Cancel">
              <X style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .pf-page {
    min-height: 100vh;
    background: var(--background, #04111A);
    font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif;
    padding: 40px 16px 80px;
    -webkit-font-smoothing: antialiased;
  }
  .pf-spin { animation: pfSpin 0.8s linear infinite; }
  @keyframes pfSpin { to { transform: rotate(360deg); } }

  .pf-container { max-width: 680px; margin: 0 auto; }

  /* ── Header ── */
  .pf-header { display:flex; align-items:center; gap:16px; margin-bottom:20px; }
  .pf-avatar-wrap { position:relative; cursor:pointer; flex-shrink:0; border-radius:50%; }
  .pf-avatar-overlay {
    position:absolute; inset:0; border-radius:50%;
    background:rgba(0,0,0,0.5); color:#fff;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity 0.15s;
  }
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
  
  .pf-avatar-wrap:hover .pf-avatar-overlay { opacity:1; }
  .pf-header-info { min-width:0; flex:1; }
  .pf-header-bell { flex-shrink:0; }
  .pf-name {
    display:flex; align-items:center; gap:9px; flex-wrap:wrap;
    font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:20px; letter-spacing:-0.01em;
    color:var(--text,#F8F5EE); margin:0;
  }
  .pf-pro-badge {
    display:inline-flex; align-items:center; gap:4px;
    background:rgba(6,182,212,0.12); border:1px solid rgba(6,182,212,0.25);
    color:var(--gold,#06B6D4); font-size:10.5px; font-weight:700;
    padding:3px 8px; border-radius:50px; letter-spacing:0.01em;
  }
  .pf-email {
    display:flex; align-items:center; gap:6px; flex-wrap:wrap;
    font-size:12.5px; color:var(--muted,rgba(248,245,238,0.4)); margin:5px 0 0;
  }
  .pf-verified { display:flex; align-items:center; gap:3px; color:#4ade80; font-weight:600; }
  .pf-unverified { color:#fbbf24; font-weight:600; }

  /* ── Error banner ── */
  .pf-error-banner {
    display:flex; align-items:center; gap:8px;
    background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2);
    color:#f87171; font-size:12.5px; font-weight:500;
    padding:11px 14px; border-radius:12px; margin-bottom:16px;
  }
  .pf-retry-btn {
    display:flex; align-items:center; gap:4px; margin-left:auto; flex-shrink:0;
    background:rgba(248,113,113,0.12); border:none; color:#f87171;
    font-size:11px; font-weight:700; padding:6px 11px; border-radius:8px; cursor:pointer;
  }
  .pf-retry-btn:hover { background:rgba(248,113,113,0.2); }

  /* ── Tabs — single segmented pill, Claude.ai-style ── */
  .pf-tabs {
    display:flex; gap:2px; margin-bottom:20px; overflow-x:auto;
    background:rgba(248,245,238,0.035); border:1px solid rgba(248,245,238,0.06);
    border-radius:14px; padding:4px;
  }
  .pf-tab {
    display:flex; align-items:center; gap:6px; flex-shrink:0;
    background:transparent; border:none;
    color:var(--muted,rgba(248,245,238,0.42)); font-size:12.5px; font-weight:600;
    padding:8px 13px; border-radius:10px; cursor:pointer; transition:all 0.15s;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .pf-tab:hover { color:var(--text,#F8F5EE); }
  .pf-tab-active {
    color:var(--text,#F8F5EE);
    background:rgba(248,245,238,0.07);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .pf-tab-badge {
    background:var(--red2,#EA6B0A); color:#fff; font-size:9.5px; font-weight:800;
    min-width:16px; height:16px; border-radius:50px; display:flex; align-items:center; justify-content:center; padding:0 4px;
  }

  /* ── Overview ── */
  .pf-overview { display:flex; flex-direction:column; gap:14px; }
  .pf-status-card {
    display:flex; align-items:flex-start; gap:10px;
    border:1px solid; border-radius:16px; padding:14px 16px;
  }
  .pf-status-dot { width:8px; height:8px; border-radius:50%; margin-top:5px; flex-shrink:0; }
  .pf-status-label { font-size:13px; font-weight:700; margin:0; }
  .pf-status-reason { font-size:12px; color:var(--muted,rgba(248,245,238,0.55)); margin:4px 0 0; line-height:1.4; }
  .pf-appeal-link {
    display:flex; align-items:center; gap:2px; flex-shrink:0;
    color:var(--text,#F8F5EE); font-size:11.5px; font-weight:600; text-decoration:none;
    background:rgba(248,245,238,0.07); padding:6px 10px; border-radius:9px;
  }

  .pf-stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
  .pf-stat-card {
    background:var(--card,#071C26); border:1px solid rgba(248,245,238,0.06);
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
    border-radius:16px; padding:15px 16px; display:flex; flex-direction:column; gap:2px;
  }
  .pf-stat-icon { color:var(--gold,#06B6D4); margin-bottom:6px; opacity:0.85; }
  .pf-stat-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted,rgba(248,245,238,0.4)); margin:0; }
  .pf-stat-value { font-size:17px; font-weight:800; color:var(--text,#F8F5EE); margin:3px 0 0; font-family:'Plus Jakarta Sans',sans-serif; letter-spacing:-0.01em; }
  .pf-stat-loading { display:flex; }
  .pf-stat-sub { font-size:11px; color:var(--muted,rgba(248,245,238,0.35)); margin:2px 0 0; }
  .pf-stat-link { font-size:11px; font-weight:600; color:var(--gold,#06B6D4); text-decoration:none; margin-top:7px; }
  .pf-stat-link:hover { text-decoration:underline; }
  .pf-stat-retry {
    background:none; border:none; color:#f87171; font-size:12px; font-weight:600; cursor:pointer; padding:0; text-align:left;
  }

  /* ── Connected accounts ── */
  .pf-connected-card { padding:16px; }
  .pf-referral-card { padding:16px; }
  .pf-referral-link-row { display:flex; gap:6px; }
  .pf-referral-link-row .pf-input { flex:1; min-width:0; font-size:12px; color:var(--muted,rgba(248,245,238,0.6)); cursor:text; }
  .pf-referral-stats { display:flex; gap:14px; margin-top:12px; flex-wrap:wrap; }
  .pf-referral-stat {
    display:flex; align-items:center; gap:5px;
    font-size:11.5px; font-weight:600; color:var(--muted,rgba(248,245,238,0.5));
  }
  .pf-referral-stat svg { color:var(--gold,#06B6D4); opacity:0.8; }
  .pf-connected-header { display:flex; align-items:center; justify-content:space-between; }
  .pf-connected-icons { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .pf-connected-icon-btn {
    width:38px; height:38px; border-radius:11px;
    background:rgba(248,245,238,0.05); border:1px solid rgba(248,245,238,0.07);
    display:flex; align-items:center; justify-content:center;
    text-decoration:none; transition:all 0.15s;
  }
  .pf-connected-icon-btn:hover { background:rgba(248,245,238,0.09); transform:translateY(-1px); }

  .pf-order-item {
    display:flex; align-items:flex-start; gap:10px; width:100%; text-align:left;
    background:none; border:none; border-bottom:1px solid rgba(248,245,238,0.045);
    padding:13px 18px; cursor:pointer; transition:background 0.15s; text-decoration:none;
  }
  .pf-order-item:last-child { border-bottom:none; }
  .pf-order-item:hover { background:rgba(248,245,238,0.025); }
  .pf-order-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; margin-top:6px; }
  .pf-reorder-btn {
    flex-shrink:0; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.25);
    color:var(--gold,#06B6D4); font-size:11px; font-weight:700; padding:6px 12px;
    border-radius:50px; cursor:pointer; white-space:nowrap; align-self:center;
  }
  .pf-reorder-btn:hover:not(:disabled) { background:rgba(6,182,212,0.18); }
  .pf-reorder-btn:disabled { opacity:0.6; cursor:not-allowed; }

  /* ── Card / form ── */
  .pf-card {
    background:var(--card,#071C26); border:1px solid rgba(248,245,238,0.06);
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    border-radius:18px; padding:20px; display:flex; flex-direction:column; gap:4px;
  }
  .pf-card-flush { padding:0; overflow:hidden; }
  .pf-hint { font-size:12.5px; color:var(--muted,rgba(248,245,238,0.4)); margin:0 0 14px; line-height:1.5; }
  .pf-label {
    display:flex; align-items:center; gap:6px; font-size:10.5px; font-weight:700;
    text-transform:uppercase; letter-spacing:0.06em; color:var(--muted,rgba(248,245,238,0.5));
    margin:14px 0 6px;
  }
  .pf-input {
    width:100%; background:rgba(248,245,238,0.035); border:1px solid rgba(248,245,238,0.08);
    border-radius:11px; padding:10px 13px; color:var(--text,#F8F5EE); font-size:13.5px;
    font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:border-color 0.15s, background 0.15s;
  }
  .pf-input:focus { border-color:rgba(6,182,212,0.5); background:rgba(248,245,238,0.05); }
  .pf-input::placeholder { color:rgba(248,245,238,0.25); }
  .pf-textarea { resize:vertical; min-height:70px; }
  .pf-field-error { font-size:11.5px; color:#f87171; margin:6px 0 0; font-weight:500; }

  .pf-save-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    margin-top:18px; background:var(--text,#F8F5EE);
    color:#04111A; border:none; border-radius:50px; padding:10px 20px;
    font-size:13px; font-weight:700; cursor:pointer; transition:all 0.15s;
    font-family:'Plus Jakarta Sans',sans-serif; align-self:flex-start;
  }
  .pf-save-btn:hover:not(:disabled) { filter:brightness(0.92); }
  .pf-save-btn:disabled { opacity:0.5; cursor:not-allowed; }

  /* ── Password ── */
  .pf-pw-wrap { position:relative; }
  .pf-pw-wrap .pf-input { padding-right:38px; }
  .pf-pw-toggle {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    background:none; border:none; color:var(--muted,rgba(248,245,238,0.4)); cursor:pointer;
    display:flex; align-items:center; justify-content:center; padding:2px;
  }
  .pf-pw-toggle:hover { color:var(--text,#F8F5EE); }

  /* ── Social — inline editor + connected chip ── */
  .pf-social-field { display:flex; align-items:flex-end; gap:12px; margin-top:14px; }
  .pf-social-field:first-of-type { margin-top:0; }
  .pf-social-icon {
    width:38px; height:38px; border-radius:11px; flex-shrink:0;
    background:rgba(248,245,238,0.045); display:flex; align-items:center; justify-content:center;
    margin-bottom:1px;
  }
  .pf-social-input-wrap { flex:1; min-width:0; }
  .pf-social-input-row { display:flex; gap:6px; }
  .pf-social-input-row .pf-input { flex:1; min-width:0; }
  .pf-chip-save-btn, .pf-chip-cancel-btn {
    width:38px; height:38px; flex-shrink:0; border-radius:11px;
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    border:1px solid rgba(248,245,238,0.08);
  }
  .pf-chip-save-btn { background:rgba(6,182,212,0.12); color:var(--gold,#06B6D4); }
  .pf-chip-save-btn:hover:not(:disabled) { background:rgba(6,182,212,0.2); }
  .pf-chip-save-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .pf-chip-cancel-btn { background:rgba(248,245,238,0.04); color:var(--muted,rgba(248,245,238,0.5)); }
  .pf-chip-cancel-btn:hover { background:rgba(248,245,238,0.08); }

  .pf-social-chip {
    display:flex; align-items:center; gap:12px; margin-top:14px;
    padding:10px 12px; border-radius:14px; background:rgba(248,245,238,0.03);
    border:1px solid rgba(248,245,238,0.06);
  }
  .pf-social-chip:first-of-type { margin-top:0; }
  .pf-social-chip-text { flex:1; min-width:0; }
  .pf-social-chip-label { font-size:12.5px; font-weight:700; color:var(--text,#F8F5EE); margin:0; }
  .pf-social-chip-handle { font-size:11.5px; color:var(--muted,rgba(248,245,238,0.45)); margin:1px 0 0; }
  .pf-icon-btn {
    width:30px; height:30px; border-radius:9px; flex-shrink:0;
    background:rgba(248,245,238,0.04); color:var(--muted,rgba(248,245,238,0.55));
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    border:none; text-decoration:none; transition:all 0.15s;
  }
  .pf-icon-btn:hover { background:rgba(248,245,238,0.09); color:var(--text,#F8F5EE); }
  .pf-icon-btn-danger:hover { background:rgba(248,113,113,0.12); color:#f87171; }

  /* ── Notifications / lists ── */
  .pf-notifs-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:15px 18px; border-bottom:1px solid rgba(248,245,238,0.06);
  }
  .pf-notifs-title { font-size:12.5px; font-weight:600; color:var(--muted,rgba(248,245,238,0.42)); margin:0; }
  .pf-mark-all-btn {
    display:flex; align-items:center; gap:5px;
    background:rgba(248,245,238,0.05); border:none; color:var(--gold,#06B6D4);
    font-size:11px; font-weight:700; padding:6px 11px; border-radius:50px; cursor:pointer;
  }
  .pf-mark-all-btn:hover:not(:disabled) { background:rgba(6,182,212,0.12); }
  .pf-mark-all-btn:disabled { opacity:0.5; cursor:not-allowed; }

  .pf-notifs-empty {
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
    padding:48px 24px; color:var(--muted,rgba(248,245,238,0.4)); font-size:13px; text-align:center;
  }

  .pf-notifs-list { display:flex; flex-direction:column; max-height:480px; overflow-y:auto; }
  .pf-notif-item {
    display:flex; align-items:flex-start; gap:10px; width:100%; text-align:left;
    background:none; border:none; border-bottom:1px solid rgba(248,245,238,0.045);
    padding:13px 18px; cursor:pointer; transition:background 0.15s;
  }
  .pf-notif-item:last-child { border-bottom:none; }
  .pf-notif-item:hover { background:rgba(248,245,238,0.025); }
  .pf-notif-unread { background:rgba(6,182,212,0.04); }
  .pf-notif-dot { width:7px; height:7px; border-radius:50%; background:var(--gold,#06B6D4); flex-shrink:0; margin-top:6px; }
  .pf-notif-body { flex:1; min-width:0; }
  .pf-notif-title-text { font-size:13px; font-weight:700; color:var(--text,#F8F5EE); margin:0 0 3px; }
  .pf-notif-msg { font-size:12.5px; color:var(--muted,rgba(248,245,238,0.4)); margin:0 0 5px; line-height:1.4; }
  .pf-notif-time { font-size:10.5px; color:rgba(248,245,238,0.28); margin:0; font-weight:600; text-transform:capitalize; }

  @media (max-width: 480px) {
    .pf-header { gap:14px; }
    .pf-name { font-size:18px; }
    .pf-card { padding:16px; }
    .pf-stats-grid { grid-template-columns:1fr 1fr; }
  }
`;
