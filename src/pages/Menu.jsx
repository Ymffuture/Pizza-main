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

// Categories with Uber Eats style emojis
const CATEGORIES = [
  { label: "All",       emoji: "🍽️" },
  { label: "Kota",      emoji: "🥪" },
  { label: "Drinks",    emoji: "🥤" },
  { label: "Sides",     emoji: "🍟" },
  { label: "Combos",    emoji: "🔥" },
  { label: "Desserts",  emoji: "🍰" },
];

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
      <div className="menu-loading-screen">
        <Loader />
        {wakingUp && (
          <div className="wakeup-banner">
            <Zap className="wakeup-icon" />
            <div>
              <p className="wakeup-title">Server warming up…</p>
              <p className="wakeup-sub">Due to high volume — ready in 30–60 s</p>
            </div>
          </div>
        )}
        <style>{menuStyles}</style>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="menu-state-screen">
        <div className="state-icon-wrap error-icon-wrap">
          <UtensilsCrossed className="w-10 h-10" />
        </div>
        <h2 className="state-title">Kitchen&apos;s Closed</h2>
        <p className="state-sub">{error}</p>
        <button onClick={load} className="state-btn">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
        <style>{menuStyles}</style>
      </div>
    );
  }

  /* ── Empty ── */
  if (menu.length === 0) {
    return (
      <div className="menu-state-screen">
        <div className="state-icon-wrap">
          <UtensilsCrossed className="w-10 h-10" />
        </div>
        <h2 className="state-title">Menu Coming Soon</h2>
        <p className="state-sub">Check back shortly — good things take time.</p>
        <button onClick={load} className="state-btn">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        <style>{menuStyles}</style>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <>
      <div className="menu-root">
        <style>{menuStyles}</style>

        {/* ── Sidebar ── */}
        <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          <div className="sidebar-inner">
            {/* Logo */}
            <div className="sidebar-logo scale-95">
              <div className="brand-badge">
                <Flame className="w-6 h-6" style={{ color: "#0e0700" }} />
              </div>
              <div className="sidebar-logo-text">
                <h1 className="brand-name">KotaGO</h1>
                <p className="brand-tagline">Fresh · Fast · Fire</p>
              </div>
              <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="sidebar-search">
              <Search className="sidebar-search-icon" />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sidebar-search-input"
              />
              {search && (
                <button className="sidebar-search-clear" onClick={() => setSearch("")}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Navigation */}
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">Navigation</h3>
              <nav className="sidebar-nav">
                <Link to="/" className="sidebar-nav-link">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                <Link to="/info" className="sidebar-nav-link">
                  <Info className="w-4 h-4" />
                  <span>Policies & Info</span>
                </Link>
                <Link to="/cart" className="sidebar-nav-link">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Bag <span className="cart-count-badge">{count}</span></span>
                </Link>
                <Link to="/wallet" className="sidebar-nav-link">
                  <Wallet className="w-4 h-4" />
                  <span>Wallet</span>
                </Link>
              </nav>
            </div>

            {/* Earn with KotaGO */}
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">Earn with us</h3>
              <Link to="/deliver" className="sidebar-deliver-card">
                <div className="deliver-icon">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="deliver-text">
                  <span className="deliver-title">Become a Driver</span>
                  <span className="deliver-sub">Earn on your schedule</span>
                </div>
                <ChevronRight className="w-4 h-4 deliver-arrow" />
              </Link>
            </div>

            {/* Contact */}
            <div className="sidebar-contact">
              <Phone className="w-4 h-4" />
              <span>065 393 5339</span>
            </div>

            {/* User */}
            <div className="sidebar-footer">
              {isAuth ? (
                <div className="sidebar-user">
                  <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={30} />
                  <span className="sidebar-user-email">{user?.email}</span>
                  <button className="sidebar-logout-btn" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button className="sidebar-login-btn" onClick={() => navigate("/login")}>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="main-content">
          {/* ── Top Bar ── */}
          <header className="top-bar">
            <button className="menu-toggle-btn" onClick={() => setSidebarOpen(true)}>
              <PanelLeftOpen className="w-6 h-6" />
            </button>
            <div className="top-bar-center">
              <span className="top-bar-category">{activeCategory}</span>
              <span className="top-bar-count">{filtered.length} items</span>
            </div>
            <button className="cart-pill" onClick={() => navigate("/cart")}>
              <ShoppingBag className="w-6 h-6" />
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
            <Tooltip title={user?.full_name} placement="topLeft">
              <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={40} />
            </Tooltip>
          </header>

          {/* ── Uber Eats Style Category Pills ── */}
          <div className="category-bar">
            <div className="category-scroll">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`cat-pill ${activeCategory === cat.label ? "cat-pill-active" : ""}`}
                >
                  <span className="cat-emoji">{cat.emoji}</span>
                  <span className="cat-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Info Strip ── */}
          <div className="hero-strip">
            <div className="hero-strip-inner">
              <span className="hero-strip-text">
                <Flame className="w-4 h-4 inline mr-1" style={{ color: "#fbbf24" }} />
                Today&apos;s picks — freshly updated
              </span>
              <span className="hero-strip-count">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
              </span>
            </div>
          </div>

          {/* ── Grid ── */}
          <main className="menu-grid-wrap">
            {filtered.length === 0 ? (
              <div className="no-results">
                <SlidersHorizontal className="w-8 h-8 opacity-40" />
                <p>Nothing matches — try a different filter.</p>
                {search && (
                  <button
                    className="clear-search-btn"
                    onClick={() => { setSearch(""); setActiveCategory("All"); }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="menu-grid">
                {filtered.map((item, i) => (
                  <div key={item.id ?? i} className="menu-card-wrap" style={{ "--i": i }}>
                    <MenuCard item={item} onSelect={handleAddToCart} />
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* ── FAB ── */}
          {count > 0 && (
            <button className="fab" onClick={() => navigate("/cart")}>
              <ShoppingBag className="w-5 h-5" />
              <span>View Cart</span>
              <span className="fab-badge">{count}</span>
              <ChevronRight className="w-4 h-4 fab-arrow" />
            </button>
          )}
        </div>

        {/* ── Overlay ── */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
      <Footer />
    </>
  );
}

const menuStyles = `
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
    --sidebar-width: 280px;
  }

  .menu-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 40% at 50% 0%, rgba(218,41,28,0.18) 0%, transparent 70%),
      var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    display: flex;
  }

  /* Loading */
  .menu-loading-screen {
    min-height: 100vh; background: var(--dark);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 24px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  .wakeup-banner {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,199,44,0.07); border: 1px solid rgba(255,199,44,0.18);
    border-radius: 14px; padding: 14px 20px; max-width: 320px;
  }
  .wakeup-icon { width: 20px; height: 20px; color: var(--gold); flex-shrink: 0; }
  .wakeup-title { font-weight: 700; color: var(--gold); font-size: 13px; }
  .wakeup-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* State screens */
  .menu-state-screen {
    min-height: 100vh; background: var(--dark);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 16px; padding: 24px; text-align: center;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  .state-icon-wrap {
    width: 72px; height: 72px; background: rgba(255,199,44,0.08);
    border: 1px solid rgba(255,199,44,0.18); border-radius: 20px;
    display: flex; align-items: center; justify-content: center; color: var(--gold);
  }
  .error-icon-wrap { background: rgba(218,41,28,0.1); border-color: rgba(218,41,28,0.2); color: var(--red); }
  .state-title { font-family: 'Bebas Neue', sans-serif; font-size: 34px; letter-spacing: 3px; color: var(--text); }
  .state-sub { color: var(--muted); font-size: 14px; max-width: 280px; line-height: 1.6; }
  .state-btn {
    display: flex; align-items: center; gap: 8px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px;
    padding: 12px 26px; border-radius: 50px; transition: background 0.2s, transform 0.15s; margin-top: 8px;
  }
  .state-btn:hover { background: var(--red2); transform: scale(1.03); }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-width); background: rgba(14, 7, 0, 0.98);
    border-right: 1px solid var(--border); position: fixed; top: 0; left: 0; bottom: 0;
    z-index: 1000; transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--gold) transparent;
  }
  .sidebar::-webkit-scrollbar { width: 6px; }
  .sidebar::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 3px; }
  .sidebar-open { transform: translateX(0); }
  .sidebar-inner { padding: 20px; display: flex; flex-direction: column; min-height: 100%; }

  .sidebar-logo {
    display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
    padding-bottom: 20px; border-bottom: 1px solid var(--border);
  }
  .sidebar-logo-text { flex: 1; }
  .sidebar-close-btn {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(255,248,231,0.05); border: 1px solid var(--border);
    color: var(--muted); display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .sidebar-close-btn:hover { color: var(--text); border-color: rgba(255,199,44,0.3); }

  .brand-badge {
    width: 40px; height: 40px; background: var(--gold); border-radius: 11px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 0 24px rgba(255,199,44,0.35);
  }
  .brand-name { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: var(--text); line-height: 1; }
  .brand-tagline { font-size: 10px; font-weight: 800; color: var(--gold); letter-spacing: 0.18em; text-transform: uppercase; margin-top: 2px; }

  .sidebar-search { position: relative; margin-bottom: 24px; }
  .sidebar-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--muted); }
  .sidebar-search-input {
    width: 100%; padding: 12px 12px 12px 40px;
    background: rgba(255,248,231,0.05); border: 1px solid var(--border);
    border-radius: 12px; color: var(--text); font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s;
  }
  .sidebar-search-input::placeholder { color: var(--muted); }
  .sidebar-search-input:focus { outline: none; border-color: rgba(255,199,44,0.4); background: rgba(255,248,231,0.08); }
  .sidebar-search-clear {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    width: 20px; height: 20px; border-radius: 50%; background: rgba(255,199,44,0.1);
    border: none; color: var(--gold); display: flex; align-items: center; justify-content: center; cursor: pointer;
  }

  .sidebar-section { margin-bottom: 24px; }
  .sidebar-section-title { font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }

  .sidebar-nav { display: flex; flex-direction: column; gap: 6px; }
  .sidebar-nav-link {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    background: rgba(255,248,231,0.03); border: 1px solid transparent;
    border-radius: 10px; color: var(--muted); font-size: 13px; font-weight: 600;
    text-decoration: none; transition: all 0.2s;
  }
  .sidebar-nav-link:hover { background: rgba(255,248,231,0.06); color: var(--text); border-color: var(--border); }
  
  .cart-count-badge {
    background: var(--gold); color: #0e0700;
    font-size: 10px; font-weight: 900;
    padding: 1px 6px; border-radius: 50px;
    margin-left: 4px;
  }

  /* Deliver card */
  .sidebar-deliver-card {
    display: flex; align-items: center; gap: 12px;
    padding: 14px; background: rgba(255,199,44,0.06);
    border: 1px solid rgba(255,199,44,0.18); border-radius: 12px;
    text-decoration: none; transition: all 0.2s; cursor: pointer;
  }
  .sidebar-deliver-card:hover { background: rgba(255,199,44,0.12); border-color: rgba(255,199,44,0.35); }
  .deliver-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: var(--gold); display: flex; align-items: center; justify-content: center;
    color: #0e0700; flex-shrink: 0;
  }
  .deliver-text { flex: 1; display: flex; flex-direction: column; }
  .deliver-title { font-size: 13px; font-weight: 700; color: var(--text); }
  .deliver-sub   { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .deliver-arrow { color: var(--muted); }

  .sidebar-contact {
    display: flex; align-items: center; gap: 8px; padding: 12px;
    background: rgba(255,199,44,0.08); border: 1px solid rgba(255,199,44,0.2);
    border-radius: 10px; color: var(--gold); font-size: 13px; font-weight: 700; margin-bottom: 16px;
  }
  .sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); }
  .sidebar-user { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .sidebar-user-email { font-size: 12px; color: var(--muted); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sidebar-logout-btn {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(218,41,28,0.08); border: 1px solid rgba(218,41,28,0.2);
    color: rgba(218,41,28,0.6); display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .sidebar-logout-btn:hover { background: rgba(218,41,28,0.2); color: var(--red); border-color: rgba(218,41,28,0.4); }
  .sidebar-login-btn {
    width: 100%; padding: 12px; background: rgba(255,199,44,0.08);
    border: 1px solid rgba(255,199,44,0.2); border-radius: 10px; color: var(--gold);
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s;
  }
  .sidebar-login-btn:hover { background: rgba(255,199,44,0.15); }

  .sidebar-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px); z-index: 999;
  }

  /* Main content */
  .main-content { flex: 1; margin-left: 0; min-height: 100vh; transition: margin-left 0.3s; padding-bottom: 100px; }

  /* Top bar */
  .top-bar {
    position: sticky; top: 0; z-index: 100;
    background: rgba(14,7,0,0.94); backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 1px solid var(--border); padding: 14px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .menu-toggle-btn {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(255,248,231,0.05); color: var(--muted);
    display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
    border: none;
  }
  .menu-toggle-btn:hover { color: var(--text); background: rgba(255,199,44,0.07); }
  .top-bar-center { display: flex; flex-direction: column; align-items: center; flex: 1; }
  .top-bar-category { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px; color: var(--text); }
  .top-bar-count { font-size: 11px; color: var(--muted); font-weight: 600; }
  .cart-pill {
    position: relative; display: flex; align-items: center; gap: 7px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px;
    padding: 8px 16px; border-radius: 10px; transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(218,41,28,0.35);
  }
  .cart-pill:hover { background: var(--red2); transform: scale(1.04); }
  .cart-badge {
    position: absolute; top: -7px; right: -7px;
    min-width: 18px; height: 18px; border-radius: 50px;
    background: var(--gold); color: #0e0700; font-weight: 900; font-size: 10px;
    display: flex; align-items: center; justify-content: center; padding: 0 4px;
    border: 2px solid var(--dark); animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }

  /* ── Uber Eats Category Bar ── */
  .category-bar {
    background: rgba(14,7,0,0.9);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 69px; z-index: 90;
  }
  .category-scroll {
    display: flex; gap: 10px;
    padding: 12px 20px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .category-scroll::-webkit-scrollbar { display: none; }

  .cat-pill {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 10px 18px; border-radius: 16px;
    background: rgba(255,248,231,0.05);
    border: 1.5px solid rgba(255,248,231,0.08);
    cursor: pointer; transition: all 0.2s;
    flex-shrink: 0; min-width: 70px;
  }
  .cat-pill:hover {
    background: rgba(255,199,44,0.08);
    border-color: rgba(255,199,44,0.25);
    transform: translateY(-2px);
  }
  .cat-pill-active {
    background: var(--gold) !important;
    border-color: var(--gold) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255,199,44,0.35);
  }
  .cat-emoji { font-size: 22px; line-height: 1; }
  .cat-label {
    font-size: 11px; font-weight: 700;
    color: var(--muted); letter-spacing: 0.03em;
    white-space: nowrap;
  }
  .cat-pill-active .cat-label { color: #0e0700; }
  .cat-pill:hover .cat-label { color: var(--text); }

  /* Hero strip */
  .hero-strip { background: linear-gradient(90deg, rgba(218,41,28,0.12) 0%, transparent 80%); border-bottom: 1px solid var(--border); }
  .hero-strip-inner { max-width: 1200px; margin: 0 auto; padding: 9px 20px; display: flex; align-items: center; justify-content: space-between; }
  .hero-strip-text { font-size: 12px; font-weight: 600; color: var(--muted); }
  .hero-strip-count { font-size: 12px; font-weight: 800; color: var(--gold); letter-spacing: 0.05em; }

  /* Grid */
  .menu-grid-wrap { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
  .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(285px, 1fr)); gap: 20px; }
  .menu-card-wrap { animation: cardIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both; animation-delay: calc(var(--i) * 55ms); }
  @keyframes cardIn { from { opacity: 0; transform: translateY(22px) scale(0.96); } to { opacity: 1; transform: none; } }

  .no-results {
    text-align: center; padding: 80px 20px; color: var(--muted);
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    font-size: 14px; font-weight: 500;
  }
  .clear-search-btn {
    margin-top: 12px; padding: 10px 20px; background: var(--gold); color: #0e0700;
    border: none; border-radius: 50px; font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s;
  }
  .clear-search-btn:hover { transform: scale(1.05); box-shadow: 0 4px 16px rgba(255,199,44,0.3); }

  /* FAB */
  .fab {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px;
    padding: 14px 28px; border-radius: 50px;
    box-shadow: 0 8px 32px rgba(218,41,28,0.5), 0 0 0 2px rgba(255,199,44,0.2);
    transition: all 0.25s; z-index: 200;
    animation: fabIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .fab:hover { background: var(--red2); transform: translateX(-50%) scale(1.04); }
  .fab-badge {
    background: var(--gold); color: #0e0700; font-size: 12px; font-weight: 900;
    min-width: 22px; height: 22px; border-radius: 50px; padding: 0 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .fab-arrow { opacity: 0.65; }
  @keyframes fabIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .sidebar { transform: translateX(0); position: fixed; }
    .main-content { margin-left: var(--sidebar-width); }
    .menu-toggle-btn { display: none; }
    .sidebar-close-btn { display: none; }
    .sidebar-overlay { display: none; }
  }

  @media (max-width: 600px) {
    .menu-grid  { grid-template-columns: 1fr; }
    .fab        { width: calc(100% - 40px); justify-content: center; }
    .cat-pill   { min-width: 60px; padding: 8px 12px; }
  }
`;
