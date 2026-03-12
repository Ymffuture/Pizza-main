import { useEffect, useState, useCallback } from "react";
import { getMenu } from "../api/menu.api";
import MenuCard from "../components/MenuCard";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify";

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wakingUp, setWakingUp] = useState(false);
  const navigate = useNavigate();
  const { addItem, count } = useCart();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const wakeTimer = setTimeout(() => setWakingUp(true), 4000);
    try {
      const res = await getMenu();
      const raw = res.data;
      const items = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.menu)
        ? raw.menu
        : [];
      setMenu(items);
    } catch (err) {
      const msg =
        err.code === "ECONNABORTED"
          ? "Server is taking too long to respond. It may be waking up — please try again."
          : err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err.message ||
            "Failed to load menu.";
      setError(msg);
    } finally {
      clearTimeout(wakeTimer);
      setWakingUp(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddToCart = (item) => {
    addItem(item);
    toast.success(`🛒 ${item.name} added to cart!`, {
      position: "bottom-right",
      autoClose: 1800,
      hideProgressBar: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#DA291C] flex flex-col items-center justify-center gap-4">
        <Loader />
        {wakingUp && (
          <div className="text-center px-6">
            <p className="text-yellow-300 font-bold text-lg animate-pulse">
              ⏳ Refresh the server…
            </p>
            <p className="text-white/70 text-sm mt-1">
              Due to high valume it might take a few minute— usually ready in 30–60 seconds.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#DA291C] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-black text-white">Couldn't load the menu</h2>
        <p className="text-yellow-200 max-w-sm">{error}</p>
        <button
          onClick={load}
          className="bg-[#FFC72C] text-[#DA291C] font-black px-8 py-3 rounded-full text-lg hover:bg-yellow-300 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="min-h-screen bg-[#DA291C] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-6xl">🍽️</div>
        <h2 className="text-2xl font-black text-white">No menu items yet</h2>
        <p className="text-yellow-200">Check back soon!</p>
        <button
          onClick={load}
          className="bg-[#FFC72C] text-[#DA291C] font-black px-8 py-3 rounded-full text-lg hover:bg-yellow-300 transition"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DA291C] via-[#DA291C] to-[#FFC72C] pb-24">
      {/* Header */}
      <div className="bg-[#DA291C] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FFC72C] rounded-full flex items-center justify-center shadow-inner">
              <span className="text-[#DA291C] text-2xl font-black">K</span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight italic">
                OUR MENU
              </h1>
              <p className="text-[#FFC72C] font-bold text-sm tracking-widest uppercase">
                Fresh & Fast
              </p>
            </div>
          </div>
          {/* Cart count badge */}
          {count > 0 && (
            <button
              onClick={() => navigate("/cart")}
              className="relative bg-[#FFC72C] text-[#DA291C] font-black px-5 py-2 rounded-full text-sm hover:bg-yellow-300 transition flex items-center gap-2"
            >
              🛒 View Cart
              <span className="bg-[#DA291C] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                {count}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.map((item, index) => (
            <div
              key={item.id ?? index}
              className="group relative bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFC72C] via-[#DA291C] to-[#FFC72C]" />
              <MenuCard item={item} onSelect={handleAddToCart} />
            </div>
          ))}
        </div>
      </div>

      {/* FAB – Cart */}
      <button
        onClick={() => navigate("/cart")}
        className="fixed bottom-6 right-6 bg-[#DA291C] hover:bg-[#b91c1c] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50 border-4 border-[#FFC72C]"
        aria-label="View cart"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-3 -right-3 bg-[#FFC72C] text-[#DA291C] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
