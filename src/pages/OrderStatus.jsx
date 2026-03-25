import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useOrder from "../hooks/useOrder";
import usePolling from "../hooks/usePolling";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { formatCurrency } from "../utils/formatCurrency";
import { getAssignmentByOrder } from "../api/delivery.api";
import {
  ArrowLeft, Flame, LogOut, RefreshCw,
  Clock, CheckCircle2, ChefHat, Package, Truck,
  XCircle, MapPin, Receipt, Copy, Check, Phone,
  User, Bike, Navigation, CheckCheck, Zap,
} from "lucide-react";
import Footer from "../components/Footer";

/* ── Order status config ── */
const STATUS_CFG = {
  pending:   { label: "Order Placed",     Icon: Clock,        color: "#FFC72C", step: 1 },
  paid:      { label: "Payment Received", Icon: CheckCircle2, color: "#60a5fa", step: 2 },
  preparing: { label: "Being Prepared",   Icon: ChefHat,      color: "#fb923c", step: 3 },
  ready:     { label: "Ready for Pickup", Icon: Package,      color: "#a78bfa", step: 4 },
  delivered: { label: "Delivered 🎉",     Icon: Truck,        color: "#4ade80", step: 5 },
  cancelled: { label: "Cancelled",        Icon: XCircle,      color: "#f87171", step: 0 },
};

const STEPS = [
  { key: "pending",   label: "Placed"    },
  { key: "paid",      label: "Paid"      },
  { key: "preparing", label: "Kitchen"   },
  { key: "ready",     label: "Ready"     },
  { key: "delivered", label: "Delivered" },
];

// Delivery assignment sub-statuses
const DELIVERY_STEPS = [
  { key: "accepted",   label: "Driver Assigned",  Icon: Bike,        color: "#FFC72C" },
  { key: "picked_up",  label: "Order Picked Up",  Icon: Package,     color: "#60a5fa" },
  { key: "in_transit", label: "On the Way",       Icon: Navigation,  color: "#fb923c" },
  { key: "delivered",  label: "Delivered",         Icon: CheckCheck,  color: "#4ade80" },
];

