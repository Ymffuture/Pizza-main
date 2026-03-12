import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/formatCurrency";

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, total, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DA291C] to-[#FFC72C] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-8xl">🛒</div>
        <h1 className="text-3xl font-black text-white">Your cart is empty</h1>
        <p className="text-yellow-100 text-lg">Add some delicious items from the menu!</p>
        <button
          onClick={() => navigate("/menu")}
          className="bg-[#FFC72C] text-[#DA291C] font-black px-8 py-3 rounded-full text-lg hover:bg-yellow-300 transition shadow-xl"
        >
          ← Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DA291C] to-[#FFC72C] pb-12">
      {/* Header */}
      <div className="bg-[#DA291C] shadow-lg">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/menu")}
              className="text-white hover:text-yellow-300 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-black text-white italic">YOUR CART</h1>
          </div>
          <span className="bg-[#FFC72C] text-[#DA291C] font-black px-3 py-1 rounded-full text-sm">
            {count} item{count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        {/* Cart Items */}
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4"
          >
            {/* Image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🍔</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
              <p className="text-[#DA291C] font-black text-lg">
                {formatCurrency(item.price)}
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition"
              >
                −
              </button>
              <span className="w-6 text-center font-black text-gray-900">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-[#DA291C] hover:bg-red-700 flex items-center justify-center font-bold text-white transition"
              >
                +
              </button>
            </div>

            {/* Subtotal + Remove */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="font-black text-gray-900 text-sm">
                {formatCurrency(item.price * item.quantity)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-400 hover:text-red-600 transition"
                aria-label="Remove item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
          <h2 className="font-black text-gray-900 text-lg">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-black text-gray-900 text-xl">Total</span>
            <span className="font-black text-[#DA291C] text-2xl">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => navigate("/checkout")}
          className="w-full bg-[#DA291C] hover:bg-red-700 text-white font-black py-4 rounded-2xl text-xl shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
        >
          Proceed to Checkout →
        </button>

        <button
          onClick={clearCart}
          className="w-full text-white/70 hover:text-white text-sm font-medium py-2 transition"
        >
          Clear cart
        </button>
      </div>
    </div>
  );
}
