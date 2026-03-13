import { useEffect, useState, useCallback } from "react";
import { getMenu } from "../api/menu.api";
import MenuCard from "../components/MenuCard";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Custom Icons (Heroicons-style SVG components)
const Icons = {
  Cart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Exclamation: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Refresh: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Flame: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11zm0-2c-4.97 0-9-4.03-9-9 0-2.5 1.02-4.768 2.672-6.404L12 13l6.328-8.404C19.98 6.232 21 8.5 21 11c0 4.97-4.03 9-9 9z" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Utensils: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  Plus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Close: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

// Custom Toast System
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

const ToastContainer = ({ toasts, onRemove }) => {
  const getStyles = (type) => {
    switch(type) {
      case "success": return "bg-[#DA291C] text-white border-[#FFC72C]";
      case "error": return "bg-red-600 text-white border-red-400";
      case "warning": return "bg-[#FFC72C] text-[#DA291C] border-[#DA291C]";
      default: return "bg-gray-800 text-white border-gray-600";
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case "success": return <Icons.Check className="w-5 h-5" />;
      case "error": return <Icons.Exclamation className="w-5 h-5" />;
      case "warning": return <Icons.Clock className="w-5 h-5" />;
      default: return <Icons.Utensils className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-2 transform transition-all duration-500 animate-toast-in ${getStyles(toast.type)}`}
          style={{
            boxShadow: '0 10px 40px -10px rgba(218, 41, 28, 0.4)'
          }}
        >
          <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {getIcon(toast.type)}
          </div>
          <p className="font-bold text-sm flex-1 leading-tight">{toast.message}</p>
          <button 
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition"
          >
            <Icons.Close className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Decorative Elements
const FoodPattern = () => (
  <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
    <div className="absolute top-10 left-10 text-6xl rotate-12">🍔</div>
    <div className="absolute top-40 right-20 text-4xl -rotate-12">🍟</div>
    <div className="absolute bottom-20 left-1/4 text-5xl rotate-45">🥤</div>
    <div className="absolute top-1/3 right-10 text-3xl -rotate-6">🌭</div>
    <div className="absolute bottom-40 right-1/3 text-4xl rotate-12">🍕</div>
  </div>
);

const WaveSeparator = ({ className }) => (
  <div className={`relative h-16 ${className}`}>
    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
        fill="currentColor" className="text-[#DA291C]" />
    </svg>
  </div>
);

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wakingUp, setWakingUp] = useState(false);
  const navigate = useNavigate();
  const { addItem, count } = useCart();
  const { toasts, addToast, removeToast } = useToast();

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
          ? "Server is waking up... Please try again in a moment!"
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
    addToast(`${item.name} added to your order!`, "success", 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#DA291C] relative overflow-hidden flex flex-col items-center justify-center gap-6">
        <FoodPattern />
        <div className="relative z-10">
          <div className="w-24 h-24 bg-[#FFC72C] rounded-full flex items-center justify-center mb-6 animate-bounce shadow-2xl">
            <Icons.Flame className="w-12 h-12 text-[#DA291C]" />
          </div>
          <Loader />
        </div>
        
        {wakingUp && (
          <div className="relative z-10 text-center px-6 max-w-md animate-fade-in">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Icons.Clock className="w-6 h-6 text-[#FFC72C] animate-pulse" />
                <span className="text-[#FFC72C] font-black text-lg uppercase tracking-wider">Firing Up The Grill</span>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                Our kitchen is warming up! Due to high demand, this may take 30-60 seconds. Fresh food takes time! 🔥
              </p>
              <div className="mt-4 flex justify-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-[#FFC72C] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#DA291C] relative overflow-hidden flex flex-col items-center justify-center gap-6 px-6 text-center">
        <FoodPattern />
        <div className="relative z-10 bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full border-4 border-[#FFC72C]">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Exclamation className="w-10 h-10 text-[#DA291C]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Kitchen's Closed?</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={load}
            className="w-full bg-[#DA291C] text-white font-bold px-6 py-4 rounded-xl hover:bg-[#b91c1c] transition flex items-center justify-center gap-2 group"
          >
            <Icons.Refresh className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="min-h-screen bg-[#DA291C] relative overflow-hidden flex flex-col items-center justify-center gap-6 px-6 text-center">
        <FoodPattern />
        <div className="relative z-10 bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
          <div className="w-20 h-20 bg-[#FFC72C] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Icons.Utensils className="w-10 h-10 text-[#DA291C]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Menu Coming Soon!</h2>
          <p className="text-gray-600 mb-6">Our chefs are preparing something amazing. Check back shortly!</p>
          <button
            onClick={load}
            className="bg-[#FFC72C] text-[#DA291C] font-black px-8 py-3 rounded-full text-lg hover:bg-yellow-300 transition flex items-center gap-2 mx-auto"
          >
            <Icons.Refresh className="w-5 h-5" />
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] relative">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Hero Header */}
      <div className="bg-[#DA291C] relative overflow-hidden">
        <FoodPattern />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#FFC72C] rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <span className="text-[#DA291C] text-3xl lg:text-4xl font-black">K</span>
              </div>
              <div>
                <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight italic">
                  FRESH<span className="text-[#FFC72C]">.</span>HOT<span className="text-[#FFC72C]">.</span>FAST
                </h1>
                <p className="text-[#FFC72C] font-bold text-sm lg:text-base tracking-[0.2em] uppercase mt-2">
                  Authentic Street Food Experience
                </p>
              </div>
            </div>
            
            {count > 0 && (
              <button
                onClick={() => navigate("/cart")}
                className="group bg-[#FFC72C] text-[#DA291C] font-black px-6 py-4 rounded-2xl hover:bg-yellow-300 transition flex items-center gap-3 shadow-xl transform hover:scale-105"
              >
                <div className="relative">
                  <Icons.Cart className="w-6 h-6" />
                </div>
                <span className="hidden sm:inline">View Order</span>
                <span className="bg-[#DA291C] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black group-hover:animate-bounce">
                  {count}
                </span>
                <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
        <WaveSeparator />
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#DA291C] rounded-full" />
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900">
              Our Menu <span className="text-[#DA291C]">({menu.length})</span>
            </h2>
          </div>
          <button 
            onClick={load}
            className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition text-gray-600 hover:text-[#DA291C]"
            title="Refresh menu"
          >
            <Icons.Refresh className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menu.map((item, index) => (
            <div
              key={item.id ?? index}
              className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:rotate-1"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: 'fade-in-up 0.6s ease-out forwards',
                opacity: 0,
                animationDelay: `${index * 0.1}s`
              }}
            >
              {/* Top Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FFC72C] via-[#DA291C] to-[#FFC72C]" />
              
              {/* Quick Add Button (appears on hover) */}
              <button
                onClick={() => handleAddToCart(item)}
                className="absolute top-4 right-4 z-20 w-12 h-12 bg-[#DA291C] text-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#b91c1c] hover:scale-110"
              >
                <Icons.Plus className="w-6 h-6" />
              </button>

              <MenuCard item={item} onSelect={handleAddToCart} />
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => navigate("/cart")}
        className="fixed bottom-6 right-6 bg-[#DA291C] hover:bg-[#b91c1c] text-white p-5 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3 z-40 group border-4 border-[#FFC72C]"
        aria-label="View cart"
      >
        <div className="relative">
          <Icons.Cart className="w-7 h-7 group-hover:animate-bounce" />
          {count > 0 && (
            <span className="absolute -top-3 -right-3 bg-[#FFC72C] text-[#DA291C] text-sm font-black w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
              {count}
            </span>
          )}
        </div>
      </button>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-fade-in {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
