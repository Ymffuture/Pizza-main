import { useState } from "react";
import { Copy, CheckCircle2, Clock, ChefHat, Package, Truck, XCircle } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

const STATUS_CFG = {
  pending:   { label: "Order Placed",     color: "#FFC72C", Icon: Clock        },
  paid:      { label: "Payment Received", color: "#60a5fa", Icon: CheckCircle2 },
  preparing: { label: "Being Prepared",   color: "#fb923c", Icon: ChefHat      },
  ready:     { label: "Ready for Pickup", color: "#a78bfa", Icon: Package      },
  delivered: { label: "Delivered 🎉",     color: "#4ade80", Icon: Truck        },
  cancelled: { label: "Cancelled",        color: "#f87171", Icon: XCircle      },
};

export default function OrderTracker({ order }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  // ✅ FIX: id comes from Beanie as a PydanticObjectId serialised to string
  // OrderResponse.serialize_id converts it to str — always use order.id
  const fullId  = String(order.id ?? "");
  const shortId = fullId.slice(-8).toUpperCase();

  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
  const StatusIcon = cfg.Icon;

  const copyId = () => {
    navigator.clipboard.writeText(fullId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="ot-root">
      <style>{styles}</style>

      {/* Status badge */}
      <div className="ot-status-row">
        <div className="ot-status-icon" style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}40` }}>
          <StatusIcon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>
        <span className="ot-status-label" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      {/* ✅ FIX: Show FULL order ID with a copy button.
          Old code only showed the last 8 chars as the "Order ID" — users copy
          that short code, paste it into the track form on Home, and get a 404
          because the backend needs the full 24-char MongoDB ObjectId.
          Now we show both: the full copyable ID and the short display code. */}
      <div className="ot-id-box">
        <div className="ot-id-inner">
          <span className="ot-id-label">Order ID</span>
          <div className="ot-id-row">
            <code className="ot-id-full">{fullId || "—"}</code>
            <button className="ot-copy-btn" onClick={copyId} title="Copy full order ID">
              {copied ? <CheckCircle2 className="w-4 h-4" style={{ color: "#4ade80" }} /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="ot-id-short">Short code: <strong>{shortId}</strong></span>
        </div>
      </div>

      {/* Details */}
      <div className="ot-details">
        <div className="ot-detail-row">
          <span className="ot-detail-key">Total</span>
          <span className="ot-detail-val ot-detail-total">{formatCurrency(order.total_amount ?? 0)}</span>
        </div>

        {order.payment_method && (
          <div className="ot-detail-row">
            <span className="ot-detail-key">Payment</span>
            <span className="ot-detail-val">{order.payment_method === "cash" ? "Cash on Delivery" : "Paystack"}</span>
          </div>
        )}

        {order.phone && (
          <div className="ot-detail-row">
            <span className="ot-detail-key">Phone</span>
            <span className="ot-detail-val">{order.phone}</span>
          </div>
        )}

        {/* ✅ FIX: was order.customer_name (doesn't exist) and order.user_id
            OrderResponse does not include user_id — remove it entirely */}
        {order.delivery_address && (
          <div className="ot-detail-row ot-detail-address">
            <span className="ot-detail-key">Address</span>
            <span className="ot-detail-val">{order.delivery_address}</span>
          </div>
        )}
      </div>

      {/* Items */}
      {order.items?.length > 0 && (
        <div className="ot-items">
          <span className="ot-items-label">Items</span>
          <ul className="ot-items-list">
            {order.items.map((item, i) => (
              <li key={i} className="ot-item-row">
                <span className="ot-item-name">
                  {item.name} <span className="ot-item-qty">×{item.quantity}</span>
                </span>
                {item.price != null && (
                  <span className="ot-item-price">{formatCurrency(item.price * item.quantity)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const styles = `
  .ot-root {
    background: #1a0e00; border: 1px solid rgba(255,199,44,0.12);
    border-radius: 18px; padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #fff8e7;
  }
  .ot-status-row { display:flex; align-items:center; gap:10px; }
  .ot-status-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .ot-status-label { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:1.5px; }

  .ot-id-box { background:rgba(255,248,231,0.04); border:1px solid rgba(255,199,44,0.15); border-radius:12px; padding:12px 14px; }
  .ot-id-inner { display:flex; flex-direction:column; gap:4px; }
  .ot-id-label { font-size:9px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,248,231,0.4); }
  .ot-id-row { display:flex; align-items:center; gap:8px; }
  .ot-id-full { font-family:monospace; font-size:11px; color:#FFC72C; word-break:break-all; flex:1; }
  .ot-copy-btn { background:rgba(255,199,44,0.1); border:1px solid rgba(255,199,44,0.2); border-radius:8px; padding:4px 6px; cursor:pointer; color:rgba(255,248,231,0.6); flex-shrink:0; display:flex; align-items:center; transition:all 0.2s; }
  .ot-copy-btn:hover { background:rgba(255,199,44,0.2); color:#fff8e7; }
  .ot-id-short { font-size:11px; color:rgba(255,248,231,0.4); }
  .ot-id-short strong { color:rgba(255,248,231,0.7); }

  .ot-details { display:flex; flex-direction:column; gap:8px; }
  .ot-detail-row { display:flex; justify-content:space-between; align-items:baseline; font-size:13px; }
  .ot-detail-address { align-items:flex-start; }
  .ot-detail-key { font-weight:600; color:rgba(255,248,231,0.45); }
  .ot-detail-val { font-weight:700; color:#fff8e7; text-align:right; max-width:65%; }
  .ot-detail-total { font-family:'Bebas Neue',sans-serif; font-size:20px; color:#DA291C; }

  .ot-items { background:rgba(255,248,231,0.03); border:1px solid rgba(255,199,44,0.1); border-radius:12px; padding:12px 14px; }
  .ot-items-label { font-size:9px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,248,231,0.4); display:block; margin-bottom:8px; }
  .ot-items-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:7px; }
  .ot-item-row { display:flex; justify-content:space-between; align-items:baseline; }
  .ot-item-name { font-size:13px; font-weight:600; color:#fff8e7; }
  .ot-item-qty { font-size:11px; color:rgba(255,248,231,0.45); }
  .ot-item-price { font-size:13px; font-weight:800; color:#FFC72C; }
`;
