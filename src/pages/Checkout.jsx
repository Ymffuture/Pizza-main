import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrderContext } from "../context/OrderContext";
import useOrder from "../hooks/useOrder";
import usePayment from "../hooks/usePayment";
import { useToast } from "../components/Toast";
import { formatCurrency } from "../utils/formatCurrency";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  User,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const PAYMENT_METHODS = [
  {
    id: "cash",
    label: "Cash on Delivery",
    sub: "Pay when your order arrives",
    Icon: Banknote,
  },
  {
    id: "paystack",
    label: "Pay Online",
    sub: "Card, EFT & Instant EFT via Paystack",
    Icon: CreditCard,
  },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { setOrder } = useOrderContext();
  const { submitOrder, loading } = useOrder();
  const { startPayment } = usePayment();
  const toast = useToast();

  const [payMethod, setPayMethod] = useState("cash");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    delivery_address: "",
  });
  const [errors, setErrors] = useState({});

  /* ── Guard: empty cart ── */
  if (items.length === 0) {
    return (
      <div className="co-state-screen">
        <div className="co-state-icon">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="co-state-title">Cart is Empty</h2>
        <p className="co-state-sub">Add some items before checking out.</p>
        <button className="co-state-btn" onClick={() => navigate("/menu")}>
          ← Browse Menu
        </button>
        <style>{styles}</style>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.delivery_address.trim()) e.delivery_address = "Delivery address is required";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      const payload = {
        ...form,
        payment_method: payMethod,
        items: items.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
        total_amount: total,
      };

      const order = await submitOrder(payload);
      setOrder(order);
      clearCart();

      if (payMethod === "paystack") {
        try {
          await startPayment(order.id);
        } catch {
          toast.show({ type: "info", title: "Order placed", message: "Redirecting to order tracker…" });
          navigate(`/order/${order.id}`);
        }
      } else {
        // Cash on delivery
        toast.show({
          type: "success",
          title: "Order confirmed!",
          message: "We'll collect payment on delivery 💵",
        });
        navigate(`/order/${order.id}`);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message ||
        "Failed to place order.";
      toast.show({ type: "error", title: "Order failed", message: msg });
    }
  };

  return (
    <div className="co-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="co-header">
        <div className="co-header-inner">
          <button className="co-back-btn" onClick={() => navigate("/cart")}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="co-title">CHECKOUT</h1>
            <p className="co-subtitle">{items.length} item{items.length !== 1 ? "s" : ""} · {formatCurrency(total)}</p>
          </div>
        </div>
      </header>

      <div className="co-body">

        {/* ── Order summary ── */}
        <section className="co-card">
          <h2 className="co-section-label">
            <ShoppingBag className="w-4 h-4" /> Your Order
          </h2>
          <div className="co-items-list">
            {items.map((item) => (
              <div key={item.id} className="co-item-row">
                <div className="co-item-img">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} />
                    : <span>🍔</span>}
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

        {/* ── Payment method ── */}
        <section className="co-card">
          <h2 className="co-section-label">
            <CreditCard className="w-4 h-4" /> Payment Method
          </h2>
          <div className="co-pay-methods">
            {PAYMENT_METHODS.map(({ id, label, sub, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPayMethod(id)}
                className={`co-pay-option${payMethod === id ? " co-pay-active" : ""}`}
              >
                <div className={`co-pay-icon-wrap${payMethod === id ? " co-pay-icon-active" : ""}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="co-pay-text">
                  <span className="co-pay-label">{label}</span>
                  <span className="co-pay-sub">{sub}</span>
                </div>
                <div className={`co-pay-check${payMethod === id ? " co-pay-check-active" : ""}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </button>
            ))}
          </div>

          {payMethod === "cash" && (
            <div className="co-cash-note">
              <Banknote className="w-4 h-4 co-cash-icon" />
              <p>Please have <strong>{formatCurrency(total)}</strong> ready when your order arrives.</p>
            </div>
          )}
        </section>

        {/* ── Details form ── */}
        <section className="co-card">
          <h2 className="co-section-label">
            <User className="w-4 h-4" /> Your Details
          </h2>

          <form onSubmit={handleSubmit} className="co-form">

            {/* Name */}
            <div className="co-field">
              <label className="co-label">Full Name <span className="co-req">*</span></label>
              <div className={`co-input-wrap${errors.name ? " co-input-error" : ""}`}>
                <User className="co-input-icon" />
                <input
                  type="text"
                  className="co-input"
                  placeholder="Kgomotso Nkosi"
                  value={form.name}
                  onChange={handleChange("name")}
                />
              </div>
              {errors.name && <p className="co-error-msg">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div className="co-field">
              <label className="co-label">Phone Number <span className="co-req">*</span></label>
              <div className={`co-input-wrap${errors.phone ? " co-input-error" : ""}`}>
                <Phone className="co-input-icon" />
                <input
                  type="tel"
                  className="co-input"
                  placeholder="082 123 4567"
                  value={form.phone}
                  onChange={handleChange("phone")}
                />
              </div>
              {errors.phone && <p className="co-error-msg">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="co-field">
              <label className="co-label">Email <span className="co-req">*</span></label>
              <div className={`co-input-wrap${errors.email ? " co-input-error" : ""}`}>
                <Mail className="co-input-icon" />
                <input
                  type="email"
                  className="co-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                />
              </div>
              {errors.email && <p className="co-error-msg">{errors.email}</p>}
            </div>

            {/* Address */}
            <div className="co-field">
              <label className="co-label">
                Delivery Address <span className="co-req">*</span>
              </label>
              <div className={`co-input-wrap co-textarea-wrap${errors.delivery_address ? " co-input-error" : ""}`}>
                <MapPin className="co-input-icon co-input-icon-top" />
                <textarea
                  className="co-input co-textarea"
                  placeholder="123 Main Street, Johannesburg…"
                  value={form.delivery_address}
                  onChange={handleChange("delivery_address")}
                  rows={3}
                />
              </div>
              {errors.delivery_address && <p className="co-error-msg">{errors.delivery_address}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="co-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 co-spin" />
                  Placing Order…
                </>
              ) : payMethod === "cash" ? (
                <>
                  <Banknote className="w-5 h-5" />
                  Place Order · Cash on Delivery
                  <ChevronRight className="w-4 h-4 co-arrow" />
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay {formatCurrency(total)} Online
                  <ChevronRight className="w-4 h-4 co-arrow" />
                </>
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
    --red:    #DA291C;
    --red2:   #b91c1c;
    --gold:   #FFC72C;
    --dark:   #0e0700;
    --card:   #1a0e00;
    --border: rgba(255,199,44,0.1);
    --text:   #fff8e7;
    --muted:  rgba(255,248,231,0.42);
    --input-bg: rgba(255,248,231,0.05);
  }

  /* Root */
  .co-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 35% at 50% 0%, rgba(218,41,28,0.15) 0%, transparent 65%),
      var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding-bottom: 60px;
  }

  /* State screen */
  .co-state-screen {
    min-height: 100vh; background: var(--dark);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; padding: 24px; text-align: center;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
  }
  .co-state-icon {
    width: 72px; height: 72px;
    background: rgba(255,199,44,0.08);
    border: 1px solid rgba(255,199,44,0.18);
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    color: var(--gold);
  }
  .co-state-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px; letter-spacing: 2px;
  }
  .co-state-sub { color: var(--muted); font-size: 14px; }
  .co-state-btn {
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 14px;
    padding: 12px 26px; border-radius: 50px;
    transition: background 0.2s;
  }
  .co-state-btn:hover { background: var(--red2); }

  /* Header */
  .co-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(14,7,0,0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .co-header-inner {
    max-width: 680px; margin: 0 auto;
    padding: 14px 20px;
    display: flex; align-items: center; gap: 14px;
  }
  .co-back-btn {
    width: 38px; height: 38px; flex-shrink: 0;
    background: rgba(255,248,231,0.05);
    border: 1px solid var(--border); border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .co-back-btn:hover { color: var(--text); border-color: rgba(255,199,44,0.3); }
  .co-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 3px;
    color: var(--text); line-height: 1;
  }
  .co-subtitle { font-size: 11px; font-weight: 700; color: var(--gold); margin-top: 1px; }

  /* Body */
  .co-body {
    max-width: 680px; margin: 0 auto;
    padding: 24px 16px;
    display: flex; flex-direction: column; gap: 16px;
  }

  /* Card */
  .co-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
  }

  /* Section label */
  .co-section-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--gold);
  }

  /* Order items */
  .co-items-list { display: flex; flex-direction: column; gap: 10px; }
  .co-item-row {
    display: flex; align-items: center; gap: 12px;
  }
  .co-item-img {
    width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
    overflow: hidden; background: rgba(255,248,231,0.07);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }
  .co-item-img img { width: 100%; height: 100%; object-fit: cover; }
  .co-item-info { flex: 1; min-width: 0; }
  .co-item-name { display: block; font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .co-item-qty { font-size: 11px; color: var(--muted); }
  .co-item-price { font-size: 13px; font-weight: 800; color: var(--gold); flex-shrink: 0; }
  .co-total-row {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    font-size: 13px; font-weight: 700; color: var(--muted);
  }
  .co-total-amount { font-size: 20px; font-weight: 900; color: var(--red); }

  /* Payment methods */
  .co-pay-methods { display: flex; flex-direction: column; gap: 10px; }
  .co-pay-option {
    display: flex; align-items: center; gap: 14px;
    background: rgba(255,248,231,0.03);
    border: 1.5px solid var(--border);
    border-radius: 14px; padding: 14px 16px;
    cursor: pointer; transition: all 0.22s;
    text-align: left;
  }
  .co-pay-option:hover { border-color: rgba(255,199,44,0.25); background: rgba(255,199,44,0.04); }
  .co-pay-active {
    border-color: rgba(255,199,44,0.5) !important;
    background: rgba(255,199,44,0.06) !important;
  }
  .co-pay-icon-wrap {
    width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
    background: rgba(255,248,231,0.06);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); transition: all 0.22s;
  }
  .co-pay-icon-active {
    background: rgba(255,199,44,0.15) !important;
    border-color: rgba(255,199,44,0.4) !important;
    color: var(--gold) !important;
  }
  .co-pay-text { flex: 1; min-width: 0; }
  .co-pay-label { display: block; font-size: 14px; font-weight: 700; color: var(--text); }
  .co-pay-sub   { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }
  .co-pay-check { color: transparent; transition: color 0.2s; flex-shrink: 0; }
  .co-pay-check-active { color: var(--gold); }

  /* Cash note */
  .co-cash-note {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(255,199,44,0.07);
    border: 1px solid rgba(255,199,44,0.18);
    border-radius: 12px; padding: 12px 14px;
    font-size: 13px; color: var(--text); line-height: 1.5;
  }
  .co-cash-icon { color: var(--gold); flex-shrink: 0; margin-top: 1px; }
  .co-cash-note strong { color: var(--gold); }

  /* Form */
  .co-form { display: flex; flex-direction: column; gap: 14px; }
  .co-field { display: flex; flex-direction: column; gap: 6px; }
  .co-label { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .co-req { color: var(--red); }
  .co-input-wrap {
    display: flex; align-items: center; gap: 10px;
    background: var(--input-bg);
    border: 1.5px solid var(--border);
    border-radius: 12px; padding: 0 14px;
    transition: border-color 0.2s;
  }
  .co-input-wrap:focus-within { border-color: rgba(255,199,44,0.4); }
  .co-input-error { border-color: rgba(218,41,28,0.5) !important; }
  .co-textarea-wrap { align-items: flex-start; padding-top: 12px; padding-bottom: 12px; }
  .co-input-icon { width: 16px; height: 16px; color: var(--muted); flex-shrink: 0; }
  .co-input-icon-top { margin-top: 2px; }
  .co-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 12px 0;
  }
  .co-textarea { resize: none; padding-top: 0; padding-bottom: 0; line-height: 1.5; }
  .co-input::placeholder { color: var(--muted); }
  .co-error-msg { font-size: 11px; font-weight: 700; color: #f87171; }

  /* Submit */
  .co-submit-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900; font-size: 15px;
    padding: 16px 28px; border-radius: 14px;
    margin-top: 6px;
    box-shadow: 0 6px 24px rgba(218,41,28,0.4);
    transition: all 0.22s;
  }
  .co-submit-btn:hover:not(:disabled) { background: var(--red2); transform: scale(1.02); }
  .co-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .co-arrow { opacity: 0.65; margin-left: auto; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .co-spin { animation: spin 0.8s linear infinite; }

  @media (max-width: 600px) {
    .co-body { padding: 16px 12px; }
  }
`;
