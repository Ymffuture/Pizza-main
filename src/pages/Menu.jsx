import { useEffect, useState, useCallback } from "react";
import { getMenu } from "../api/menu.api";
import MenuCard from "../components/MenuCard";
import Loader from "../components/Loader";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import Footer from "../components/Footer";
import Avatar from "../components/Avatar";
import {
  ShoppingBag, RefreshCw, UtensilsCrossed, Zap, PanelLeftClose,
  ChevronRight, Flame, Search, SlidersHorizontal, LogOut,
  PanelLeftOpen, X, Info, Home, Phone, Wallet, Bike
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Tooltip } from "antd";

// Uber Eats style categories with emojis
const CATEGORIES = [
  { label: "All", emoji: "🍽️" },
  { label: "Kota", emoji: "🥪" },
  { label: "Drinks", emoji: "🥤" },
  { label: "Sides", emoji: "🍟" },
  { label: "Combos", emoji: "🔥" },
  { label: "Desserts", emoji: "🍰" },
];

// Custom scrollbar hide utility styles
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wakingUp, setWakingUp] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { addItem, count } = useCart();
  const { logout, isAuth, user } = useAuth();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.show({ type: "info", title: "Signed out", message: "See you next time!" });
    navigate("/login");
  };

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
      const sortedItems = items.sort((a, b) => {
        const catCompare = (a.category || "").localeCompare(b.category || "");
        if (catCompare !== 0) return catCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
      setMenu(sortedItems);
    } catch (err) {
      const msg =
        err.code === "ECONNABORTED"
          ? "Server is waking up — please try again in 30–60 seconds."
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

  useEffect(() => { load(); }, [load]);

  const handleAddToCart = (item) => {
    addItem(item);
    toast.show({
      type: "cart",
      title: "Added to cart",
      message: item.name,
      sub: `R${Number(item.price).toFixed(2)}`,
      image: item.image_url,
    });
  };

  const filtered = menu.filter((item) => {
    const matchCat =
      activeCategory === "All" ||
      item.category?.toLowerCase() === activeCategory.toLowerCase();
    const searchLower = search.toLowerCase().trim();
    const matchSearch =
      !searchLower ||
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower);
    return matchCat && matchSearch;
  });

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: '#0e0700', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <Loader />
        {wakingUp && (
          <div className="flex items-center gap-3 rounded-xl p-4 max-w-xs" style={{ background: 'rgba(255,199,44,0.07)', border: '1px solid rgba(255,199,44,0.18)' }}>
            <Zap className="w-5 h-5 flex-shrink-0" style={{ color: '#FFC72C' }} />
            <div>
              <p className="text-xs font-bold" style={{ color: '#FFC72C' }}>Server warming up…</p>
              <p className="text-xs" style={{ color: 'rgba(255,248,231,0.42)' }}>Due to high volume — ready in 30–60 s</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: '#0e0700', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(218,41,28,0.1)', border: '1px solid rgba(218,41,28,0.2)', color: '#DA291C' }}>
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-3xl tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#fff8e7' }}>Kitchen&apos;s Closed</h2>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(255,248,231,0.42)' }}>{error}</p>
        <button onClick={load} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-extrabold text-white transition-all hover:scale-105" style={{ background: '#DA291C', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  /* ── Empty ── */
  if (menu.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: '#0e0700', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,199,44,0.08)', border: '1px solid rgba(255,199,44,0.18)', color: '#FFC72C' }}>
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-3xl tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#fff8e7' }}>Menu Coming Soon</h2>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'rgba(255,248,231,0.42)' }}>Check back shortly — good things take time.</p>
        <button onClick={load} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-extrabold text-white transition-all hover:scale-105" style={{ background: '#DA291C', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <>
      <style>{scrollbarHideStyles}</style>
      <div className="min-h-screen flex" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(218,41,28,0.18) 0%, transparent 70%), #0e0700', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#fff8e7' }}>
        
        {/* ── Sidebar ── */}
        <aside className={`fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`} style={{ background: 'rgba(14, 7, 0, 0.98)', borderRight: '1px solid rgba(255,199,44,0.1)' }}>
          <div className="p-5 flex flex-col min-h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 pb-5 mb-6 border-b" style={{ borderColor: 'rgba(255,199,44,0.1)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FFC72C', boxShadow: '0 0 24px rgba(255,199,44,0.35)' }}>
                <Flame className="w-6 h-6" style={{ color: '#0e0700' }} />
              </div>
              <div className="flex-1">
                <h1 className="text-xl tracking-wider leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>KotaGO</h1>
                <p className="text-xs font-extrabold uppercase tracking-widest mt-0.5" style={{ color: '#FFC72C' }}>Fresh · Fast · Fire</p>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center lg:hidden transition-colors" style={{ background: 'rgba(255,248,231,0.05)', border: '1px solid rgba(255,199,44,0.1)', color: 'rgba(255,248,231,0.42)' }} onClick={() => setSidebarOpen(false)}>
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,248,231,0.42)' }} />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: 'rgba(255,248,231,0.05)', border: '1px solid rgba(255,199,44,0.1)', color: '#fff8e7', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              {search && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,199,44,0.1)', color: '#FFC72C' }} onClick={() => setSearch("")}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Navigation */}
            <div className="mb-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,248,231,0.42)' }}>Navigation</h3>
              <nav className="flex flex-col gap-1.5">
                <Link to="/" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all no-underline" style={{ background: 'rgba(255,248,231,0.03)', color: 'rgba(255,248,231,0.42)' }}>
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                <Link to="/info" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all no-underline" style={{ background: 'rgba(255,248,231,0.03)', color: 'rgba(255,248,231,0.42)' }}>
                  <Info className="w-4 h-4" />
                  <span>Policies & Info</span>
                </Link>
                <Link to="/cart" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all no-underline" style={{ background: 'rgba(255,248,231,0.03)', color: 'rgba(255,248,231,0.42)' }}>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Bag <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-black" style={{ background: '#FFC72C', color: '#0e0700' }}>{count}</span></span>
                </Link>
                <Link to="/wallet" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all no-underline" style={{ background: 'rgba(255,248,231,0.03)', color: 'rgba(255,248,231,0.42)' }}>
                  <Wallet className="w-4 h-4" />
                  <span>Wallet</span>
                </Link>
              </nav>
            </div>

            {/* Earn with KotaGO */}
            <div className="mb-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,248,231,0.42)' }}>Earn with us</h3>
              <Link to="/deliver" className="flex items-center gap-3 p-3.5 rounded-xl transition-all no-underline" style={{ background: 'rgba(255,199,44,0.06)', border: '1px solid rgba(255,199,44,0.18)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FFC72C', color: '#0e0700' }}>
                  <Bike className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-xs font-bold" style={{ color: '#fff8e7' }}>Become a Driver</span>
                  <span className="text-xs mt-0.5" style={{ color: 'rgba(255,248,231,0.42)' }}>Earn on your schedule</span>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,248,231,0.42)' }} />
              </Link>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold mb-4" style={{ background: 'rgba(255,199,44,0.08)', border: '1px solid rgba(255,199,44,0.2)', color: '#FFC72C' }}>
              <Phone className="w-4 h-4" />
              <span>065 393 5339</span>
            </div>

            {/* User */}
            <div className="mt-auto pt-4 border-t" style={{ borderColor: 'rgba(255,199,44,0.1)' }}>
              {isAuth ? (
                <div className="flex items-center justify-between gap-2">
                  <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={30} />
                  <span className="text-xs font-semibold truncate flex-1" style={{ color: 'rgba(255,248,231,0.42)' }}>{user?.email}</span>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'rgba(218,41,28,0.08)', border: '1px solid rgba(218,41,28,0.2)', color: 'rgba(218,41,28,0.6)' }} onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button className="w-full py-3 rounded-xl text-xs font-extrabold transition-colors cursor-pointer" style={{ background: 'rgba(255,199,44,0.08)', border: '1px solid rgba(255,199,44,0.2)', color: '#FFC72C', fontFamily: "'Plus Jakarta Sans', sans-serif" }} onClick={() => navigate("/login")}>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-h-screen pb-24 lg:ml-72">
          
          {/* ── Top Bar ── */}
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-5 py-3.5 border-b" style={{ background: 'rgba(14,7,0,0.94)', backdropFilter: 'blur(20px) saturate(1.4)', borderColor: 'rgba(255,199,44,0.1)' }}>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors lg:hidden" style={{ background: 'rgba(255,248,231,0.05)', color: 'rgba(255,248,231,0.42)' }} onClick={() => setSidebarOpen(true)}>
              <PanelLeftOpen className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center flex-1">
              <span className="text-lg tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{activeCategory}</span>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,248,231,0.42)' }}>{filtered.length} items</span>
            </div>
            <button className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105" style={{ background: '#DA291C', boxShadow: '0 4px 16px rgba(218,41,28,0.35)', fontFamily: "'Plus Jakarta Sans', sans-serif" }} onClick={() => navigate("/cart")}>
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-full flex items-center justify-center px-1 text-xs font-black border-2 animate-pulse" style={{ background: '#FFC72C', color: '#0e0700', borderColor: '#0e0700' }}>
                  {count}
                </span>
              )}
            </button>
            <Tooltip title={user?.full_name} placement="topLeft">
              <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={40} />
            </Tooltip>
          </header>

          {/* ── Uber Eats Style Category Pills ── */}
          <div className="sticky top-16 z-30 border-b" style={{ background: 'rgba(14,7,0,0.9)', borderColor: 'rgba(255,199,44,0.1)' }}>
            <div className="flex gap-2.5 px-5 py-3 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all flex-shrink-0 min-w-16 ${activeCategory === cat.label ? 'transform -translate-y-0.5' : ''}`}
                  style={{
                    background: activeCategory === cat.label ? '#FFC72C' : 'rgba(255,248,231,0.05)',
                    border: activeCategory === cat.label ? '1.5px solid #FFC72C' : '1.5px solid rgba(255,248,231,0.08)',
                    boxShadow: activeCategory === cat.label ? '0 6px 20px rgba(255,199,44,0.35)' : 'none'
                  }}
                >
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span className={`text-xs font-bold tracking-wide whitespace-nowrap ${activeCategory === cat.label ? 'text-gray-900' : ''}`} style={{ color: activeCategory === cat.label ? '#0e0700' : 'rgba(255,248,231,0.42)' }}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Info Strip ── */}
          <div className="border-b" style={{ background: 'linear-gradient(90deg, rgba(218,41,28,0.12) 0%, transparent 80%)', borderColor: 'rgba(255,199,44,0.1)' }}>
            <div className="max-w-5xl mx-auto px-5 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'rgba(255,248,231,0.42)' }}>
                <Flame className="w-4 h-4 inline" style={{ color: '#fbbf24' }} />
                Today&apos;s picks — freshly updated
              </span>
              <span className="text-xs font-extrabold tracking-wider" style={{ color: '#FFC72C' }}>
                {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
              </span>
            </div>
          </div>

          {/* ── Grid ── */}
          <main className="max-w-5xl mx-auto px-4 py-6">
            {filtered.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-3" style={{ color: 'rgba(255,248,231,0.42)' }}>
                <SlidersHorizontal className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">Nothing matches — try a different filter.</p>
                {search && (
                  <button
                    className="mt-3 px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                    style={{ background: '#FFC72C', color: '#0e0700', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    onClick={() => { setSearch(""); setActiveCategory("All"); }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 285px), 1fr))' }}>
                {filtered.map((item, i) => (
                  <div 
                    key={item.id ?? i} 
                    className="overflow-hidden"
                    style={{ 
                      animation: 'cardIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both',
                      animationDelay: `${i * 55}ms`
                    }}
                  >
                    <MenuCard item={item} onSelect={handleAddToCart} />
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* ── FAB ── */}
          {count > 0 && (
            <button 
              className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-extrabold text-white transition-all hover:scale-105 z-50"
              style={{ 
                background: '#DA291C', 
                boxShadow: '0 8px 32px rgba(218,41,28,0.5), 0 0 0 2px rgba(255,199,44,0.2)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                animation: 'fabIn 0.4s cubic-bezier(0.34,1.56,0.64,1)'
              }}
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>View Cart</span>
              <span className="min-w-6 h-6 rounded-full flex items-center justify-center px-1.5 text-xs font-black" style={{ background: '#FFC72C', color: '#0e0700' }}>{count}</span>
              <ChevronRight className="w-4 h-4 opacity-65" />
            </button>
          )}
        </div>

        {/* ── Overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
        )}
      </div>
      
      {/* Keyframe Animations */}
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(22px) scale(0.96); }
          to { opacity: 1; transform: none; }
        }
        @keyframes fabIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
      
      <Footer />
    </>
  );
}
