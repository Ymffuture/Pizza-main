import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/formatCurrency";
import {
  ArrowLeft, ShoppingCart, Trash2, Plus, Minus,
  ShoppingBag, ChevronRight, Flame,
} from "lucide-react";
import Footer from "../components/Footer";
export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, total, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-empty-screen">
        <style>{styles}</style>
        <div className="cart-empty-icon">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h1 className="cart-empty-title">Your Cart is Empty</h1>
        <p className="cart-empty-sub">Add something delicious from the menu first.</p>
        <button className="cart-empty-btn" onClick={() => navigate("/menu")}>
          ← Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="cart-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="cart-header">
        <div className="cart-header-inner">
          <div className="cart-brand">
            <div className="cart-brand-badge">
              <Flame className="w-5 h-5" style={{ color: "#0e0700" }} />
            </div>
            <div>
              <h1 className="cart-brand-name">KOTABITES</h1>
              <p className="cart-brand-tag">Fresh · Fast · Fire</p>
            </div>
          </div>

          <div className="cart-header-right">
            <button className="cart-back-btn" onClick={() => navigate("/menu")}>
              <ArrowLeft className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <span className="cart-count-pill">
              {count} item{count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      <div className="cart-body">

        {/* ── Items ── */}
        <section className="cart-card">
          <h2 className="cart-section-label">
            <ShoppingBag className="w-4 h-4" /> Your Items
          </h2>

          <div className="cart-items-list">
            {items.map((item, i) => (
              <div key={item.id} className="cart-item" style={{ "--i": i }}>
                {/* Image */}
                <div className="cart-item-img">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} />
                    : <span style={{ fontSize: 22 }}>🍔</span>}
                </div>

                {/* Info */}
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-unit">{formatCurrency(item.price)} each</p>
                </div>

                {/* Qty controls */}
                <div className="cart-qty-wrap">
                  <button
                    className="cart-qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="cart-qty-val">{item.quantity}</span>
                  <button
                    className="cart-qty-btn cart-qty-btn-plus"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal + remove */}
                <div className="cart-item-right">
                  <span className="cart-item-subtotal">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    className="cart-remove-btn"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Summary ── */}
        <section className="cart-card">
          <h2 className="cart-section-label">
            <ShoppingCart className="w-4 h-4" /> Order Summary
          </h2>

          <div className="cart-summary-rows">
            {items.map((item) => (
              <div key={item.id} className="cart-summary-row">
                <span className="cart-summary-name">
                  {item.name}
                  <span className="cart-summary-qty"> ×{item.quantity}</span>
                </span>
                <span className="cart-summary-price">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="cart-total-row">
            <span className="cart-total-label">Total</span>
            <span className="cart-total-amount">{formatCurrency(total)}</span>
          </div>
        </section>

        {/* ── Actions ── */}
        <button className="cart-checkout-btn" onClick={() => navigate("/checkout")}>
          <ShoppingBag className="w-5 h-5" />
          Proceed to Checkout
          <ChevronRight className="w-4 h-4 cart-btn-arrow" />
        </button>

        <button className="cart-clear-btn" onClick={clearCart}>
          <Trash2 className="w-3.5 h-3.5" /> Clear cart
        </button>

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
  }

  /* ── Empty state ── */
  .cart-empty-screen {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 45% at 50% 0%, rgba(218,41,28,0.18) 0%, transparent 65%),
      var(--dark);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; padding: 24px; text-align: center;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
  }
  .cart-empty-icon {
    width: 76px; height: 76px;
    background: rgba(255,199,44,0.07);
    border: 1px solid rgba(255,199,44,0.18);
    border-radius: 22px;
    display: flex; align-items: center; justify-content: center;
    color: var(--gold);
  }
  .cart-empty-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 34px; letter-spacing: 3px;
  }
  .cart-empty-sub { font-size: 14px; color: var(--muted); max-width: 260px; line-height: 1.6; }
  .cart-empty-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px;
    padding: 13px 28px; border-radius: 50px; margin-top: 6px;
    box-shadow: 0 6px 20px rgba(218,41,28,0.4); transition: all 0.2s;
  }
  .cart-empty-btn:hover { background: var(--red2); transform: scale(1.03); }

  /* ── Root ── */
  .cart-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 35% at 50% 0%, rgba(218,41,28,0.15) 0%, transparent 65%),
      var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding-bottom: 60px;
  }

  /* ── Header ── */
  .cart-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(14,7,0,0.95);
    backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 1px solid var(--border);
  }
  .cart-header-inner {
    max-width: 680px; margin: 0 auto;
    padding: 14px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .cart-brand { display: flex; align-items: center; gap: 10px; }
  .cart-brand-badge {
    width: 38px; height: 38px;
    background: var(--gold); border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 0 20px rgba(255,199,44,0.3);
  }
  .cart-brand-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 3px; color: var(--text); line-height: 1;
  }
  .cart-brand-tag {
    font-size: 10px; font-weight: 700; color: var(--gold);
    letter-spacing: 0.16em; text-transform: uppercase; margin-top: 1px;
  }
  .cart-header-right { display: flex; align-items: center; gap: 8px; }
  .cart-back-btn {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,248,231,0.05);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 7px 12px; color: var(--muted); cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700;
    transition: all 0.2s;
  }
  .cart-back-btn:hover { color: var(--text); border-color: rgba(255,199,44,0.3); }
  .cart-count-pill {
    background: var(--gold); color: #0e0700;
    font-weight: 900; font-size: 11px;
    padding: 5px 12px; border-radius: 50px;
    letter-spacing: 0.03em;
  }

  /* ── Body ── */
  .cart-body {
    max-width: 680px; margin: 0 auto;
    padding: 24px 16px; display: flex; flex-direction: column; gap: 16px;
  }

  /* ── Card ── */
  .cart-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px; padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .cart-section-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--gold);
  }

  /* ── Item ── */
  .cart-items-list { display: flex; flex-direction: column; gap: 12px; }
  .cart-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px;
    background: rgba(255,248,231,0.03);
    border: 1px solid var(--border); border-radius: 14px;
    animation: cartItemIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both;
    animation-delay: calc(var(--i) * 60ms);
  }
  @keyframes cartItemIn {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: none; }
  }
  .cart-item-img {
    width: 52px; height: 52px; border-radius: 11px; flex-shrink: 0;
    overflow: hidden; background: rgba(255,248,231,0.07);
    display: flex; align-items: center; justify-content: center;
  }
  .cart-item-img img { width: 100%; height: 100%; object-fit: cover; }
  .cart-item-info { flex: 1; min-width: 0; }
  .cart-item-name {
    font-size: 13px; font-weight: 700; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cart-item-unit { font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* Qty */
  .cart-qty-wrap {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  }
  .cart-qty-btn {
    width: 26px; height: 26px; border-radius: 8px;
    background: rgba(255,248,231,0.07);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .cart-qty-btn:hover { color: var(--text); border-color: rgba(255,199,44,0.3); }
  .cart-qty-btn-plus { background: var(--red); color: white; border-color: var(--red); }
  .cart-qty-btn-plus:hover { background: var(--red2); border-color: var(--red2); color: white; }
  .cart-qty-val {
    font-size: 13px; font-weight: 900; color: var(--text);
    min-width: 18px; text-align: center;
  }

  /* Right side */
  .cart-item-right {
    display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;
  }
  .cart-item-subtotal { font-size: 13px; font-weight: 900; color: var(--gold); }
  .cart-remove-btn {
    color: rgba(218,41,28,0.5); background: none; border: none; cursor: pointer;
    display: flex; align-items: center; transition: color 0.2s;
  }
  .cart-remove-btn:hover { color: var(--red); }

  /* ── Summary ── */
  .cart-summary-rows { display: flex; flex-direction: column; gap: 8px; }
  .cart-summary-row {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 13px; color: var(--muted);
  }
  .cart-summary-name { font-weight: 600; }
  .cart-summary-qty { font-size: 11px; color: var(--muted); }
  .cart-summary-price { font-weight: 700; color: var(--text); }

  .cart-total-row {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 14px; border-top: 1px solid var(--border);
  }
  .cart-total-label {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 2px; color: var(--text);
  }
  .cart-total-amount {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px; letter-spacing: 1px; color: var(--red);
  }

  /* ── CTA ── */
  .cart-checkout-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900; font-size: 16px;
    padding: 17px 28px; border-radius: 16px;
    box-shadow: 0 8px 28px rgba(218,41,28,0.45), 0 0 0 2px rgba(255,199,44,0.15);
    transition: all 0.22s;
  }
  .cart-checkout-btn:hover { background: var(--red2); transform: scale(1.02); }
  .cart-btn-arrow { opacity: 0.65; margin-left: auto; }

  .cart-clear-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 12px; font-weight: 700;
    padding: 8px; transition: color 0.2s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .cart-clear-btn:hover { color: var(--red); }

  @media (max-width: 600px) {
    .cart-body { padding: 16px 12px; }
    .cart-item  { flex-wrap: wrap; }
  }
`;
