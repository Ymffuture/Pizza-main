import { useNavigate } from "react-router-dom";
import { CheckCircle2, Flame, ShoppingBag, ArrowRight } from "lucide-react";
import { useOrderContext } from "../context/OrderContext";

export default function Success() {
  const navigate = useNavigate();
  const { order } = useOrderContext();
  const orderId = order?.id ? String(order.id) : null;

  return (
    <div className="suc-root">
      <style>{styles}</style>

      {/* Animated rings */}
      <div className="suc-rings">
        <div className="suc-ring suc-ring-1" />
        <div className="suc-ring suc-ring-2" />
        <div className="suc-ring suc-ring-3" />
      </div>

      <div className="suc-card">
        <div className="suc-brand">
          <div className="suc-brand-badge">
            <Flame className="w-5 h-5" style={{ color: "#0e0700" }} />
          </div>
          <span className="suc-brand-name">KOTABITES</span>
        </div>

        <div className="suc-icon-wrap">
          <CheckCircle2 className="suc-check" />
        </div>

        <h1 className="suc-title">Payment Successful!</h1>
        <p className="suc-sub">Your order has been placed and is being processed.</p>

        <div className="suc-divider" />

        <div className="suc-actions">
          {orderId && (
            <button className="suc-primary-btn" onClick={() => navigate(`/order/${orderId}`)}>
              <ShoppingBag className="w-4 h-4" />
              Track My Order
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button className="suc-secondary-btn" onClick={() => navigate("/menu")}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root {
    --red:#DA291C; --gold:#FFC72C; --dark:#0e0700; --card:#1a0e00;
    --border:rgba(255,199,44,0.12); --text:#fff8e7; --muted:rgba(255,248,231,0.42);
  }

  .suc-root {
    min-height:100vh;
    background:
      radial-gradient(ellipse 70% 50% at 50% 0%, rgba(74,222,128,0.12) 0%, transparent 65%),
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(218,41,28,0.1) 0%, transparent 60%),
      var(--dark);
    display:flex; align-items:center; justify-content:center;
    padding:24px 16px; position:relative; overflow:hidden;
    font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--text);
  }

  /* Animated rings */
  .suc-rings { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
  .suc-ring { position:absolute; border-radius:50%; border:1px solid rgba(74,222,128,0.12); animation:sucRingPulse 3s ease-out infinite; }
  .suc-ring-1 { width:300px; height:300px; animation-delay:0s; }
  .suc-ring-2 { width:500px; height:500px; animation-delay:0.6s; }
  .suc-ring-3 { width:700px; height:700px; animation-delay:1.2s; }
  @keyframes sucRingPulse { 0%{opacity:0;transform:scale(0.8)} 40%{opacity:1} 100%{opacity:0;transform:scale(1.1)} }

  /* Card */
  .suc-card {
    position:relative; z-index:1;
    width:100%; max-width:420px;
    background:var(--card); border:1px solid var(--border);
    border-radius:24px; padding:40px 32px;
    box-shadow:0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(74,222,128,0.08);
    display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center;
    animation:sucCardIn 0.5s cubic-bezier(0.34,1.3,0.64,1) both;
  }
  @keyframes sucCardIn { from{opacity:0;transform:translateY(24px) scale(0.95)} to{opacity:1;transform:none} }

  .suc-brand { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .suc-brand-badge { width:32px; height:32px; background:var(--gold); border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px rgba(255,199,44,0.3); }
  .suc-brand-name { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:3px; color:var(--text); }

  .suc-icon-wrap { width:72px; height:72px; border-radius:20px; background:rgba(74,222,128,0.12); border:1px solid rgba(74,222,128,0.25); display:flex; align-items:center; justify-content:center; }
  .suc-check { width:36px; height:36px; color:#4ade80; animation:sucCheckPop 0.6s cubic-bezier(0.34,1.5,0.64,1) 0.2s both; }
  @keyframes sucCheckPop { from{transform:scale(0) rotate(-15deg)} to{transform:scale(1) rotate(0)} }

  .suc-title { font-family:'Bebas Neue',sans-serif; font-size:32px; letter-spacing:2px; color:var(--text); line-height:1; }
  .suc-sub { font-size:14px; color:var(--muted); line-height:1.6; max-width:280px; }
  .suc-divider { width:100%; height:1px; background:var(--border); }

  .suc-actions { width:100%; display:flex; flex-direction:column; gap:10px; }
  .suc-primary-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; background:#4ade80; color:#0e0700; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:900; font-size:14px; padding:14px; border-radius:14px; box-shadow:0 4px 20px rgba(74,222,128,0.25); transition:all 0.2s; }
  .suc-primary-btn:hover { background:#22c55e; transform:scale(1.02); }
  .suc-secondary-btn { width:100%; background:transparent; color:var(--muted); border:1px solid var(--border); cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:13px; padding:12px; border-radius:12px; transition:all 0.2s; }
  .suc-secondary-btn:hover { color:var(--text); border-color:rgba(255,199,44,0.3); }

  @media (max-width:480px) { .suc-card { padding:28px 20px; } }
`;
