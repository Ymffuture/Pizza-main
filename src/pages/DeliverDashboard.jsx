// src/pages/DeliverDashboard.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getDriverProfile,
  getActiveDelivery,
  getAvailableOrders,
  toggleAvailability,
  acceptOrder,
  updateDeliveryStatus,
  getWalletBalance,
} from "../api/delivery.api";
import {
  Flame, ArrowLeft, Bike, CheckCircle2, Clock, XCircle,
  AlertCircle, DollarSign, TrendingUp, Star, Loader2,
  Power, ShoppingBag, MapPin, Phone, Package, Truck,
  ChevronRight, RefreshCw, Wallet, User, Award,
  Navigation, CheckCheck, Circle, Zap, LogOut,
} from "lucide-react";

/* ── Status config ── */
const STATUS_CFG = {
  pending:   { label: "Under Review",    color: "#FFC72C", bg: "rgba(255,199,44,0.1)",  border: "rgba(255,199,44,0.25)", Icon: Clock },
  approved:  { label: "Active Driver",   color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)", Icon: CheckCircle2 },
  rejected:  { label: "Rejected",        color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", Icon: XCircle },
  suspended: { label: "Suspended",       color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.25)",  Icon: AlertCircle },
};

const DELIVERY_STATUS_STEPS = [
  { key: "accepted",   label: "Accepted",   Icon: CheckCircle2 },
  { key: "picked_up",  label: "Picked Up",  Icon: Package },
  { key: "in_transit", label: "In Transit", Icon: Navigation },
  { key: "delivered",  label: "Delivered",  Icon: CheckCheck },
];

const NEXT_STATUS = {
  accepted:   "picked_up",
  picked_up:  "in_transit",
  in_transit: "delivered",
};

const NEXT_LABEL = {
  accepted:   "Mark Picked Up",
  picked_up:  "Mark In Transit",
  in_transit: "Mark Delivered",
};

export default function DeliverDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuth, user, logout } = useAuth();

  const [profile, setProfile]               = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [walletBalance, setWalletBalance]   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState(null);
  const [toggling, setToggling]             = useState(false);
  const [acceptingId, setAcceptingId]       = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab]           = useState(searchParams.get("tab") || "overview");
  const [toast, setToast]                   = useState(null);
  // track last order fetch time to avoid double-fetching
  const lastOrderFetchRef = useRef(0);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Fetch available orders (extracted so tabs can call it directly) ──
  const fetchOrders = useCallback(async (driverProfile) => {
    const p = driverProfile;
    if (!p || p.status !== "approved" || !p.is_available) {
      setAvailableOrders([]);
      return;
    }
    try {
      const ordersRes = await getAvailableOrders();
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      setAvailableOrders(orders);
      console.log("Orders fetched:", orders.length, orders); // DEBUG
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || err?.message || "";
      console.log("Orders fetch error:", status, detail); // DEBUG
      
      // 403 = driver not online or not approved - this is expected, just clear the list
      // 401 = unauthorized - token issue
      // 500 = server error
      if (status === 403) {
        setAvailableOrders([]);
        // Don't show toast for 403 - it's expected when offline
      } else if (status === 401) {
        showToast("Session expired. Please log in again.", "error");
        setAvailableOrders([]);
      } else {
        // Surface unexpected errors so the driver knows what's wrong
        showToast(`Orders fetch failed: ${detail || "Unknown error"}`, "error");
        setAvailableOrders([]);
      }
    }
    lastOrderFetchRef.current = Date.now();
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const profileRes = await getDriverProfile();
      const p = profileRes.data;
      setProfile(p);

      if (p.status === "approved") {
        const [activeRes, balanceRes] = await Promise.all([
          getActiveDelivery().catch(() => ({ data: { active: false } })),
          getWalletBalance().catch(() => ({ data: null })),
        ]);

        setActiveDelivery(activeRes.data?.active ? activeRes.data : null);
        setWalletBalance(balanceRes.data);
        
        // Only fetch orders if online and no active delivery
        if (p.is_available && !activeRes.data?.active) {
          await fetchOrders(p);
        } else {
          setAvailableOrders([]);
        }
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setError("no_profile");
      } else {
        setError(err?.response?.data?.detail || err?.message || "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    if (isAuth) fetchAll();
  }, [isAuth, fetchAll]);

  // ── Re-fetch orders whenever user navigates to the Orders tab ──
  useEffect(() => {
    if (activeTab !== "orders") return;
    if (!profile) return;
    // Throttle: don't re-fetch if we just fetched within 5s
    if (Date.now() - lastOrderFetchRef.current < 5000) return;
    fetchOrders(profile);
  }, [activeTab, profile, fetchOrders]);

  // ── Auto-refresh every 15s when online ──
  useEffect(() => {
    if (!profile?.is_available || activeDelivery) return;
    const id = setInterval(() => fetchAll(true), 15000);
    return () => clearInterval(id);
  }, [profile?.is_available, activeDelivery, fetchAll]);

  const handleToggle = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const res = await toggleAvailability(!profile.is_available);
      const newProfile = { ...profile, is_available: res.data.is_available };
      setProfile(newProfile);
      if (res.data.is_available) {
        await fetchOrders(newProfile);
        showToast("You're online — checking for orders!", "success");
      } else {
        setAvailableOrders([]);
        showToast("You're now offline.", "info");
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Could not update availability";
      showToast(msg, "error");
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await acceptOrder(orderId);
      showToast("Order accepted! Head to the restaurant.", "success");
      await fetchAll(true);
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 409) {
        showToast("Another driver already accepted this order.", "error");
      } else if (status === 400) {
        showToast(detail || "Cannot accept this order right now.", "error");
      } else if (status === 403) {
        showToast("Go online first to accept orders.", "error");
      } else {
        showToast(detail || err?.message || "Failed to accept order — try again.", "error");
      }
      await fetchAll(true);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleUpdateStatus = async (assignmentId, status) => {
    setUpdatingStatus(true);
    try {
      await updateDeliveryStatus(assignmentId, status);
      const labels = { picked_up: "Picked up!", in_transit: "On the way!", delivered: "Delivered! Earnings credited." };
      showToast(labels[status] || `Status updated to ${status}`, "success");
      await fetchAll(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Status update failed";
      showToast(msg, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="dd-root">
        <style>{styles}</style>
        <div className="dd-loading">
          <Loader2 className="dd-spin" style={{ width: 36, height: 36, color: "#FFC72C" }} />
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  /* ── No profile ── */
  if (error === "no_profile") {
    return (
      <div className="dd-root">
        <style>{styles}</style>
        <div className="dd-nodriver">
          <div className="dd-nodriver-icon"><Bike className="w-10 h-10" style={{ color: "#FFC72C" }} /></div>
          <h2 className="dd-nodriver-title">Not a Driver Yet</h2>
          <p className="dd-nodriver-sub">Apply to become a KotaBites driver and start earning today.</p>
          <Link to="/deliver" className="dd-nodriver-btn">Apply Now</Link>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="dd-root">
        <style>{styles}</style>
        <div className="dd-nodriver">
          <AlertCircle className="w-10 h-10" style={{ color: "#f87171" }} />
          <h2 className="dd-nodriver-title">Something Went Wrong</h2>
          <p className="dd-nodriver-sub">{error}</p>
          <button onClick={() => fetchAll()} className="dd-nodriver-btn">Retry</button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CFG[profile?.status] || STATUS_CFG.pending;
  const StatusIcon = statusCfg.Icon;
  const isApproved = profile?.status === "approved";
  const currentStepIdx = activeDelivery
    ? DELIVERY_STATUS_STEPS.findIndex(s => s.key === activeDelivery.status)
    : -1;

  return (
    <div className="dd-root">
      <style>{styles}</style>

      {/* ── Toast ── */}
      {toast && (
        <div key={toast.id} className={`dd-toast dd-toast-${toast.type}`}>
          {toast.type === "error"
            ? <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
            : toast.type === "info"
            ? <Zap className="w-4 h-4" style={{ flexShrink: 0 }} />
            : <CheckCircle2 className="w-4 h-4" style={{ flexShrink: 0 }} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Header ── */}
      <header className="dd-header">
        <div className="dd-header-inner">
          <div className="dd-header-left">
            <button className="dd-back-btn" onClick={() => navigate("/menu")}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="dd-brand">
              <div className="dd-brand-badge">
                <Flame className="w-4 h-4" style={{ color: "#0e0700" }} />
              </div>
              <div>
                <span className="dd-brand-name">DRIVER HUB</span>
                <p className="dd-brand-sub">KotaBites Delivery</p>
              </div>
            </div>
          </div>
          <div className="dd-header-right">
            <span className="dd-status-pill" style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, color: statusCfg.color }}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
            <button className="dd-logout-btn" onClick={handleLogout} title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="dd-tabs-wrap">
        {["overview", "orders", "wallet"].map(tab => (
          <button
            key={tab}
            className={`dd-tab${activeTab === tab ? " dd-tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "overview" && <User className="w-4 h-4" />}
            {tab === "orders"   && <ShoppingBag className="w-4 h-4" />}
            {tab === "wallet"   && <Wallet className="w-4 h-4" />}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            {tab === "orders" && isApproved && profile?.is_available && availableOrders.length > 0 && (
              <span className="dd-tab-badge">{availableOrders.length}</span>
            )}
          </button>
        ))}
        <button
          className="dd-refresh-btn"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4${refreshing ? " dd-spin" : ""}`} />
        </button>
      </div>

      <div className="dd-body">

        {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Driver Profile Card */}
            <div className="dd-card dd-profile-card">
              <div className="dd-profile-row">
                <div className="dd-avatar">
                  {profile?.profile_photo_url
                    ? <img src={profile.profile_photo_url} alt={profile.full_name} className="dd-avatar-img" />
                    : <span className="dd-avatar-initials">{profile?.full_name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}</span>
                  }
                  <span className="dd-avatar-dot" style={{ background: profile?.is_available ? "#4ade80" : "rgba(255,248,231,0.2)" }} />
                </div>
                <div className="dd-profile-info">
                  <h2 className="dd-profile-name">{profile?.full_name}</h2>
                  <p className="dd-profile-email">{profile?.email}</p>
                  <div className="dd-profile-meta">
                    <span className="dd-meta-chip">
                      🚗 {profile?.vehicle_type?.charAt(0).toUpperCase() + profile?.vehicle_type?.slice(1)}
                    </span>
                    <span className="dd-meta-chip">
                      ⭐ {profile?.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {profile?.status === "pending" && (
                <div className="dd-status-banner dd-status-pending">
                  <Clock className="w-4 h-4" style={{ flexShrink: 0 }} />
                  <div>
                    <p className="dd-banner-title">Application Under Review</p>
                    <p className="dd-banner-sub">We're reviewing your documents. You'll hear from us within 24 hours.</p>
                  </div>
                </div>
              )}
              {profile?.status === "rejected" && (
                <div className="dd-status-banner dd-status-rejected">
                  <XCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
                  <div>
                    <p className="dd-banner-title">Application Rejected</p>
                    <p className="dd-banner-sub">{profile?.rejected_reason || "Please contact support for more information."}</p>
                  </div>
                </div>
              )}
              {profile?.status === "suspended" && (
                <div className="dd-status-banner dd-status-suspended">
                  <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
                  <div>
                    <p className="dd-banner-title">Account Suspended</p>
                    <p className="dd-banner-sub">Contact support to resolve this issue.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Approved: Stats + Toggle */}
            {isApproved && (
              <>
                <div className="dd-stats-grid">
                  <div className="dd-stat-card">
                    <div className="dd-stat-icon" style={{ background: "rgba(255,199,44,0.12)" }}>
                      <DollarSign className="w-5 h-5" style={{ color: "#FFC72C" }} />
                    </div>
                    <span className="dd-stat-val">R{walletBalance?.balance?.toFixed(2) || "0.00"}</span>
                    <span className="dd-stat-lbl">Balance</span>
                  </div>
                  <div className="dd-stat-card">
                    <div className="dd-stat-icon" style={{ background: "rgba(74,222,128,0.12)" }}>
                      <TrendingUp className="w-5 h-5" style={{ color: "#4ade80" }} />
                    </div>
                    <span className="dd-stat-val">R{walletBalance?.total_earned?.toFixed(2) || "0.00"}</span>
                    <span className="dd-stat-lbl">Total Earned</span>
                  </div>
                  <div className="dd-stat-card">
                    <div className="dd-stat-icon" style={{ background: "rgba(96,165,250,0.12)" }}>
                      <Bike className="w-5 h-5" style={{ color: "#60a5fa" }} />
                    </div>
                    <span className="dd-stat-val">{profile?.total_deliveries || 0}</span>
                    <span className="dd-stat-lbl">Deliveries</span>
                  </div>
                  <div className="dd-stat-card">
                    <div className="dd-stat-icon" style={{ background: "rgba(251,191,36,0.12)" }}>
                      <Star className="w-5 h-5" style={{ color: "#fbbf24" }} />
                    </div>
                    <span className="dd-stat-val">{profile?.rating?.toFixed(1) || "5.0"}</span>
                    <span className="dd-stat-lbl">Rating</span>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className={`dd-toggle-card${profile?.is_available ? " dd-toggle-online" : ""}`}>
                  <div className="dd-toggle-info">
                    <div className="dd-toggle-icon" style={{ background: profile?.is_available ? "rgba(74,222,128,0.15)" : "rgba(255,248,231,0.07)" }}>
                      <Power className="w-6 h-6" style={{ color: profile?.is_available ? "#4ade80" : "rgba(255,248,231,0.4)" }} />
                    </div>
                    <div>
                      <p className="dd-toggle-title">{profile?.is_available ? "You're Online" : "You're Offline"}</p>
                      <p className="dd-toggle-sub">
                        {profile?.is_available
                          ? "Accepting orders — stay ready!"
                          : "Go online to receive delivery requests"}
                      </p>
                    </div>
                  </div>
                  <button
                    className={`dd-toggle-btn${profile?.is_available ? " dd-toggle-btn-online" : ""}`}
                    onClick={handleToggle}
                    disabled={toggling || !!activeDelivery}
                  >
                    {toggling
                      ? <Loader2 className="w-5 h-5 dd-spin" />
                      : profile?.is_available ? "Go Offline" : "Go Online"}
                  </button>
                </div>

                {/* Active Delivery */}
                {activeDelivery && (
                  <div className="dd-card dd-active-delivery">
                    <div className="dd-section-lbl">
                      <Zap className="w-4 h-4" style={{ color: "#FFC72C" }} />
                      Active Delivery
                    </div>
                    <div className="dd-delivery-steps">
                      {DELIVERY_STATUS_STEPS.map((step, i) => {
                        const done   = i <= currentStepIdx;
                        const active = i === currentStepIdx;
                        const StepIcon = step.Icon;
                        return (
                          <div key={step.key} className="dd-step">
                            <div className={`dd-step-dot${done ? " dd-step-done" : ""}${active ? " dd-step-active" : ""}`}>
                              <StepIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`dd-step-lbl${done ? " dd-step-lbl-done" : ""}`}>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="dd-delivery-info">
                      <div className="dd-delivery-row"><User className="w-4 h-4 dd-info-icon" /><span>{activeDelivery.customer_name}</span></div>
                      <div className="dd-delivery-row"><MapPin className="w-4 h-4 dd-info-icon" /><span>{activeDelivery.delivery_address}</span></div>
                      {activeDelivery.customer_phone && (
                        <div className="dd-delivery-row">
                          <Phone className="w-4 h-4 dd-info-icon" />
                          <a href={`tel:${activeDelivery.customer_phone}`} className="dd-phone-link">{activeDelivery.customer_phone}</a>
                        </div>
                      )}
                      <div className="dd-delivery-row">
                        <DollarSign className="w-4 h-4 dd-info-icon" />
                        <span>Earn <strong style={{ color: "#4ade80" }}>R{activeDelivery.delivery_fee?.toFixed(2)}</strong> for this delivery</span>
                      </div>
                    </div>
                    {NEXT_STATUS[activeDelivery.status] && (
                      <button
                        className="dd-delivery-action-btn"
                        onClick={() => handleUpdateStatus(activeDelivery.assignment_id, NEXT_STATUS[activeDelivery.status])}
                        disabled={updatingStatus}
                      >
                        {updatingStatus
                          ? <><Loader2 className="w-4 h-4 dd-spin" /> Updating…</>
                          : <><Truck className="w-4 h-4" /> {NEXT_LABEL[activeDelivery.status]}</>}
                      </button>
                    )}
                    {activeDelivery.status === "delivered" && (
                      <div className="dd-delivered-banner">
                        <CheckCheck className="w-4 h-4" />
                        Delivered! Earnings will be credited shortly.
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="dd-quick-grid">
                  <button className="dd-quick-card" onClick={() => setActiveTab("orders")}>
                    <div className="dd-quick-icon" style={{ background: "rgba(218,41,28,0.12)", color: "#DA291C" }}><ShoppingBag className="w-5 h-5" /></div>
                    <span className="dd-quick-label">Available Orders</span>
                    {availableOrders.length > 0 && <span className="dd-quick-badge">{availableOrders.length}</span>}
                  </button>
                  <button className="dd-quick-card" onClick={() => setActiveTab("wallet")}>
                    <div className="dd-quick-icon" style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}><Wallet className="w-5 h-5" /></div>
                    <span className="dd-quick-label">My Wallet</span>
                  </button>
                  <Link to="/wallet" className="dd-quick-card">
                    <div className="dd-quick-icon" style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}><DollarSign className="w-5 h-5" /></div>
                    <span className="dd-quick-label">Withdraw</span>
                  </Link>
                  <button className="dd-quick-card" onClick={() => fetchAll(true)}>
                    <div className="dd-quick-icon" style={{ background: "rgba(255,199,44,0.12)", color: "#FFC72C" }}><RefreshCw className={`w-5 h-5${refreshing ? " dd-spin" : ""}`} /></div>
                    <span className="dd-quick-label">Refresh</span>
                  </button>
                </div>
              </>
            )}

            {/* Pending: Timeline */}
            {profile?.status === "pending" && (
              <div className="dd-card">
                <div className="dd-section-lbl"><Award className="w-4 h-4" style={{ color: "#FFC72C" }} />What Happens Next</div>
                <div className="dd-timeline">
                  {[
                    { step: "01", title: "Document Review", sub: "We verify your ID and vehicle documents" },
                    { step: "02", title: "Background Check",  sub: "Standard safety verification (24 hrs)" },
                    { step: "03", title: "Account Approved",  sub: "You'll get notified and can start earning" },
                  ].map((item) => (
                    <div key={item.step} className="dd-timeline-item">
                      <div className="dd-timeline-num">{item.step}</div>
                      <div>
                        <p className="dd-timeline-title">{item.title}</p>
                        <p className="dd-timeline-sub">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════ ORDERS TAB ═══════════════════ */}
        {activeTab === "orders" && (
          <>
            {!isApproved ? (
              <div className="dd-empty-state">
                <Clock className="w-10 h-10" style={{ color: "var(--muted)" }} />
                <p>Orders available after approval</p>
                <span>We'll notify you once your account is activated</span>
              </div>

            ) : !profile?.is_available ? (
              <div className="dd-empty-state">
                <Power className="w-10 h-10" style={{ color: "var(--muted)" }} />
                <p>You're currently offline</p>
                <span>Go online to see available orders</span>
                <button className="dd-go-online-btn" onClick={handleToggle} disabled={toggling}>
                  {toggling ? <Loader2 className="w-4 h-4 dd-spin" /> : <Power className="w-4 h-4" />}
                  Go Online
                </button>
              </div>

            ) : activeDelivery ? (
              <div className="dd-card">
                <div className="dd-section-lbl"><Truck className="w-4 h-4" style={{ color: "#FFC72C" }} />Active Delivery</div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                  You have an active delivery in progress. Complete it before accepting a new order.
                </p>
                <button className="dd-delivery-action-btn" style={{ marginTop: 4 }} onClick={() => setActiveTab("overview")}>
                  <Navigation className="w-4 h-4" /> View Active Delivery
                </button>
              </div>

            ) : availableOrders.length === 0 ? (
              <div className="dd-empty-state">
                <ShoppingBag className="w-10 h-10" style={{ color: "var(--muted)" }} />
                <p>No orders available right now</p>
                <span>
                  Orders appear here once the admin marks them{" "}
                  <strong style={{ color: "#a78bfa" }}>Ready</strong>.
                  {" "}Check back in a moment.
                </span>
                <button className="dd-go-online-btn" onClick={() => fetchOrders(profile)} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4${refreshing ? " dd-spin" : ""}`} />
                  Check Now
                </button>
                <div style={{ marginTop: 8, padding: "10px 16px", borderRadius: 12, background: "rgba(255,199,44,0.07)", border: "1px solid rgba(255,199,44,0.2)", fontSize: 11, color: "rgba(255,248,231,0.5)", textAlign: "center", maxWidth: 280 }}>
                  Auto-refreshes every 15 seconds while you're online
                </div>
              </div>

            ) : (
              <div className="dd-orders-list">
                <div className="dd-section-lbl" style={{ padding: "0 0 4px" }}>
                  <ShoppingBag className="w-4 h-4" style={{ color: "#FFC72C" }} />
                  {availableOrders.length} Order{availableOrders.length !== 1 ? "s" : ""} Available
                </div>
                {availableOrders.map((order) => (
                  <div key={order.order_id} className="dd-order-card">
                    <div className="dd-order-header">
                      <div>
                        <span className="dd-order-id">#{order.short_id}</span>
                        <span className="dd-order-time">
                          {new Date(order.created_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="dd-order-fee">+R{order.delivery_fee?.toFixed(2)}</span>
                    </div>
                    <div className="dd-order-detail">
                      <MapPin className="w-3.5 h-3.5" style={{ flexShrink: 0, color: "#FFC72C" }} />
                      <span>{order.delivery_address}</span>
                    </div>
                    <div className="dd-order-footer">
                      <div className="dd-order-meta">
                        <span>Order total: <strong>R{order.total_amount?.toFixed(2)}</strong></span>
                        {order.distance_km && <span>{order.distance_km.toFixed(1)} km</span>}
                      </div>
                      <button
                        className="dd-accept-btn"
                        onClick={() => handleAccept(order.order_id)}
                        disabled={acceptingId === order.order_id}
                      >
                        {acceptingId === order.order_id
                          ? <Loader2 className="w-4 h-4 dd-spin" />
                          : <><CheckCircle2 className="w-4 h-4" /> Accept</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════ WALLET TAB ═══════════════════ */}
        {activeTab === "wallet" && (
          <>
            <div className="dd-card">
              <div className="dd-section-lbl"><Wallet className="w-4 h-4" style={{ color: "#FFC72C" }} />Wallet Overview</div>
              <div className="dd-wallet-balance">
                <span className="dd-wallet-currency">R</span>
                <span className="dd-wallet-amount">{walletBalance?.balance?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="dd-wallet-row"><span>Total Earned</span><span style={{ color: "#4ade80", fontWeight: 700 }}>R{walletBalance?.total_earned?.toFixed(2) || "0.00"}</span></div>
              <div className="dd-wallet-row"><span>Total Withdrawn</span><span style={{ color: "#f87171", fontWeight: 700 }}>R{walletBalance?.total_withdrawn?.toFixed(2) || "0.00"}</span></div>
              {walletBalance?.pending_amount > 0 && (
                <div className="dd-wallet-row"><span>Pending</span><span style={{ color: "#FFC72C", fontWeight: 700 }}>R{walletBalance.pending_amount?.toFixed(2)}</span></div>
              )}
              <Link to="/wallet" className="dd-wallet-action-btn">
                <DollarSign className="w-4 h-4" />
                Full Wallet & Withdraw
                <ChevronRight className="w-4 h-4" style={{ marginLeft: "auto" }} />
              </Link>
            </div>
            <div className="dd-card">
              <div className="dd-section-lbl" style={{ marginBottom: 4 }}><TrendingUp className="w-4 h-4" style={{ color: "#FFC72C" }} />Earnings Info</div>
              {[
                { label: "Per delivery",        value: "R15.00"   },
                { label: "Minimum withdrawal",  value: "R50.00"   },
                { label: "Payout time",         value: "24–48 hrs" },
              ].map(({ label, value }) => (
                <div key={label} className="dd-wallet-row">
                  <span>{label}</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

/* ── Styles ── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --red:#DA291C; --red2:#b91c1c; --gold:#FFC72C;
    --dark:#0e0700; --card:#1a0e00;
    --border:rgba(255,199,44,0.1); --text:#fff8e7;
    --muted:rgba(255,248,231,0.42);
  }

  .dd-root { min-height:100vh; background:radial-gradient(ellipse 80% 35% at 50% 0%,rgba(218,41,28,0.15) 0%,transparent 65%),var(--dark); font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--text); padding-bottom:60px; }
  .dd-loading,.dd-nodriver { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; text-align:center; padding:24px; }
  .dd-loading p { font-size:14px; color:var(--muted); }
  .dd-nodriver-icon { width:80px; height:80px; border-radius:22px; background:rgba(255,199,44,0.1); border:1px solid rgba(255,199,44,0.2); display:flex; align-items:center; justify-content:center; }
  .dd-nodriver-title { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:2px; }
  .dd-nodriver-sub { font-size:14px; color:var(--muted); max-width:280px; line-height:1.6; }
  .dd-nodriver-btn { background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:900; font-size:15px; padding:13px 32px; border-radius:50px; text-decoration:none; box-shadow:0 6px 20px rgba(218,41,28,0.4); transition:all 0.2s; }
  .dd-nodriver-btn:hover { background:var(--red2); transform:scale(1.03); }

  .dd-header { position:sticky; top:0; z-index:100; background:rgba(14,7,0,0.95); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); }
  .dd-header-inner { max-width:680px; margin:0 auto; padding:13px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .dd-header-left { display:flex; align-items:center; gap:10px; }
  .dd-header-right { display:flex; align-items:center; gap:8px; }
  .dd-back-btn { width:36px; height:36px; border-radius:10px; flex-shrink:0; background:rgba(255,248,231,0.05); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--muted); cursor:pointer; transition:all 0.2s; }
  .dd-back-btn:hover { color:var(--text); border-color:rgba(255,199,44,0.3); }
  .dd-brand { display:flex; align-items:center; gap:8px; }
  .dd-brand-badge { width:34px; height:34px; background:var(--gold); border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 16px rgba(255,199,44,0.25); }
  .dd-brand-name { font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:3px; color:var(--text); line-height:1; display:block; }
  .dd-brand-sub { font-size:10px; font-weight:700; color:var(--muted); margin-top:1px; }
  .dd-status-pill { display:flex; align-items:center; gap:5px; padding:5px 10px; border-radius:50px; font-size:11px; font-weight:800; white-space:nowrap; }
  .dd-logout-btn { width:32px; height:32px; border-radius:9px; background:rgba(218,41,28,0.08); border:1px solid rgba(218,41,28,0.2); display:flex; align-items:center; justify-content:center; color:rgba(218,41,28,0.6); cursor:pointer; transition:all 0.2s; }
  .dd-logout-btn:hover { background:rgba(218,41,28,0.2); color:var(--red); }

  .dd-tabs-wrap { display:flex; align-items:center; gap:0; background:rgba(14,7,0,0.9); backdrop-filter:blur(10px); border-bottom:1px solid var(--border); padding:0 16px; max-width:680px; margin:0 auto; overflow-x:auto; scrollbar-width:none; }
  .dd-tabs-wrap::-webkit-scrollbar { display:none; }
  @media(min-width:681px) { .dd-tabs-wrap { max-width:none; justify-content:center; } }
  .dd-tab { display:flex; align-items:center; gap:6px; padding:12px 16px; cursor:pointer; background:none; border:none; border-bottom:2px solid transparent; color:var(--muted); font-size:13px; font-weight:700; transition:all 0.2s; white-space:nowrap; position:relative; font-family:'Plus Jakarta Sans',sans-serif; }
  .dd-tab:hover { color:var(--text); }
  .dd-tab-active { color:var(--gold); border-bottom-color:var(--gold); }
  .dd-tab-badge { min-width:18px; height:18px; padding:0 5px; background:var(--red); color:white; font-size:10px; font-weight:900; border-radius:9px; display:flex; align-items:center; justify-content:center; }
  .dd-refresh-btn { margin-left:auto; width:32px; height:32px; border-radius:8px; flex-shrink:0; background:rgba(255,248,231,0.05); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--muted); cursor:pointer; transition:all 0.2s; }
  .dd-refresh-btn:hover { color:var(--text); }

  .dd-body { max-width:680px; margin:0 auto; padding:20px 16px; display:flex; flex-direction:column; gap:16px; }
  .dd-card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
  .dd-section-lbl { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); }

  .dd-profile-row { display:flex; align-items:center; gap:14px; }
  .dd-avatar { width:60px; height:60px; border-radius:16px; flex-shrink:0; background:rgba(255,199,44,0.12); border:2px solid rgba(255,199,44,0.25); display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative; }
  .dd-avatar-img { width:100%; height:100%; object-fit:cover; }
  .dd-avatar-initials { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1px; color:var(--gold); }
  .dd-avatar-dot { position:absolute; bottom:3px; right:3px; width:10px; height:10px; border-radius:50%; border:2px solid var(--dark); }
  .dd-profile-info { flex:1; min-width:0; }
  .dd-profile-name { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1.5px; color:var(--text); line-height:1; }
  .dd-profile-email { font-size:11px; color:var(--muted); margin-top:3px; }
  .dd-profile-meta { display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
  .dd-meta-chip { font-size:11px; font-weight:700; padding:3px 9px; border-radius:8px; background:rgba(255,248,231,0.06); border:1px solid var(--border); color:var(--muted); }

  .dd-status-banner { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; border:1px solid; font-size:13px; }
  .dd-status-pending  { background:rgba(255,199,44,0.08);  border-color:rgba(255,199,44,0.25);  color:#FFC72C; }
  .dd-status-rejected { background:rgba(248,113,113,0.08); border-color:rgba(248,113,113,0.25); color:#f87171; }
  .dd-status-suspended{ background:rgba(251,146,60,0.08);  border-color:rgba(251,146,60,0.25);  color:#fb923c; }
  .dd-banner-title { font-size:12px; font-weight:800; color:var(--text); margin-bottom:2px; }
  .dd-banner-sub { font-size:11px; color:var(--muted); line-height:1.5; }

  .dd-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .dd-stat-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:14px 12px; display:flex; flex-direction:column; align-items:center; gap:8px; transition:all 0.25s; }
  .dd-stat-card:hover { border-color:rgba(255,199,44,0.25); transform:translateY(-2px); }
  .dd-stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .dd-stat-val { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:0.5px; color:var(--text); line-height:1; }
  .dd-stat-lbl { font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; }

  .dd-toggle-card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:18px 20px; display:flex; align-items:center; justify-content:space-between; gap:14px; transition:all 0.3s; }
  .dd-toggle-online { border-color:rgba(74,222,128,0.3); box-shadow:0 0 20px rgba(74,222,128,0.08); }
  .dd-toggle-info { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
  .dd-toggle-icon { width:44px; height:44px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .dd-toggle-title { font-size:15px; font-weight:800; color:var(--text); }
  .dd-toggle-sub { font-size:11px; color:var(--muted); margin-top:2px; line-height:1.4; }
  .dd-toggle-btn { padding:10px 20px; border-radius:50px; flex-shrink:0; background:rgba(255,248,231,0.07); border:1.5px solid var(--border); color:var(--muted); font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px; cursor:pointer; transition:all 0.2s; }
  .dd-toggle-btn:hover:not(:disabled) { border-color:rgba(255,199,44,0.4); color:var(--text); }
  .dd-toggle-btn-online { background:rgba(74,222,128,0.12); border-color:rgba(74,222,128,0.3); color:#4ade80; }
  .dd-toggle-btn-online:hover:not(:disabled) { background:rgba(74,222,128,0.18); }
  .dd-toggle-btn:disabled { opacity:0.5; cursor:not-allowed; }

  .dd-active-delivery { border-color:rgba(255,199,44,0.2); }
  .dd-delivery-steps { display:flex; align-items:flex-start; justify-content:space-between; padding:8px 0; position:relative; }
  .dd-delivery-steps::before { content:''; position:absolute; top:17px; left:16px; right:16px; height:2px; background:rgba(255,248,231,0.08); }
  .dd-step { display:flex; flex-direction:column; align-items:center; gap:6px; z-index:1; }
  .dd-step-dot { width:34px; height:34px; border-radius:50%; background:rgba(255,248,231,0.06); border:2px solid rgba(255,248,231,0.1); display:flex; align-items:center; justify-content:center; color:var(--muted); transition:all 0.3s; }
  .dd-step-done { background:rgba(74,222,128,0.15); border-color:#4ade80; color:#4ade80; }
  .dd-step-active { box-shadow:0 0 12px rgba(74,222,128,0.4); animation:ddStepPulse 1.8s ease infinite; }
  @keyframes ddStepPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
  .dd-step-lbl { font-size:10px; font-weight:700; color:var(--muted); text-align:center; width:50px; line-height:1.3; }
  .dd-step-lbl-done { color:#4ade80; }
  .dd-delivery-info { display:flex; flex-direction:column; gap:8px; }
  .dd-delivery-row { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:var(--muted); }
  .dd-delivery-row strong { color:var(--text); }
  .dd-info-icon { color:var(--gold); margin-top:1px; flex-shrink:0; }
  .dd-phone-link { color:var(--gold); font-weight:700; text-decoration:none; }
  .dd-delivery-action-btn { display:flex; align-items:center; justify-content:center; gap:8px; background:var(--gold); color:#0e0700; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:900; font-size:14px; padding:13px; border-radius:12px; transition:all 0.2s; }
  .dd-delivery-action-btn:hover:not(:disabled) { background:#e6b025; }
  .dd-delivery-action-btn:disabled { opacity:0.55; cursor:not-allowed; }
  .dd-delivered-banner { display:flex; align-items:center; gap:8px; background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.25); border-radius:10px; padding:10px 14px; font-size:12px; font-weight:700; color:#4ade80; }

  .dd-quick-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .dd-quick-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:14px 10px; display:flex; flex-direction:column; align-items:center; gap:8px; cursor:pointer; text-decoration:none; transition:all 0.2s; color:var(--muted); position:relative; }
  .dd-quick-card:hover { border-color:rgba(255,199,44,0.25); transform:translateY(-2px); color:var(--text); }
  .dd-quick-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .dd-quick-label { font-size:11px; font-weight:700; text-align:center; }
  .dd-quick-badge { position:absolute; top:8px; right:8px; min-width:18px; height:18px; padding:0 4px; background:var(--red); color:white; font-size:10px; font-weight:900; border-radius:9px; display:flex; align-items:center; justify-content:center; }

  .dd-timeline { display:flex; flex-direction:column; gap:16px; }
  .dd-timeline-item { display:flex; align-items:flex-start; gap:14px; }
  .dd-timeline-num { font-family:'Bebas Neue',sans-serif; font-size:28px; color:rgba(255,199,44,0.2); line-height:1; flex-shrink:0; min-width:36px; }
  .dd-timeline-title { font-size:13px; font-weight:800; color:var(--text); margin-bottom:2px; }
  .dd-timeline-sub { font-size:12px; color:var(--muted); line-height:1.5; }

  .dd-orders-list { display:flex; flex-direction:column; gap:12px; }
  .dd-order-card { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:10px; transition:all 0.2s; }
  .dd-order-card:hover { border-color:rgba(255,199,44,0.25); }
  .dd-order-header { display:flex; align-items:center; justify-content:space-between; }
  .dd-order-id { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:1.5px; color:var(--text); }
  .dd-order-time { font-size:11px; color:var(--muted); margin-left:8px; }
  .dd-order-fee { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1px; color:#4ade80; }
  .dd-order-detail { display:flex; align-items:flex-start; gap:7px; font-size:12px; color:var(--muted); line-height:1.5; }
  .dd-order-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .dd-order-meta { font-size:12px; color:var(--muted); display:flex; gap:12px; }
  .dd-order-meta strong { color:var(--text); }
  .dd-accept-btn { display:flex; align-items:center; gap:6px; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px; padding:9px 18px; border-radius:50px; transition:all 0.2s; box-shadow:0 4px 14px rgba(218,41,28,0.35); flex-shrink:0; }
  .dd-accept-btn:hover:not(:disabled) { background:var(--red2); }
  .dd-accept-btn:disabled { opacity:0.55; cursor:not-allowed; }

  .dd-empty-state { display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; padding:60px 20px; background:var(--card); border:1px solid var(--border); border-radius:18px; }
  .dd-empty-state p { font-size:15px; font-weight:800; color:var(--text); }
  .dd-empty-state span { font-size:13px; color:var(--muted); max-width:260px; line-height:1.5; }
  .dd-go-online-btn { display:flex; align-items:center; gap:8px; background:rgba(255,199,44,0.1); border:1px solid rgba(255,199,44,0.25); color:var(--gold); font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px; padding:10px 22px; border-radius:50px; cursor:pointer; transition:all 0.2s; margin-top:6px; }
  .dd-go-online-btn:hover:not(:disabled) { background:rgba(255,199,44,0.18); }
  .dd-go-online-btn:disabled { opacity:0.55; cursor:not-allowed; }

  .dd-wallet-balance { display:flex; align-items:baseline; gap:4px; padding:8px 0; }
  .dd-wallet-currency { font-family:'Bebas Neue',sans-serif; font-size:28px; color:var(--muted); }
  .dd-wallet-amount { font-family:'Bebas Neue',sans-serif; font-size:56px; letter-spacing:-1px; color:var(--text); line-height:1; }
  .dd-wallet-row { display:flex; align-items:center; justify-content:space-between; font-size:13px; color:var(--muted); padding:6px 0; border-bottom:1px solid rgba(255,248,231,0.04); }
  .dd-wallet-row:last-of-type { border-bottom:none; }
  .dd-wallet-action-btn { display:flex; align-items:center; gap:10px; background:rgba(255,199,44,0.08); border:1px solid rgba(255,199,44,0.2); color:var(--gold); text-decoration:none; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px; padding:12px 16px; border-radius:12px; transition:all 0.2s; margin-top:4px; }
  .dd-wallet-action-btn:hover { background:rgba(255,199,44,0.15); border-color:rgba(255,199,44,0.4); }

  @keyframes ddSpin { to { transform:rotate(360deg); } }
  .dd-spin { animation:ddSpin 0.8s linear infinite; }
  .dd-toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; align-items:center; gap:10px; padding:12px 20px; border-radius:14px; border:1px solid; font-size:13px; font-weight:700; white-space:nowrap; animation:ddToastIn 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow:0 8px 32px rgba(0,0,0,0.5); }
  @keyframes ddToastIn { from{opacity:0;transform:translateX(-50%) translateY(16px) scale(0.9)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
  .dd-toast-success { background:rgba(74,222,128,0.12); border-color:rgba(74,222,128,0.35); color:#4ade80; }
  .dd-toast-error   { background:rgba(248,113,113,0.12); border-color:rgba(248,113,113,0.35); color:#f87171; }
  .dd-toast-info    { background:rgba(255,199,44,0.1);  border-color:rgba(255,199,44,0.3);  color:#FFC72C; }

  @media(max-width:480px) {
    .dd-stats-grid { grid-template-columns:repeat(2,1fr); }
    .dd-quick-grid { grid-template-columns:repeat(2,1fr); }
    .dd-body { padding:16px 12px; }
    .dd-toast { bottom:16px; max-width:calc(100vw - 32px); white-space:normal; }
  }
`;
