import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useOrder from "../hooks/useOrder";
import usePolling from "../hooks/usePolling";
import { formatCurrency } from "../utils/formatCurrency";

const STATUS_CONFIG = {
  pending:   { label: "Pending",          emoji: "⏳", color: "bg-yellow-100 text-yellow-800", step: 1 },
  paid:      { label: "Payment Received", emoji: "✅", color: "bg-blue-100 text-blue-800",    step: 2 },
  preparing: { label: "Preparing",        emoji: "👨‍🍳", color: "bg-orange-100 text-orange-800", step: 3 },
  ready:     { label: "Ready for Pickup", emoji: "📦", color: "bg-purple-100 text-purple-800", step: 4 },
  delivered: { label: "Delivered",        emoji: "🎉", color: "bg-green-100 text-green-800",   step: 5 },
  cancelled: { label: "Cancelled",        emoji: "❌", color: "bg-red-100 text-red-800",        step: 0 },
};

const STEPS = [
  { key: "pending",   label: "Order Placed" },
  { key: "paid",      label: "Payment" },
  { key: "preparing", label: "Preparing" },
  { key: "ready",     label: "Ready" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchOrder } = useOrder();
  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    try {
      const data = await fetchOrder(id);
      setOrder(data);
      setLastUpdated(new Date());
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err.message ||
          "Could not load order."
      );
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Poll every 5 seconds
  usePolling(load, 5000);

  const config = order ? STATUS_CONFIG[order.status] ?? STATUS_CONFIG["pending"] : null;
  const currentStep = config?.step ?? 1;

  if (loadError && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DA291C] to-[#FFC72C] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-black text-white">Order not found</h2>
        <p className="text-yellow-200 max-w-sm">{loadError}</p>
        <button
          onClick={load}
          className="bg-[#FFC72C] text-[#DA291C] font-black px-8 py-3 rounded-full hover:bg-yellow-300 transition"
        >
          Retry
        </button>
        <button
          onClick={() => navigate("/")}
          className="text-white/80 hover:text-white underline text-sm transition"
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#DA291C] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#FFC72C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white font-bold text-lg">Loading your order…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DA291C] to-[#FFC72C] pb-12">
      {/* Header */}
      <div className="bg-[#DA291C] shadow-lg">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-white hover:text-yellow-300 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-white italic">TRACK ORDER</h1>
            <p className="text-yellow-300 text-xs font-medium">
              #{typeof id === "string" ? id.slice(-8).toUpperCase() : id}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-6xl mb-3">{config.emoji}</div>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-black ${config.color}`}>
            {config.label}
          </span>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-3">
              Last updated: {lastUpdated.toLocaleTimeString()} · auto-refreshing every 5s
            </p>
          )}
        </div>

        {/* Progress Steps (not shown for cancelled) */}
        {order.status !== "cancelled" && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h2 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Order Progress
            </h2>
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 rounded-full" />
              <div
                className="absolute top-4 left-4 h-1 bg-[#DA291C] rounded-full transition-all duration-700"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step, i) => {
                const stepNum = i + 1;
                const done = stepNum <= currentStep;
                return (
                  <div key={step.key} className="relative flex flex-col items-center gap-2 z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 ${
                        done
                          ? "bg-[#DA291C] text-white shadow-md shadow-red-300"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {done ? "✓" : stepNum}
                    </div>
                    <span className="text-xs text-gray-600 font-medium text-center w-14 leading-tight">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <h2 className="font-black text-gray-900 text-lg">📋 Order Details</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wide">Total</p>
              <p className="font-black text-[#DA291C] text-lg">
                {formatCurrency(order.total_amount ?? 0)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wide">Order ID</p>
              <p className="font-bold text-gray-700 text-sm truncate">
                {typeof order.id === "string" ? order.id.slice(-8).toUpperCase() : order.id}
              </p>
            </div>
          </div>

          {order.delivery_address && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wide mb-1">
                Delivery Address
              </p>
              <p className="text-gray-700 text-sm">{order.delivery_address}</p>
            </div>
          )}

          {/* Items */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wide mb-2">Items</p>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-700">
                    <span>
                      {item.name ?? item.menu_item_id} ×{item.quantity}
                    </span>
                    {item.price != null && (
                      <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cancelled message */}
        {order.status === "cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-red-700 font-bold">This order has been cancelled.</p>
            <button
              onClick={() => navigate("/menu")}
              className="mt-3 bg-[#DA291C] text-white font-black px-6 py-2 rounded-full hover:bg-red-700 transition"
            >
              Order Again
            </button>
          </div>
        )}

        {/* Delivered message */}
        {order.status === "delivered" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <p className="text-green-700 font-bold text-lg">🎉 Enjoy your meal!</p>
            <button
              onClick={() => navigate("/menu")}
              className="mt-3 bg-[#DA291C] text-white font-black px-6 py-2 rounded-full hover:bg-red-700 transition"
            >
              Order Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
