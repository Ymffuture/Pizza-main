import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrderContext } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import useOrder from "../hooks/useOrder";
import usePayment from "../hooks/usePayment";
import { useToast } from "../components/Toast";
import { formatCurrency } from "../utils/formatCurrency";
import {
  ArrowLeft, CreditCard, Banknote, ShoppingBag,
  MapPin, Phone, ChevronRight, Loader2, CheckCircle2,
  LogOut, Flame, Zap, AlertCircle, Clock,
} from "lucide-react";
import { getBusinessHoursStatus } from "../utils/businessHours";

const PAYMENT_METHODS = [
  { id: "cash",     label: "Cash on Delivery", sub: "Pay when your order arrives",           Icon: Banknote   },
  { id: "paystack", label: "Pay Online",        sub: "Card, EFT & Instant EFT via Paystack", Icon: CreditCard },
];

function parseError(err) {
  console.error("[Checkout] Order error:", {
    code:    err?.code,
    status:  err?.response?.status,
    data:    err?.response?.data,
    message: err?.message,
  });

  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;

  if (status === 401) return { type: "auth", msg: "Session expired — please sign in again." };

  if (status === 422) {
    const msg = Array.isArray(detail)
      ? detail.map((d) => `${d.loc?.slice(-1)?.[0] ?? ""}: ${d.msg}`).join(" · ")
      : typeof detail === "string" ? detail
      : JSON.stringify(detail);
    return { type: "validation", msg };
  }

  if (status === 404) {
    return { type: "error", msg: typeof detail === "string" ? detail : "Item not found — please refresh the menu." };
  }

  if (status >= 500) {
    const serverMsg = typeof detail === "string" ? detail : err?.response?.data?.message;
    return { type: "error", msg: serverMsg ?? "Server error — please try again in a moment." };
  }

  if (err?.code === "ERR_NETWORK" || err?.code === "ECONNABORTED") {
    return { type: "cold", msg: "Server is waking up. Please wait 30–60s and try again." };
  }

  return { type: "error", msg: err?.message ?? "Something went wrong placing your order." };
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { setOrder } = useOrderContext();
  const { logout, user } = useAuth();
  const { submitOrder, loading } = useOrder();
  const { startPayment } = usePayment();
  const toast = useToast();

  // ── Business hours check (runs once on mount) ──────────────────────────
  const [hoursStatus] = useState(() => getBusinessHoursStatus());

  const [payMethod, setPayMethod]     = useState("cash");
  const [form, setForm]               = useState({ phone: "", delivery_address: "" });
  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState(null);

  const handleLogout = () => {
    logout();
    toast.show({ type: "info", title: "Signed out", message: "See you next time!" });
    navigate("/login");
  };

  // ── Empty cart screen ──────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="co-state-screen">
        <style>{styles}</style>
        <div className="co-state-icon"><ShoppingBag className="w-10 h-10" /></div>
        <h2 className="co-state-title">Cart is Empty</h2>
        <p className="co-state-sub">Add some items before checking out.</p>
        <button className="co-state-btn" onClick={() => navigate("/menu")}>Browse Menu</button>
      </div>
    );
  }

  // ── Closed screen — shown instead of checkout when outside hours ───────
  if (!hoursStatus.isOpen) {
    return (
      <div className="co-state-screen">
        <style>{styles}</style>
        <div className="co-state-icon co-state-icon-closed">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="co-state-title">We are Closed</h2>
        <p className="co-state-sub">{hoursStatus.message}</p>

        {/* Weekly schedule */}
        <div className="co-schedule">
          {Object.entries(hoursStatus.schedule).map(([day, hrs]) => (
            <div
              key={day}
              className={`co-schedule-row${day === hoursStatus.day ? " co-schedule-today" : ""}`}
            >
              <span className="co-schedule-day">{day}</span>
              <span className="co-schedule-hrs">{hrs}</span>
            </div>
          ))}
        </div>

        <button className="co-state-btn" onClick={() => navigate("/menu")}>
          Browse Menu
        </button>
      </div>
    );
  }

  // ── Validation ─────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    const rawPhone = form.phone.replace(/[\s\-()]/g, "");
    if (!rawPhone) {
      e.phone = "Phone number is required";
    } else if (!/^(0\d{9}|\+27\d{9})$/.test(rawPhone)) {
      e.phone = "Must be 10 digits starting with 0 (e.g. 082 123 4567)";
    }
    if (!form.delivery_address.trim()) e.delivery_address = "Delivery address is required";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setServerError(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const rawPhone  = form.phone.replace(/[\s\-()]/g, "");
    const normPhone = rawPhone.startsWith("+27") ? "0" + rawPhone.slice(3) : rawPhone;

    try {
      const payload = {
        phone:            normPhone,
        delivery_address: form.delivery_address.trim(),
        payment_method:   payMethod,
        items: items.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
      };

      const order = await submitOrder(payload);
      setOrder(order);
      clearCart();

      const orderId = String(order?.id ?? order?._id ?? order?.order_id ?? "");

      if (payMethod === "paystack") {
        try {
          await startPayment(orderId);
        } catch (payErr) {
          console.error("[Checkout] Paystack redirect failed:", payErr);
          toast.show({ type: "info", title: "Order placed", message: "Could not open Paystack — tracking your order." });
          navigate("/order/" + orderId);
        }
      } else {
        toast.show({ type: "success", title: "Order confirmed!", message: "Cash on delivery — have R" + total.toFixed(2) + " ready." });
        navigate("/order/" + orderId);
      }
    } catch (err) {
      const { type, msg } = parseError(err);

      if (type === "auth") {
        toast.show({ type: "error", title: "Session expired", message: msg });
        navigate("/login?redirect=/checkout");
        return;
      }

      if (type === "cold") {
        setServerError({ cold: true, msg });
        toast.show({ type: "info", title: "Server waking up", message: "Please wait 30–60s and try again." });
        return;
      }

      setServerError({ cold: false, msg });
      toast.show({
        type: "error",
        title: type === "validation" ? "Validation error" : "Order failed",
        message: msg,
      });
    }
  };

  // ── Main checkout UI ────────────────────────────────────────────────────
  return (
    <div className="co-root">
      <style>{styles}</style>

      {/* Header */}
      <header className="co-header">
        <div className="co-header-inner">
          <div className="co-header-left">
            <button className="co-back-btn" onClick={() => navigate("/cart")}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="co-brand">
              <div className="co-brand-badge">
                <Flame className="w-4 h-4" style={{ color: "#0e0700" }} />
              </div>
              <div>
                <h1 className="co-title">CHECKOUT</h1>
                <p className="co-subtitle">{items.length} item{items.length !== 1 ? "s" : ""} · {formatCurrency(total)}</p>
              </div>
            </div>
          </div>

          <div className="co-header-right">
            {user && (
              <div className="co-user-pill">
                <span className="co-user-email">{user.email?.split("@")[0]}</span>
              </div>
            )}
            <button className="co-logout-btn" onClick={handleLogout} title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="co-body">

        {/* Order Items */}
        <section className="co-card">
          <h2 className="co-section-label"><ShoppingBag className="w-4 h-4" /> Your Order</h2>
          <div className="co-items-list">
            {items.map((item) => (
              <div key={item.id} className="co-item-row">
                <div className="co-item-img">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>🍔</span>}
                </div>
                <div className="co-item-info">
                  <span className="co-item-name">{item.name}</span>
                  <span className="co-item-qty">× {item.quantity}</span>
                </div>
                <span className="co-item-price">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="co-total-row">
            <span>Total</span>
            <span className="co-total-amount">{formatCurrency(total)}</span>
          </div>
        </section>

        {/* Payment Method */}
        <section className="co-card">
          <h2 className="co-section-label"><CreditCard className="w-4 h-4" /> Payment Method</h2>
          <div className="co-pay-methods">
            {PAYMENT_METHODS.map(({ id, label, sub, Icon }) => (
              <button key={id} type="button" onClick={() => setPayMethod(id)}
                className={"co-pay-option" + (payMethod === id ? " co-pay-active" : "")}>
                <div className={"co-pay-icon-wrap" + (payMethod === id ? " co-pay-icon-active" : "")}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="co-pay-text">
                  <span className="co-pay-label">{label}</span>
                  <span className="co-pay-sub">{sub}</span>
                </div>
                <div className={"co-pay-check" + (payMethod === id ? " co-pay-check-active" : "")}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </button>
            ))}
          </div>
          {payMethod === "cash" && (
            <div className="co-note co-note-gold">
              <Banknote className="w-4 h-4 co-note-icon" style={{ color: "#FFC72C" }} />
              <p>Please have <strong>{formatCurrency(total)}</strong> ready when your order arrives. R12.00 Delivery fee.</p>
            </div>
          )}
          {payMethod === "paystack" && (
            <div className="co-note co-note-green">
              <CreditCard className="w-4 h-4 co-note-icon" style={{ color: "#4ade80" }} />
              <p>You'll be redirected to <strong>Paystack</strong> to complete payment securely. R13.00 Delivery fee.</p>
            </div>
          )}
        </section>

        {/* Delivery Details */}
        <section className="co-card">
          <h2 className="co-section-label"><MapPin className="w-4 h-4" /> Delivery Details</h2>
          <form onSubmit={handleSubmit} className="co-form">

            <div className="co-field">
              <label className="co-label">Phone Number <span className="co-req">*</span></label>
              <div className={"co-input-wrap" + (errors.phone ? " co-input-error" : "")}>
                <Phone className="co-input-icon" />
                <input type="tel" className="co-input" placeholder="082 123 4567"
                  value={form.phone} onChange={handleChange("phone")} />
              </div>
              {errors.phone && <p className="co-error-msg">{errors.phone}</p>}
            </div>

            <div className="co-field">
              <label className="co-label">Delivery Address <span className="co-req">*</span></label>
              <div className={"co-input-wrap co-textarea-wrap" + (errors.delivery_address ? " co-input-error" : "")}>
                <MapPin className="co-input-icon co-input-icon-top" />
                <textarea className="co-input co-textarea" rows={3}
                  placeholder="123 Main Street, Johannesburg…"
                  value={form.delivery_address} onChange={handleChange("delivery_address")} />
              </div>
              {errors.delivery_address && <p className="co-error-msg">{errors.delivery_address}</p>}
            </div>

            {serverError && (
              <div className={"co-server-error" + (serverError.cold ? " co-server-cold" : "")}>
                {serverError.cold
                  ? <Zap className="w-4 h-4" style={{ color: "#FFC72C", flexShrink: 0 }} />
                  : <AlertCircle className="w-4 h-4" style={{ color: "#f87171", flexShrink: 0 }} />}
                <p>{serverError.msg}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="co-submit-btn">
              {loading ? (
                <><Loader2 className="w-5 h-5 co-spin" /> Placing Order…</>
              ) : payMethod === "cash" ? (
                <><Banknote className="w-5 h-5" /> Place Order · Cash on Delivery <ChevronRight className="w-4 h-4 co-arrow" /></>
              ) : (
                <><CreditCard className="w-5 h-5" /> Pay {formatCurrency(total)} via Paystack <ChevronRight className="w-4 h-4 co-arrow" /></>
              )}
            </button>

          </form>
        </section>

      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root {
    --red:#DA291C; --red2:#b91c1c; --gold:#FFC72C;
    --dark:#0e0700; --card:#1a0e00;
    --border:rgba(255,199,44,0.1); --text:#fff8e7;
    --muted:rgba(255,248,231,0.42); --input-bg:rgba(255,248,231,0.05);
  }

  .co-root { min-height:100vh; background:radial-gradient(ellipse 80% 35% at 50% 0%,rgba(218,41,28,0.15) 0%,transparent 65%),var(--dark); font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--text); padding-bottom:60px; }

  /* State screens */
  .co-state-screen { min-height:100vh; background:var(--dark); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:24px; text-align:center; font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--text); }
  .co-state-icon { width:72px; height:72px; background:rgba(255,199,44,0.08); border:1px solid rgba(255,199,44,0.18); border-radius:20px; display:flex; align-items:center; justify-content:center; color:var(--gold); }
  .co-state-icon-closed { background:rgba(248,113,113,0.1)!important; border-color:rgba(248,113,113,0.25)!important; color:#f87171!important; }
  .co-state-title { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:2px; }
  .co-state-sub { color:var(--muted); font-size:14px; max-width:280px; line-height:1.6; }
  .co-state-btn { background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:14px; padding:12px 26px; border-radius:50px; transition:all 0.2s; }
  .co-state-btn:hover { background:var(--red2); transform:scale(1.03); }

  /* Schedule table */
  .co-schedule { width:100%; max-width:300px; background:rgba(255,248,231,0.04); border:1px solid rgba(255,199,44,0.15); border-radius:14px; padding:14px 18px; display:flex; flex-direction:column; gap:7px; }
  .co-schedule-row { display:flex; justify-content:space-between; font-size:12px; }
  .co-schedule-day { color:var(--muted); font-weight:600; }
  .co-schedule-hrs { color:rgba(255,248,231,0.7); font-weight:700; }
  .co-schedule-today .co-schedule-day { color:var(--gold); }
  .co-schedule-today .co-schedule-hrs { color:var(--gold); }

  /* Header */
  .co-header { position:sticky; top:0; z-index:100; background:rgba(14,7,0,0.95); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); }
  .co-header-inner { max-width:680px; margin:0 auto; padding:13px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .co-header-left { display:flex; align-items:center; gap:10px; }
  .co-header-right { display:flex; align-items:center; gap:8px; }
  .co-back-btn { width:36px; height:36px; flex-shrink:0; background:rgba(255,248,231,0.05); border:1px solid var(--border); border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--muted); cursor:pointer; transition:all 0.2s; }
  .co-back-btn:hover { color:var(--text); border-color:rgba(255,199,44,0.3); }
  .co-brand { display:flex; align-items:center; gap:8px; }
  .co-brand-badge { width:34px; height:34px; background:var(--gold); border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 16px rgba(255,199,44,0.25); }
  .co-title { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:3px; color:var(--text); line-height:1; }
  .co-subtitle { font-size:10px; font-weight:700; color:var(--gold); margin-top:1px; }
  .co-user-pill { background:rgba(255,199,44,0.08); border:1px solid rgba(255,199,44,0.18); border-radius:50px; padding:5px 11px; font-size:11px; font-weight:700; color:var(--muted); max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .co-user-email { display:block; overflow:hidden; text-overflow:ellipsis; }
  .co-logout-btn { width:34px; height:34px; border-radius:10px; background:rgba(218,41,28,0.08); border:1px solid rgba(218,41,28,0.2); display:flex; align-items:center; justify-content:center; color:rgba(218,41,28,0.6); cursor:pointer; transition:all 0.2s; }
  .co-logout-btn:hover { background:rgba(218,41,28,0.2); color:var(--red); border-color:rgba(218,41,28,0.4); }

  /* Body */
  .co-body { max-width:680px; margin:0 auto; padding:24px 16px; display:flex; flex-direction:column; gap:16px; }
  .co-card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:20px; display:flex; flex-direction:column; gap:14px; }
  .co-section-label { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); }

  /* Items */
  .co-items-list { display:flex; flex-direction:column; gap:10px; }
  .co-item-row { display:flex; align-items:center; gap:12px; }
  .co-item-img { width:44px; height:44px; border-radius:10px; flex-shrink:0; overflow:hidden; background:rgba(255,248,231,0.07); display:flex; align-items:center; justify-content:center; font-size:20px; }
  .co-item-img img { width:100%; height:100%; object-fit:cover; }
  .co-item-info { flex:1; min-width:0; }
  .co-item-name { display:block; font-size:13px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .co-item-qty { font-size:11px; color:var(--muted); }
  .co-item-price { font-size:13px; font-weight:800; color:var(--gold); flex-shrink:0; }
  .co-total-row { display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px solid var(--border); font-size:13px; font-weight:700; color:var(--muted); }
  .co-total-amount { font-size:20px; font-weight:900; color:var(--red); }

  /* Payment */
  .co-pay-methods { display:flex; flex-direction:column; gap:10px; }
  .co-pay-option { display:flex; align-items:center; gap:14px; background:rgba(255,248,231,0.03); border:1.5px solid var(--border); border-radius:14px; padding:14px 16px; cursor:pointer; transition:all 0.22s; text-align:left; }
  .co-pay-option:hover { border-color:rgba(255,199,44,0.25); background:rgba(255,199,44,0.04); }
  .co-pay-active { border-color:rgba(255,199,44,0.5)!important; background:rgba(255,199,44,0.06)!important; }
  .co-pay-icon-wrap { width:42px; height:42px; border-radius:11px; flex-shrink:0; background:rgba(255,248,231,0.06); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--muted); transition:all 0.22s; }
  .co-pay-icon-active { background:rgba(255,199,44,0.15)!important; border-color:rgba(255,199,44,0.4)!important; color:var(--gold)!important; }
  .co-pay-text { flex:1; min-width:0; }
  .co-pay-label { display:block; font-size:14px; font-weight:700; color:var(--text); }
  .co-pay-sub { display:block; font-size:11px; color:var(--muted); margin-top:2px; }
  .co-pay-check { color:transparent; transition:color 0.2s; flex-shrink:0; }
  .co-pay-check-active { color:var(--gold); }

  /* Notes */
  .co-note { display:flex; align-items:flex-start; gap:10px; border-radius:12px; padding:12px 14px; font-size:13px; color:var(--text); line-height:1.5; }
  .co-note-gold { background:rgba(255,199,44,0.07); border:1px solid rgba(255,199,44,0.18); }
  .co-note-green { background:rgba(74,222,128,0.07); border:1px solid rgba(74,222,128,0.2); }
  .co-note strong { color:var(--gold); }
  .co-note-green strong { color:#4ade80; }
  .co-note-icon { flex-shrink:0; margin-top:1px; }

  /* Form */
  .co-form { display:flex; flex-direction:column; gap:14px; }
  .co-field { display:flex; flex-direction:column; gap:6px; }
  .co-label { font-size:11px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:var(--muted); }
  .co-req { color:var(--red); }
  .co-input-wrap { display:flex; align-items:center; gap:10px; background:var(--input-bg); border:1.5px solid var(--border); border-radius:12px; padding:0 14px; transition:border-color 0.2s; }
  .co-input-wrap:focus-within { border-color:rgba(255,199,44,0.4); }
  .co-input-error { border-color:rgba(218,41,28,0.5)!important; }
  .co-textarea-wrap { align-items:flex-start; padding-top:12px; padding-bottom:12px; }
  .co-input-icon { width:16px; height:16px; color:var(--muted); flex-shrink:0; }
  .co-input-icon-top { margin-top:2px; }
  .co-input { flex:1; background:none; border:none; outline:none; color:var(--text); font-size:14px; font-weight:500; font-family:'Plus Jakarta Sans',sans-serif; padding:12px 0; }
  .co-textarea { resize:none; padding-top:0; padding-bottom:0; line-height:1.5; }
  .co-input::placeholder { color:var(--muted); }
  .co-error-msg { font-size:11px; font-weight:700; color:#f87171; }

  /* Server error */
  .co-server-error { display:flex; align-items:flex-start; gap:10px; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.25); border-radius:12px; padding:12px 14px; font-size:13px; color:#fca5a5; line-height:1.5; animation:coErrIn 0.3s ease; }
  .co-server-cold { background:rgba(255,199,44,0.07)!important; border-color:rgba(255,199,44,0.25)!important; color:var(--gold)!important; }
  @keyframes coErrIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }

  /* Submit */
  .co-submit-btn { display:flex; align-items:center; justify-content:center; gap:10px; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:900; font-size:15px; padding:16px 28px; border-radius:14px; margin-top:4px; box-shadow:0 6px 24px rgba(218,41,28,0.4); transition:all 0.22s; }
  .co-submit-btn:hover:not(:disabled) { background:var(--red2); transform:scale(1.02); }
  .co-submit-btn:disabled { opacity:0.55; cursor:not-allowed; }
  .co-arrow { opacity:0.65; margin-left:auto; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .co-spin { animation:spin 0.8s linear infinite; }

  @media (max-width:600px) { .co-body { padding:16px 12px; } .co-user-pill { display:none; } }
`;