/* ── Driver Card ── */
function DriverCard({ info }) {
  if (!info?.has_driver) return null;

  const stepIdx     = DELIVERY_STEPS.findIndex(s => s.key === info.status);
  const currentStep = DELIVERY_STEPS[stepIdx] || DELIVERY_STEPS[0];
  const isMoving    = info.status === "in_transit";
  const isDone      = info.status === "delivered";

  return (
    <section className="os-driver-card">

      {/* Header */}
      <div className="os-driver-header">
        <h2 className="os-section-label">
          <Bike className="w-4 h-4" /> Your Driver
        </h2>
        <span
          className="os-delivery-pill"
          style={{
            background: `${currentStep.color}18`,
            border: `1px solid ${currentStep.color}40`,
            color: currentStep.color,
          }}
        >
          {isMoving && <span className="os-dot-pulse" style={{ background: currentStep.color }} />}
          <currentStep.Icon style={{ width: 12, height: 12, flexShrink: 0 }} />
          {currentStep.label}
        </span>
      </div>

      {/* Delivery progress steps */}
      <div className="os-delivery-track">
        {DELIVERY_STEPS.map((step, i) => {
          const done   = i <= stepIdx;
          const active = i === stepIdx;
          const StepIcon = step.Icon;
          return (
            <div key={step.key} className="os-dstep">
              <div
                className={"os-dstep-dot" + (done ? " os-dstep-done" : "") + (active ? " os-dstep-active" : "")}
                style={done ? { background: step.color, boxShadow: `0 0 10px ${step.color}60`, borderColor: step.color } : {}}
              >
                <StepIcon style={{ width: 13, height: 13 }} />
              </div>
              <span className={"os-dstep-lbl" + (done ? " os-dstep-lbl-done" : "")}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Phone call CTA — most important part */}
      {info.driver_phone && !isDone && (
        <a href={`tel:${info.driver_phone}`} className="os-call-cta">
          <div className="os-call-icon">
            <Phone className="w-5 h-5" />
          </div>
          <div className="os-call-info">
            <p className="os-call-name">{info.driver_name}</p>
            <p className="os-call-number">{info.driver_phone}</p>
          </div>
          <div className="os-call-badge">
            {isMoving ? (
              <>
                <span className="os-dot-pulse os-dot-orange" />
                <span>En route — may call</span>
              </>
            ) : (
              <>
                <span className="os-dot-pulse os-dot-green" />
                <span>Tap to call</span>
              </>
            )}
          </div>
        </a>
      )}

      {/* Driver details row */}
      <div className="os-driver-meta">
        <div className="os-driver-avatar">
          <User className="w-4 h-4" style={{ color: "#FFC72C" }} />
        </div>
        <div className="os-driver-meta-text">
          <p className="os-driver-name-sm">{info.driver_name}</p>
          {info.driver_vehicle && (
            <p className="os-driver-vehicle">🚗 {info.driver_vehicle.charAt(0).toUpperCase() + info.driver_vehicle.slice(1)}</p>
          )}
        </div>
        {info.delivery_fee != null && (
          <div className="os-driver-fee-badge">
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.08em" }}>Fee</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#4ade80", lineHeight: 1 }}>
              R{info.delivery_fee.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Delivered confirmation */}
      {isDone && (
        <div className="os-driver-done">
          <CheckCheck className="w-4 h-4" />
          <div>
            <p style={{ fontWeight: 800, fontSize: 13 }}>Order delivered by {info.driver_name}!</p>
            {info.actual_time_minutes && (
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                Delivered in {info.actual_time_minutes} min
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchOrder } = useOrder();
  const { logout, user } = useAuth();
  const toast = useToast();

  const [order, setOrder]         = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [lastUpdated, setLast]    = useState(null);
  const [copiedId, setCopiedId]   = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);

  const load = async () => {
    try {
      const data = await fetchOrder(id);
      setOrder(data);
      setLast(new Date());
      setLoadError(null);

      // Fetch driver once order is ready or beyond (driver may have accepted it)
      // Also keep refreshing for ready/preparing to catch driver acceptance quickly
      if (["preparing", "ready", "delivered"].includes(data?.status)) {
        try {
          const res = await getAssignmentByOrder(id);
          setDriverInfo(res.data);
        } catch {
          /* non-fatal */
        }
      }
    } catch (err) {
      setLoadError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message || "Could not load order."
      );
    }
  };

  useEffect(() => { load(); }, [id]);
  usePolling(load, 5000); // polls every 5s — keeps driver status live

  const cfg         = order ? (STATUS_CFG[order.status] ?? STATUS_CFG.pending) : null;
  const currentStep = cfg?.step ?? 1;

  const handleLogout = () => {
    logout();
    toast.show({ type: "info", title: "Signed out", message: "See you next time!" });
    navigate("/login");
  };

  const copyOrderId = async () => {
    if (!order?.id) return;
    const short = String(order.id).slice(-8).toUpperCase();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(short);
      } else {
        const ta = document.createElement("textarea");
        ta.value = short; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      }
      setCopiedId(true);
      toast.show({ type: "success", title: "Copied!", message: "Order ID copied" });
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.show({ type: "error", title: "Failed to copy", message: "Please try again" });
    }
  };

  /* ── Error ── */
  if (loadError && !order) return (
    <div className="os-root"><style>{styles}</style>
      <header className="os-header">
        <div className="os-header-inner">
          <button className="os-back-btn" onClick={() => navigate("/menu")}><ArrowLeft className="w-5 h-5" /></button>
          <div className="os-brand"><div className="os-brand-badge"><Flame className="w-4 h-4" style={{ color: "#0e0700" }} /></div><span className="os-brand-name">KOTABITES</span></div>
          <button className="os-logout-btn" onClick={handleLogout}><LogOut className="w-4 h-4" /></button>
        </div>
      </header>
      <div className="os-state-screen">
        <div className="os-state-icon os-state-error"><XCircle className="w-10 h-10" /></div>
        <h2 className="os-state-title">Order Not Found</h2>
        <p className="os-state-sub">{loadError}</p>
        <button className="os-state-btn" onClick={load}><RefreshCw className="w-4 h-4" /> Retry</button>
        <button className="os-state-link" onClick={() => navigate("/")}>← Back to Home</button>
      </div>
    </div>
  );

  /* ── Loading ── */
  if (!order) return (
    <div className="os-root"><style>{styles}</style>
      <div className="os-loading-screen">
        <div className="os-spinner" />
        <p className="os-loading-text">Loading your order…</p>
      </div>
    </div>
  );

  const StatusIcon   = cfg.Icon;
  const orderIdShort = String(order.id ?? "").slice(-8).toUpperCase();

  return (
    <div className="os-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="os-header">
        <div className="os-header-inner">
          <div className="os-header-left">
            <button className="os-back-btn" onClick={() => navigate("/menu")}><ArrowLeft className="w-5 h-5" /></button>
            <div className="os-brand">
              <div className="os-brand-badge"><Flame className="w-4 h-4" style={{ color: "#0e0700" }} /></div>
              <div>
                <span className="os-brand-name">TRACK ORDER</span>
                <div className="os-brand-id-row">
                  <p className="os-brand-id">#{orderIdShort}</p>
                  <button className="os-copy-btn" onClick={copyOrderId} title="Copy Order ID">
                    {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="os-header-right">
            {user && <span className="os-user-pill">{user.email?.split("@")[0]}</span>}
            <button className="os-logout-btn" onClick={handleLogout} title="Sign out"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <div className="os-body">

        {/* ── Status Hero ── */}
        <section className="os-status-card" style={{ "--accent": cfg.color }}>
          <div className="os-status-glow" style={{ background: `radial-gradient(circle, ${cfg.color}22 0%, transparent 70%)` }} />
          <div className="os-status-icon-wrap" style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}15` }}>
            <StatusIcon className="w-9 h-9" style={{ color: cfg.color }} />
          </div>
          <h2 className="os-status-label" style={{ color: cfg.color }}>{cfg.label}</h2>
          {lastUpdated && (
            <p className="os-status-updated">
              <RefreshCw className="w-3 h-3 os-refresh-icon" />
              Updated {lastUpdated.toLocaleTimeString()} · live every 5s
            </p>
          )}
        </section>

        {/* ── Progress Stepper ── */}
        {order.status !== "cancelled" && (
          <section className="os-card">
            <h2 className="os-section-label"><Receipt className="w-4 h-4" /> Order Progress</h2>
            <div className="os-stepper">
              <div className="os-track-bg" />
              <div className="os-track-fill" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`, background: cfg.color }} />
              {STEPS.map((step, i) => {
                const done   = i + 1 <= currentStep;
                const active = i + 1 === currentStep;
                return (
                  <div key={step.key} className="os-step">
                    <div
                      className={"os-step-dot" + (done ? " os-step-done" : "") + (active ? " os-step-active" : "")}
                      style={done ? { background: cfg.color, boxShadow: `0 0 12px ${cfg.color}60` } : {}}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={"os-step-label" + (done ? " os-step-label-done" : "")}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Driver Card — shows when driver has been assigned ── */}
        <DriverCard info={driverInfo} />

        {/* ── Preparing warning ── */}
        {order.status === "preparing" && (
          <div className="os-cta-card os-cta-warn">
            <XCircle className="w-5 h-5" />
            <div>
              <p className="os-cta-title">Cannot be cancelled</p>
              <p className="os-cta-sub">The kitchen is already preparing your order.</p>
            </div>
          </div>
        )}

        {/* ── Pending cancellation info ── */}
        {order.status === "pending" && (
          <section className="os-cancel-info">
            <div className="os-cancel-icon"><Phone className="w-4 h-4" /></div>
            <div className="os-cancel-content">
              <p className="os-cancel-title">Need to cancel?</p>
              <p className="os-cancel-text">Cancellations via KotaBot AI. For urgent issues call:</p>
              <a href="tel:0653935339" className="os-cancel-phone">065 393 5339</a>
            </div>
          </section>
        )}

        {/* ── Order Details ── */}
        <section className="os-card">
          <h2 className="os-section-label"><Receipt className="w-4 h-4" /> Order Details</h2>
          <div className="os-meta-grid">
            <div className="os-meta-item">
              <span className="os-meta-label">Total</span>
              <span className="os-meta-value os-meta-total">{formatCurrency(order.total_amount ?? 0)}</span>
            </div>
            <div className="os-meta-item">
              <span className="os-meta-label">Order ID</span>
              <div className="os-meta-value-row">
                <span className="os-meta-value os-meta-id">#{orderIdShort}</span>
                <button className="os-copy-btn-sm" onClick={copyOrderId}>
                  {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            {order.payment_method && (
              <div className="os-meta-item">
                <span className="os-meta-label">Payment</span>
                <span className="os-meta-value" style={{ textTransform: "capitalize" }}>
                  {order.payment_method === "cash" ? "💵 Cash on Delivery" : "💳 Paystack"}
                </span>
              </div>
            )}
            {order.delivery_fee != null && (
              <div className="os-meta-item">
                <span className="os-meta-label">Delivery Fee</span>
                <span className="os-meta-value">{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            {order.phone && (
              <div className="os-meta-item">
                <span className="os-meta-label">Phone</span>
                <span className="os-meta-value">{order.phone}</span>
              </div>
            )}
          </div>

          {order.delivery_address && (
            <div className="os-address-box">
              <MapPin className="w-4 h-4 os-address-icon" />
              <div>
                <span className="os-meta-label">Delivery Address</span>
                <p className="os-address-text">{order.delivery_address}</p>
              </div>
            </div>
          )}

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="os-items-list">
              <span className="os-meta-label" style={{ display: "block", marginBottom: 8 }}>Items</span>
              {order.items.map((item, i) => (
                <div key={i} className="os-item-row">
                  <span className="os-item-name">
                    {item.name ?? item.menu_item_id}
                    <span className="os-item-qty"> ×{item.quantity}</span>
                  </span>
                  {item.price != null && (
                    <span className="os-item-price">{formatCurrency(item.price * item.quantity)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Cancelled CTA ── */}
        {order.status === "cancelled" && (
          <div className="os-cta-card os-cta-red">
            <XCircle className="w-5 h-5" />
            <div><p className="os-cta-title">Order Cancelled</p><p className="os-cta-sub">Place a new one?</p></div>
            <button className="os-cta-btn" onClick={() => navigate("/menu")}>Order Again</button>
          </div>
        )}

        {/* ── Delivered CTA ── */}
        {order.status === "delivered" && (
          <div className="os-cta-card os-cta-green">
            <Truck className="w-5 h-5" />
            <div><p className="os-cta-title">Enjoy your meal! 🎉</p><p className="os-cta-sub">Order another round?</p></div>
            <button className="os-cta-btn os-cta-btn-green" onClick={() => navigate("/menu")}>Order Again</button>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root{--red:#DA291C;--red2:#b91c1c;--gold:#FFC72C;--dark:#0e0700;--card:#1a0e00;--border:rgba(255,199,44,0.1);--text:#fff8e7;--muted:rgba(255,248,231,0.42);}

  .os-root{min-height:100vh;background:radial-gradient(ellipse 80% 35% at 50% 0%,rgba(218,41,28,0.15) 0%,transparent 65%),var(--dark);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--text);padding-bottom:60px;}

  /* Loading */
  .os-loading-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;}
  .os-spinner{width:44px;height:44px;border:3px solid rgba(255,199,44,0.15);border-top-color:var(--gold);border-radius:50%;animation:osSpin 0.8s linear infinite;}
  @keyframes osSpin{to{transform:rotate(360deg);}}
  .os-loading-text{font-size:14px;font-weight:600;color:var(--muted);}

  /* Header */
  .os-header{position:sticky;top:0;z-index:100;background:rgba(14,7,0,0.95);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
  .os-header-inner{max-width:680px;margin:0 auto;padding:13px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .os-header-left{display:flex;align-items:center;gap:10px;}
  .os-header-right{display:flex;align-items:center;gap:8px;}
  .os-back-btn{width:36px;height:36px;flex-shrink:0;background:rgba(255,248,231,0.05);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:all 0.2s;}
  .os-back-btn:hover{color:var(--text);border-color:rgba(255,199,44,0.3);}
  .os-brand{display:flex;align-items:center;gap:8px;}
  .os-brand-badge{width:34px;height:34px;background:var(--gold);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 16px rgba(255,199,44,0.25);}
  .os-brand-name{font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:3px;color:var(--text);line-height:1;display:block;}
  .os-brand-id-row{display:flex;align-items:center;gap:6px;margin-top:1px;}
  .os-brand-id{font-size:10px;font-weight:800;color:var(--gold);letter-spacing:0.1em;}
  .os-copy-btn{width:20px;height:20px;border-radius:5px;background:rgba(255,199,44,0.1);border:1px solid rgba(255,199,44,0.2);display:flex;align-items:center;justify-content:center;color:var(--gold);cursor:pointer;transition:all 0.2s;}
  .os-copy-btn:hover{background:rgba(255,199,44,0.2);transform:scale(1.1);}
  .os-user-pill{background:rgba(255,199,44,0.08);border:1px solid rgba(255,199,44,0.18);border-radius:50px;padding:5px 11px;font-size:11px;font-weight:700;color:var(--muted);max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .os-logout-btn{width:34px;height:34px;border-radius:10px;background:rgba(218,41,28,0.08);border:1px solid rgba(218,41,28,0.2);display:flex;align-items:center;justify-content:center;color:rgba(218,41,28,0.6);cursor:pointer;transition:all 0.2s;}
  .os-logout-btn:hover{background:rgba(218,41,28,0.2);color:var(--red);}

  /* Body */
  .os-body{max-width:680px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:16px;}

  /* Status hero */
  .os-status-card{position:relative;overflow:hidden;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:32px 24px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;}
  .os-status-glow{position:absolute;inset:0;pointer-events:none;}
  .os-status-icon-wrap{position:relative;width:70px;height:70px;border-radius:20px;border:1px solid;display:flex;align-items:center;justify-content:center;}
  .os-status-label{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:2px;position:relative;}
  .os-status-updated{font-size:11px;color:var(--muted);display:flex;align-items:center;gap:5px;position:relative;}
  .os-refresh-icon{animation:osSpin 3s linear infinite;opacity:0.6;}

  /* Card */
  .os-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:14px;}
  .os-section-label{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold);}

  /* Stepper */
  .os-stepper{position:relative;display:flex;align-items:flex-start;justify-content:space-between;padding-top:16px;}
  .os-track-bg{position:absolute;top:16px;left:16px;right:16px;height:2px;background:rgba(255,248,231,0.08);border-radius:2px;transform:translateY(-50%);}
  .os-track-fill{position:absolute;top:16px;left:16px;height:2px;border-radius:2px;transform:translateY(-50%);transition:width 0.7s ease;}
  .os-step{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:1;}
  .os-step-dot{width:32px;height:32px;border-radius:50%;background:rgba(255,248,231,0.07);border:2px solid rgba(255,248,231,0.1);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:var(--muted);transition:all 0.4s;}
  .os-step-done{color:var(--dark)!important;border-color:transparent!important;}
  .os-step-active{animation:osStepPulse 1.8s ease infinite;}
  @keyframes osStepPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
  .os-step-label{font-size:10px;font-weight:700;color:var(--muted);text-align:center;width:52px;line-height:1.3;}
  .os-step-label-done{color:var(--text);}

  /* ══════════ DRIVER CARD ══════════ */
  .os-driver-card{
    background:linear-gradient(135deg, rgba(255,199,44,0.06) 0%, var(--card) 60%);
    border:1px solid rgba(255,199,44,0.25);
    border-radius:18px; padding:18px 20px;
    display:flex; flex-direction:column; gap:14px;
    animation:osDriverIn 0.4s cubic-bezier(0.34,1.2,0.64,1);
  }
  @keyframes osDriverIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}

  .os-driver-header{display:flex;align-items:center;justify-content:space-between;gap:10px;}

  .os-delivery-pill{
    display:inline-flex;align-items:center;gap:6px;
    padding:5px 12px;border-radius:50px;
    font-size:11px;font-weight:800;letter-spacing:0.03em;
    white-space:nowrap;
  }

  /* Animated dot */
  .os-dot-pulse{
    display:inline-block;width:7px;height:7px;border-radius:50%;
    animation:osDotPulse 1.2s ease infinite;flex-shrink:0;
  }
  .os-dot-green{background:#4ade80;}
  .os-dot-orange{background:#fb923c;}
  @keyframes osDotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}

  /* Delivery progress track */
  .os-delivery-track{
    display:flex;align-items:flex-start;justify-content:space-between;
    position:relative;padding-top:6px;
  }
  .os-delivery-track::before{
    content:'';position:absolute;top:21px;left:16px;right:16px;
    height:2px;background:rgba(255,248,231,0.08);border-radius:2px;
  }
  .os-dstep{display:flex;flex-direction:column;align-items:center;gap:6px;z-index:1;}
  .os-dstep-dot{
    width:30px;height:30px;border-radius:50%;
    background:rgba(255,248,231,0.05);border:2px solid rgba(255,248,231,0.1);
    display:flex;align-items:center;justify-content:center;color:var(--muted);
    transition:all 0.3s;
  }
  .os-dstep-done{border-color:transparent!important;}
  .os-dstep-active{animation:osDstepPulse 1.8s ease infinite;}
  @keyframes osDstepPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
  .os-dstep-lbl{font-size:9px;font-weight:700;color:var(--muted);text-align:center;width:56px;line-height:1.3;}
  .os-dstep-lbl-done{color:var(--text);}

  /* ── Phone Call CTA — the most prominent element ── */
  .os-call-cta{
    display:flex;align-items:center;gap:14px;
    background:rgba(255,199,44,0.08);
    border:1.5px solid rgba(255,199,44,0.3);
    border-radius:14px;padding:14px 16px;
    text-decoration:none;
    transition:all 0.2s;
    cursor:pointer;
  }
  .os-call-cta:hover{background:rgba(255,199,44,0.14);border-color:rgba(255,199,44,0.5);transform:scale(1.01);}
  .os-call-icon{
    width:44px;height:44px;border-radius:12px;flex-shrink:0;
    background:rgba(255,199,44,0.15);border:1px solid rgba(255,199,44,0.3);
    display:flex;align-items:center;justify-content:center;
    color:var(--gold);
  }
  .os-call-info{flex:1;min-width:0;}
  .os-call-name{font-size:14px;font-weight:800;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .os-call-number{font-size:16px;font-weight:900;color:var(--gold);margin-top:2px;letter-spacing:0.05em;}
  .os-call-badge{
    display:flex;align-items:center;gap:6px;
    font-size:10px;font-weight:800;color:var(--gold);
    background:rgba(255,199,44,0.1);border:1px solid rgba(255,199,44,0.2);
    padding:5px 10px;border-radius:50px;flex-shrink:0;white-space:nowrap;
  }

  /* Driver meta row */
  .os-driver-meta{
    display:flex;align-items:center;gap:12px;
    background:rgba(255,248,231,0.03);border:1px solid var(--border);
    border-radius:12px;padding:12px 14px;
  }
  .os-driver-avatar{
    width:36px;height:36px;border-radius:10px;flex-shrink:0;
    background:rgba(255,199,44,0.1);border:1px solid rgba(255,199,44,0.2);
    display:flex;align-items:center;justify-content:center;
  }
  .os-driver-meta-text{flex:1;min-width:0;}
  .os-driver-name-sm{font-size:13px;font-weight:800;color:var(--text);}
  .os-driver-vehicle{font-size:11px;color:var(--muted);margin-top:2px;}
  .os-driver-fee-badge{display:flex;flex-direction:column;align-items:flex-end;gap:1px;flex-shrink:0;}

  /* Delivered banner */
  .os-driver-done{
    display:flex;align-items:center;gap:10px;
    background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);
    border-radius:12px;padding:12px 14px;
    color:#4ade80;
  }

  /* Cancellation */
  .os-cancel-info{display:flex;align-items:flex-start;gap:12px;background:rgba(218,41,28,0.08);border:1px solid rgba(218,41,28,0.25);border-radius:16px;padding:16px 18px;}
  .os-cancel-icon{width:36px;height:36px;background:rgba(218,41,28,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--red);flex-shrink:0;}
  .os-cancel-content{flex:1;}
  .os-cancel-title{font-size:13px;font-weight:800;color:var(--text);margin-bottom:4px;}
  .os-cancel-text{font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:8px;}
  .os-cancel-phone{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:800;color:var(--gold);text-decoration:none;padding:6px 12px;background:rgba(255,199,44,0.1);border:1px solid rgba(255,199,44,0.2);border-radius:50px;transition:all 0.2s;}
  .os-cancel-phone:hover{background:rgba(255,199,44,0.2);}

  /* Meta */
  .os-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .os-meta-item{background:rgba(255,248,231,0.03);border:1px solid var(--border);border-radius:12px;padding:12px 14px;}
  .os-meta-label{font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:4px;}
  .os-meta-value{font-size:13px;font-weight:700;color:var(--text);}
  .os-meta-value-row{display:flex;align-items:center;gap:8px;}
  .os-meta-total{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;color:var(--red);}
  .os-meta-id{font-family:monospace;font-size:13px;color:var(--gold);}
  .os-copy-btn-sm{width:24px;height:24px;border-radius:6px;background:rgba(255,199,44,0.08);border:1px solid rgba(255,199,44,0.15);display:flex;align-items:center;justify-content:center;color:var(--gold);cursor:pointer;transition:all 0.2s;}
  .os-copy-btn-sm:hover{background:rgba(255,199,44,0.15);transform:scale(1.05);}

  .os-address-box{display:flex;align-items:flex-start;gap:10px;background:rgba(255,248,231,0.03);border:1px solid var(--border);border-radius:12px;padding:12px 14px;}
  .os-address-icon{color:var(--gold);flex-shrink:0;margin-top:2px;}
  .os-address-text{font-size:13px;color:var(--text);margin-top:4px;line-height:1.5;}

  .os-items-list{background:rgba(255,248,231,0.03);border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;}
  .os-item-row{display:flex;justify-content:space-between;align-items:baseline;}
  .os-item-name{font-size:13px;font-weight:600;color:var(--text);}
  .os-item-qty{font-size:11px;color:var(--muted);}
  .os-item-price{font-size:13px;font-weight:800;color:var(--gold);flex-shrink:0;}

  /* CTA cards */
  .os-cta-card{display:flex;align-items:center;gap:14px;border-radius:16px;padding:16px 18px;border:1px solid;}
  .os-cta-red{background:rgba(218,41,28,0.08);border-color:rgba(218,41,28,0.25);color:var(--red);}
  .os-cta-warn{background:rgba(251,146,60,0.08);border-color:rgba(251,146,60,0.25);color:#fb923c;}
  .os-cta-green{background:rgba(74,222,128,0.08);border-color:rgba(74,222,128,0.25);color:#4ade80;}
  .os-cta-title{font-size:14px;font-weight:800;color:var(--text);}
  .os-cta-sub{font-size:11px;color:var(--muted);margin-top:2px;}
  .os-cta-btn{margin-left:auto;flex-shrink:0;background:var(--red);color:white;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:12px;padding:9px 18px;border-radius:50px;transition:background 0.2s;}
  .os-cta-btn:hover{background:var(--red2);}
  .os-cta-btn-green{background:rgba(74,222,128,0.2);color:#4ade80;border:1px solid rgba(74,222,128,0.3);}
  .os-cta-btn-green:hover{background:rgba(74,222,128,0.3);}

  /* State screen */
  .os-state-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:calc(100vh - 70px);gap:16px;padding:24px;text-align:center;}
  .os-state-icon{width:72px;height:72px;background:rgba(255,199,44,0.08);border:1px solid rgba(255,199,44,0.18);border-radius:20px;display:flex;align-items:center;justify-content:center;color:var(--gold);}
  .os-state-error{background:rgba(218,41,28,0.1)!important;border-color:rgba(218,41,28,0.25)!important;color:var(--red)!important;}
  .os-state-title{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:2px;}
  .os-state-sub{color:var(--muted);font-size:14px;max-width:280px;line-height:1.6;}
  .os-state-btn{display:flex;align-items:center;gap:8px;background:var(--red);color:white;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14px;padding:12px 26px;border-radius:50px;margin-top:6px;}
  .os-state-link{font-size:13px;color:var(--muted);background:none;border:none;cursor:pointer;}
  .os-state-link:hover{color:var(--text);}

  @media(max-width:600px){
    .os-body{padding:16px 12px;}
    .os-meta-grid{grid-template-columns:1fr;}
    .os-user-pill{display:none;}
    .os-delivery-track::before{left:10px;right:10px;}
    .os-dstep-lbl{width:48px;font-size:8px;}
  }
`;
