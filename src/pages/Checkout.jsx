import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrderContext } from "../context/OrderContext";
import useOrder from "../hooks/useOrder";
import usePayment from "../hooks/usePayment";
import { formatCurrency } from "../utils/formatCurrency";
import { toast } from "react-toastify";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { setOrder } = useOrderContext();
  const { submitOrder, loading } = useOrder();
  const { startPayment } = usePayment();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    delivery_address: "",
  });
  const [errors, setErrors] = useState({});

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DA291C] to-[#FFC72C] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-7xl">🛒</div>
        <h2 className="text-2xl font-black text-white">Your cart is empty</h2>
        <button
          onClick={() => navigate("/menu")}
          className="bg-[#FFC72C] text-[#DA291C] font-black px-8 py-3 rounded-full text-lg hover:bg-yellow-300 transition"
        >
          ← Back to Menu
        </button>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          menu_item_id: i.id,
          quantity: i.quantity,
        })),
        total_amount: total,
      };

      const order = await submitOrder(payload);
      setOrder(order);
      clearCart();

      // Try to initialize payment; if endpoint doesn't exist yet, navigate to success
      try {
        await startPayment(order.id);
      } catch {
        toast.info("Order placed! Redirecting…");
        navigate(`/order/${order.id}`);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message ||
        "Failed to place order.";
      toast.error(`Order failed: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DA291C] to-[#FFC72C] pb-12">
      {/* Header */}
      <div className="bg-[#DA291C] shadow-lg">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/cart")}
            className="text-white hover:text-yellow-300 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-black text-white italic">CHECKOUT</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="font-black text-gray-900 text-lg mb-3">📦 Your Order</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-[#DA291C] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-black text-gray-900">Total</span>
            <span className="font-black text-[#DA291C] text-xl">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Delivery Details Form */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="font-black text-gray-900 text-lg mb-4">🚀 Your Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange("name")}
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#DA291C] transition ${
                  errors.name ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                placeholder="082 123 4567"
                value={form.phone}
                onChange={handleChange("phone")}
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#DA291C] transition ${
                  errors.phone ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange("email")}
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#DA291C] transition ${
                  errors.email ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Delivery Address <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                placeholder="123 Main Street, Johannesburg…"
                value={form.delivery_address}
                onChange={handleChange("delivery_address")}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#DA291C] transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#DA291C] hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-xl shadow-xl transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Placing Order…
                </>
              ) : (
                <>💳 Pay {formatCurrency(total)}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
