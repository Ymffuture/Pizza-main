
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useOrder from "../hooks/useOrder";
import usePolling from "../hooks/usePolling";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { formatCurrency } from "../utils/formatCurrency";
import {
  ArrowLeft, Flame, LogOut, RefreshCw,
  Clock, CheckCircle2, ChefHat, Package, Truck,
  XCircle, MapPin, Receipt, Copy, Check, Phone
} from "lucide-react";
import Footer from "../components/Footer";

/* ── Status config ── */
const STATUS_CFG = {
  pending:   { label: "Order Placed",      Icon: Clock,         color: "#FFC72C", step: 1 },
  paid:      { label: "Payment Received",  Icon: CheckCircle2,  color: "#60a5fa", step: 2 },
  preparing: { label: "Being Prepared",    Icon: ChefHat,       color: "#fb923c", step: 3 },
  ready:     { label: "Ready for Pickup",  Icon: Package,       color: "#a78bfa", step: 4 },
  delivered: { label: "Delivered 🎉",      Icon: Truck,         color: "#4ade80", step: 5 },
  cancelled: { label: "Cancelled",         Icon: XCircle,       color: "#f87171", step: 0 },
};

const STEPS = [
  { key: "pending",   label: "Placed"    },
  { key: "paid",      label: "Paid"      },
  { key: "preparing", label: "Kitchen"   },
  { key: "ready",     label: "Ready"     },
  { key: "delivered", label: "Delivered" },
];

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

  const load = async () => {
    try {
      const data = await fetchOrder(id);
      setOrder(data);
      setLast(new Date());
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message || "Could not load order."
      );
    }
  };

  useEffect(() => { load(); }, [id]);
  usePolling(load, 5000);

  const cfg = order ? (STATUS_CFG[order.status] ?? STATUS_CFG.pending) : null;
  const currentStep = cfg?.step ?? 1;

  const handleLogout = () => {
    logout();
    toast.show({ type: "info", title: "Signed out", message: "See you next time!" });
    navigate("/login");
  };

  const copyOrderId = async () => {
    if (!order?.id) return;
    const orderIdStr = String(order.id).slice(-8).toUpperCase();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(orderIdStr);
      } else {
        // Fallback for non-HTTPS contexts
        const textarea = document.createElement("textarea");
        textarea.value = orderIdStr;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(true);
      toast.show({ type: "success", title: "Copied!", message: "Order ID copied to clipboard" });
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      toast.show({ type: "error", title: "Failed to copy", message: "Please try again" });
    }
  };

  /* ── Error (no order yet) ── */
  if (loadError && !order) {
    return (
      <div className="os-root">
        <style>{styles}</style>
        <header className="os-header">
          <div className="os-header-inner">
            <button className="os-back-btn" onClick={() => navigate("/menu")}><ArrowLeft className="w-5 h-5" /></button>
            <div className="os-brand"><div className="os-brand-badge"><Flame className="w-4 h-4" style={{ color:"#0e0700" }} /></div><span className="os-brand-name">KOTABITES</span></div>
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
  }

  /* ── Loading ── */
  if (!order) {
    return (
      <div className="os-root">
        <style>{styles}</style>
        <div className="os-loading-screen">
          <div className="os-spinner" />
          <p className="os-loading-text">Loading your order…</p>
        </div>
      </div>
    );
  }

  const StatusIcon = cfg.Icon;
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
              <div className="os-brand-badge"><Flame className="w-4 h-4" style={{ color:"#0e0700" }} /></div>
              <div>
                <span className="os-brand-name">TRACK ORDER</span>
                <div className="os-brand-id-row">
                  <p className="os-brand-id">#{orderIdShort}</p>
                  <button 
                    className="os-copy-btn" 
                    onClick={copyOrderId}
                    title="Copy Order ID"
                  >
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
              Updated {lastUpdated.toLocaleTimeString()} · refreshing every 5s
            </p>
          )}
        </section>

        {/* ── Progress Stepper (not for cancelled) ── */}
        {order.status !== "cancelled" && (
          <section className="os-card">
            <h2 className="os-section-label"><Receipt className="w-4 h-4" /> Order Progress</h2>
            <div className="os-stepper">
              {/* Track line */}
              <div className="os-track-bg" />
              <div
                className="os-track-fill"
                style={{
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                  background: cfg.color,
                }}
              />
              {STEPS.map((step, i) => {
                const done = i + 1 <= currentStep;
                const active = i + 1 === currentStep;
                return (
                  <div key={step.key} className="os-step">
                    <div
                      className={"os-step-dot" + (done ? " os-step-done" : "") + (active ? " os-step-active" : "")}
                      style={done ? { background: cfg.color, boxShadow: `0 0 12px ${cfg.color}60` } : {}}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={"os-step-label" + (done ? " os-step-label-done" : "")}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        
{order.status === "preparing" || "ready" && (
          <div className="os-cta-card os-cta-warn">
            <XCircle className="w-5 h-5" />
            <div>
              <p className="os-cta-title">Important Note:</p>
              <p className="os-cta-sub">This order can not be cancelled or refundable.</p>
            </div>
            <button className="os-cta-btn" onClick={() => navigate("/info")}>Learn more</button>
          </div>
        )}
        
        {/* ── Cancellation Info Banner ── */}
        {order.status === "pending" && (
          <section className="os-cancel-info">
            <div className="os-cancel-icon">
              <Phone className="w-4 h-4" />
            </div>
            <div className="os-cancel-content">
              <p className="os-cancel-title">Cancellation Support</p>
              <p className="os-cancel-text">
                Cancellations can only be processed through Katabot AI-Powered. 
                For any issues or refunds, please contact:
              </p>
              <a href="tel:0653935339" className="os-cancel-phone">
                065 393 5339
              </a>
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
                <button className="os-copy-btn-sm" onClick={copyOrderId} title="Copy Order ID">
                  {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            {order.payment_method && (
              <div className="os-meta-item">
                <span className="os-meta-label">Payment</span>
                <span className="os-meta-value" style={{ textTransform:"capitalize" }}>
                  {order.payment_method === "cash" ? "Cash on Delivery" : "Paystack"}
                </span>
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
              <span className="os-meta-label" style={{ display:"block", marginBottom:8 }}>Items</span>
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

        {/* ── Cancelled / Delivered CTA ── */}
        {order.status === "cancelled" && (
          <div className="os-cta-card os-cta-red">
            <XCircle className="w-5 h-5" />
            <div>
              <p className="os-cta-title">Order Cancelled</p>
              <p className="os-cta-sub">This order was cancelled. Place a new one?</p>
            </div>
            <button className="os-cta-btn" onClick={() => navigate("/menu")}>Order Again</button>
          </div>
        )}
        

        {order.status === "delivered" && (
          <div className="os-cta-card os-cta-green">
            <Truck className="w-5 h-5" />
            <div>
              <p className="os-cta-title">Enjoy your meal! 🎉</p>
              <p className="os-cta-sub">Order another round?</p>
            </div>
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
  :root {
    --red:#DA291C; --red2:#b91c1c; --gold:#FFC72C;
    --dark:#0e0700; --card:#1a0e00;
    --border:rgba(255,199,44,0.1); --text:#fff8e7;
    --muted:rgba(255,248,231,0.42);
  }

  .os-root { min-height:100vh; background:radial-gradient(ellipse 80% 35% at 50% 0%,rgba(218,41,28,0.15) 0%,transparent 65%),var(--dark); font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--text); padding-bottom:60px; }

  /* Loading */
  .os-loading-screen { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; }
  .os-spinner { width:44px; height:44px; border:3px solid rgba(255,199,44,0.15); border-top-color:var(--gold); border-radius:50%; animation:osSpin 0.8s linear infinite; }
  @keyframes osSpin { to { transform:rotate(360deg); } }
  .os-loading-text { font-size:14px; font-weight:600; color:var(--muted); }

  /* Header */
  .os-header { position:sticky; top:0; z-index:100; background:rgba(14,7,0,0.95); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); }
  .os-header-inner { max-width:680px; margin:0 auto; padding:13px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .os-header-left { display:flex; align-items:center; gap:10px; }
  .os-header-right { display:flex; align-items:center; gap:8px; }
  .os-back-btn { width:36px; height:36px; flex-shrink:0; background:rgba(255,248,231,0.05); border:1px solid var(--border); border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--muted); cursor:pointer; transition:all 0.2s; }
  .os-back-btn:hover { color:var(--text); border-color:rgba(255,199,44,0.3); }
  .os-brand { display:flex; align-items:center; gap:8px; }
  .os-brand-badge { width:34px; height:34px; background:var(--gold); border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 16px rgba(255,199,44,0.25); }
  .os-brand-name { font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:3px; color:var(--text); line-height:1; display:block; }
  .os-brand-id-row { display:flex; align-items:center; gap:6px; margin-top:1px; }
  .os-brand-id { font-size:10px; font-weight:800; color:var(--gold); letter-spacing:0.1em; }
  .os-copy-btn { width:20px; height:20px; border-radius:5px; background:rgba(255,199,44,0.1); border:1px solid rgba(255,199,44,0.2); display:flex; align-items:center; justify-content:center; color:var(--gold); cursor:pointer; transition:all 0.2s; }
  .os-copy-btn:hover { background:rgba(255,199,44,0.2); border-color:rgba(255,199,44,0.4); transform:scale(1.1); }
  .os-user-pill { background:rgba(255,199,44,0.08); border:1px solid rgba(255,199,44,0.18); border-radius:50px; padding:5px 11px; font-size:11px; font-weight:700; color:var(--muted); max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .os-logout-btn { width:34px; height:34px; border-radius:10px; background:rgba(218,41,28,0.08); border:1px solid rgba(218,41,28,0.2); display:flex; align-items:center; justify-content:center; color:rgba(218,41,28,0.6); cursor:pointer; transition:all 0.2s; }
  .os-logout-btn:hover { background:rgba(218,41,28,0.2); color:var(--red); border-color:rgba(218,41,28,0.4); }

  /* Body */
  .os-body { max-width:680px; margin:0 auto; padding:24px 16px; display:flex; flex-direction:column; gap:16px; }

  /* Status hero */
  .os-status-card { position:relative; overflow:hidden; background:var(--card); border:1px solid var(--border); border-radius:20px; padding:32px 24px; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; }
  .os-status-glow { position:absolute; inset:0; pointer-events:none; }
  .os-status-icon-wrap { position:relative; width:70px; height:70px; border-radius:20px; border:1px solid; display:flex; align-items:center; justify-content:center; }
  .os-status-label { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:2px; position:relative; }
  .os-status-updated { font-size:11px; color:var(--muted); display:flex; align-items:center; gap:5px; position:relative; }
  .os-refresh-icon { animation:osSpin 3s linear infinite; opacity:0.6; }

  /* Card */
  .os-card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:20px; display:flex; flex-direction:column; gap:14px; }
  .os-section-label { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); }

  /* Stepper */
  .os-stepper { position:relative; display:flex; align-items:flex-start; justify-content:space-between; padding-top:16px; }
  .os-track-bg { position:absolute; top:16px; left:16px; right:16px; height:2px; background:rgba(255,248,231,0.08); border-radius:2px; transform:translateY(-50%); }
  .os-track-fill { position:absolute; top:16px; left:16px; height:2px; border-radius:2px; transform:translateY(-50%); transition:width 0.7s ease; }
  .os-step { position:relative; display:flex; flex-direction:column; align-items:center; gap:8px; z-index:1; }
  .os-step-dot { width:32px; height:32px; border-radius:50%; background:rgba(255,248,231,0.07); border:2px solid rgba(255,248,231,0.1); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900; color:var(--muted); transition:all 0.4s; }
  .os-step-done { color:var(--dark)!important; border-color:transparent!important; }
  .os-step-active { animation:osStepPulse 1.8s ease infinite; }
  @keyframes osStepPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
  .os-step-label { font-size:10px; font-weight:700; color:var(--muted); text-align:center; width:52px; line-height:1.3; }
  .os-step-label-done { color:var(--text); }

  /* Cancellation Info Banner */
  .os-cancel-info { display:flex; align-items:flex-start; gap:12px; background:rgba(218,41,28,0.08); border:1px solid rgba(218,41,28,0.25); border-radius:16px; padding:16px 18px; }
  .os-cancel-icon { width:36px; height:36px; background:rgba(218,41,28,0.15); border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--red); flex-shrink:0; }
  .os-cancel-content { flex:1; }
  .os-cancel-title { font-size:13px; font-weight:800; color:var(--text); margin-bottom:4px; }
  .os-cancel-text { font-size:12px; color:var(--muted); line-height:1.5; margin-bottom:8px; }
  .os-cancel-phone { display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:800; color:var(--gold); text-decoration:none; padding:6px 12px; background:rgba(255,199,44,0.1); border:1px solid rgba(255,199,44,0.2); border-radius:50px; transition:all 0.2s; }
  .os-cancel-phone:hover { background:rgba(255,199,44,0.2); border-color:rgba(255,199,44,0.4); transform:translateY(-1px); }

  /* Meta */
  .os-meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .os-meta-item { background:rgba(255,248,231,0.03); border:1px solid var(--border); border-radius:12px; padding:12px 14px; }
  .os-meta-label { font-size:9px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); display:block; margin-bottom:4px; }
  .os-meta-value { font-size:13px; font-weight:700; color:var(--text); }
  .os-meta-value-row { display:flex; align-items:center; gap:8px; }
  .os-meta-total { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1px; color:var(--red); }
  .os-meta-id { font-family:monospace; font-size:13px; color:var(--gold); }
  .os-copy-btn-sm { width:24px; height:24px; border-radius:6px; background:rgba(255,199,44,0.08); border:1px solid rgba(255,199,44,0.15); display:flex; align-items:center; justify-content:center; color:var(--gold); cursor:pointer; transition:all 0.2s; }
  .os-copy-btn-sm:hover { background:rgba(255,199,44,0.15); border-color:rgba(255,199,44,0.3); transform:scale(1.05); }

  .os-address-box { display:flex; align-items:flex-start; gap:10px; background:rgba(255,248,231,0.03); border:1px solid var(--border); border-radius:12px; padding:12px 14px; }
  .os-address-icon { color:var(--gold); flex-shrink:0; margin-top:2px; }
  .os-address-text { font-size:13px; color:var(--text); margin-top:4px; line-height:1.5; }

  .os-items-list { background:rgba(255,248,231,0.03); border:1px solid var(--border); border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
  .os-item-row { display:flex; justify-content:space-between; align-items:baseline; }
  .os-item-name { font-size:13px; font-weight:600; color:var(--text); }
  .os-item-qty { font-size:11px; color:var(--muted); }
  .os-item-price { font-size:13px; font-weight:800; color:var(--gold); flex-shrink:0; }

  /* CTA cards */
  .os-cta-card { display:flex; align-items:center; gap:14px; border-radius:16px; padding:16px 18px; border:1px solid; }
  .os-cta-red { background:rgba(218,41,28,0.08); border-color:rgba(218,41,28,0.25); color:var(--red); }
  .os-cta-warn { background:rgba(218,41,28,0.08); border-color:rgba(218,41,28,0.25); color:orange; }
  .os-cta-green { background:rgba(74,222,128,0.08); border-color:rgba(74,222,128,0.25); color:#4ade80; }
  .os-cta-title { font-size:14px; font-weight:800; color:var(--text); }
  .os-cta-sub { font-size:11px; color:var(--muted); margin-top:2px; }
  .os-cta-btn { margin-left:auto; flex-shrink:0; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:12px; padding:9px 18px; border-radius:50px; transition:background 0.2s; }
  .os-cta-btn:hover { background:var(--red2); }
  .os-cta-btn-green { background:rgba(74,222,128,0.2); color:#4ade80; border:1px solid rgba(74,222,128,0.3); }
  .os-cta-btn-green:hover { background:rgba(74,222,128,0.3); }

  /* State screen */
  .os-state-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:calc(100vh - 70px); gap:16px; padding:24px; text-align:center; }
  .os-state-icon { width:72px; height:72px; background:rgba(255,199,44,0.08); border:1px solid rgba(255,199,44,0.18); border-radius:20px; display:flex; align-items:center; justify-content:center; color:var(--gold); }
  .os-state-error { background:rgba(218,41,28,0.1)!important; border-color:rgba(218,41,28,0.25)!important; color:var(--red)!important; }
  .os-state-title { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:2px; }
  .os-state-sub { color:var(--muted); font-size:14px; max-width:280px; line-height:1.6; }
  .os-state-btn { display:flex; align-items:center; gap:8px; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:14px; padding:12px 26px; border-radius:50px; margin-top:6px; }
  .os-state-link { font-size:13px; color:var(--muted); background:none; border:none; cursor:pointer; transition:color 0.2s; }
  .os-state-link:hover { color:var(--text); }

  @media (max-width:600px) { .os-body { padding:16px 12px; } .os-meta-grid { grid-template-columns:1fr; } .os-user-pill { display:none; } }
`;
