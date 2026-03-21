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

const CATEGORIES = [
  { label: "All",      emoji: "🍽️" },
  { label: "Kota",     emoji: "🥪" },
  
];

export default function Menu() {
  const [menu,           setMenu]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [wakingUp,       setWakingUp]       = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search,         setSearch]         = useState("");
  const [sidebarOpen,    setSidebarOpen]    = useState(false);

  const navigate          = useNavigate();
  const { addItem, count } = useCart();
  const { logout, isAuth, user } = useAuth();
  const toast             = useToast();

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
        : Array.isArray(raw?.data)   ? raw.data
        : Array.isArray(raw?.items)  ? raw.items
        : Array.isArray(raw?.menu)   ? raw.menu
        : [];
      setMenu(items.sort((a, b) => {
        const cc = (a.category || "").localeCompare(b.category || "");
        return cc !== 0 ? cc : (a.name || "").localeCompare(b.name || "");
      }));
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
      type:    "cart",
      title:   "Added to cart",
      message: item.name,
      sub:     `R${Number(item.price).toFixed(2)}`,
      image:   item.image_url,
    });
  };

  const filtered = menu.filter((item) => {
    const matchCat =
      activeCategory === "All" ||
      item.category?.toLowerCase() === activeCategory.toLowerCase();
    const sl = search.toLowerCase().trim();
    const matchSearch =
      !sl ||
      item.name?.toLowerCase().includes(sl) ||
      item.description?.toLowerCase().includes(sl) ||
      item.category?.toLowerCase().includes(sl);
    return matchCat && matchSearch;
  });

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="mn-loading-screen">
        <style>{styles}</style>
        <Loader />
        {wakingUp && (
          <div className="mn-wake-banner">
            <Zap className="mn-wake-icon" />
            <div>
              <p className="mn-wake-title">Server warming up…</p>
              <p className="mn-wake-sub">Loading menu ready in 30–60 s</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="mn-state-screen">
        <style>{styles}</style>
        <div className="mn-state-icon mn-state-red"><UtensilsCrossed className="w-8 h-8" /></div>
        <h2 className="mn-state-title">Kitchen's Closed</h2>
        <p className="mn-state-sub">{error}</p>
        <button className="mn-state-btn" onClick={load}><RefreshCw className="w-4 h-4" /> Try Again</button>
      </div>
    );
  }

  /* ── Empty ── */
  if (menu.length === 0) {
    return (
      <div className="mn-state-screen">
        <style>{styles}</style>
        <div className="mn-state-icon mn-state-gold"><UtensilsCrossed className="w-8 h-8" /></div>
        <h2 className="mn-state-title">Menu Coming Soon</h2>
        <p className="mn-state-sub">Check back shortly — good things take time.</p>
        <button className="mn-state-btn" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <>
      <style>{styles}</style>

      <div className="mn-root">

        {/* ── Sidebar overlay (mobile) ── */}
        {sidebarOpen && (
          <div className="mn-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`mn-sidebar${sidebarOpen ? " mn-sidebar-open" : ""}`}>
          <div className="mn-sidebar-inner">

            {/* Logo row */}
            <div className="mn-sidebar-logo-row">
              <div className="mn-sidebar-logo">
                <Flame className="w-6 h-6" style={{ color: "#0e0700" }} />
              </div>
              <div className="mn-sidebar-brand-wrap">
                <h1 className="mn-sidebar-brand">KotaGO</h1>
                <p className="mn-sidebar-tagline">Fresh · Fast · Fire</p>
              </div>
              <button className="mn-sidebar-close lg-hidden" onClick={() => setSidebarOpen(false)}>
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="mn-search-wrap">
              <Search className="mn-search-icon" />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mn-search-input"
              />
              {search && (
                <button className="mn-search-clear" onClick={() => setSearch("")}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Navigation */}
            <div className="mn-nav-section">
              <h3 className="mn-nav-title">Navigation</h3>
              <nav className="mn-nav">
                <Link to="/"       className="mn-nav-link"><Home      className="w-4 h-4" /><span>Home</span></Link>
                <Link to="/info"   className="mn-nav-link"><Info      className="w-4 h-4" /><span>Policies & Info</span></Link>
                <Link to="/cart"   className="mn-nav-link">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Bag</span>
                  {count > 0 && <span className="mn-nav-badge">{count}</span>}
                </Link>
                <Link to="/wallet" className="mn-nav-link"><Wallet    className="w-4 h-4" /><span>Wallet</span></Link>
              </nav>
            </div>

            {/* Earn with us */}
            <div className="mn-nav-section">
              <h3 className="mn-nav-title">Earn with us</h3>
              <Link to="/deliver" className="mn-driver-card">
                <div className="mn-driver-icon"><Bike className="w-5 h-5" /></div>
                <div className="mn-driver-text">
                  <span className="mn-driver-label">Become a Driver</span>
                  <span className="mn-driver-sub">Earn on your schedule</span>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "rgba(255,248,231,0.42)" }} />
              </Link>
            </div>

            {/* Contact */}
            <div className="mn-contact-pill">
              <Phone className="w-4 h-4" />
              <span>065 393 5339</span>
            </div>

            {/* User */}
            <div className="mn-sidebar-user">
              {isAuth ? (
                <div className="mn-user-row">
                  <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={30} />
                  <span className="mn-user-email">{user?.email}</span>
                  <button className="mn-logout-btn" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button className="mn-signin-btn" onClick={() => navigate("/login")}>
                  Sign In
                </button>
              )}
            </div>

          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="mn-content">

          {/* Top bar - NO LONGER STICKY, scrolls away */}
          <header className="mn-topbar">
            <button className="mn-topbar-menu lg-hidden" onClick={() => setSidebarOpen(true)}>
              <PanelLeftOpen className="w-6 h-6" />
            </button>
            <div className="mn-topbar-center">
              <span className="mn-topbar-title">{activeCategory}</span>
              <span className="mn-topbar-sub">{filtered.length} items</span>
            </div>
            <button className="mn-topbar-cart" onClick={() => navigate("/cart")}>
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && <span className="mn-topbar-cart-badge">{count}</span>}
            </button>
            <Tooltip title={user?.full_name} placement="topLeft">
              <span style={{ flexShrink: 0 }}>
                <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={40} />
              </span>
            </Tooltip>
          </header>

          {/* Category pills - STICKY AT TOP */}
          <div className="mn-cats-wrap shadow-2xl">
            <div className="mn-cats-scroll">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`mn-cat-pill${activeCategory === cat.label ? " mn-cat-active" : ""}`}
                >
                  <span className="mn-cat-emoji">{cat.emoji}</span>
                  <span className="mn-cat-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info strip */}
          <div className="mn-info-strip">
            <span className="mn-info-left">
              <Flame className="mn-info-flame" />
              Today's picks — freshly updated
            </span>
            <span className="mn-info-count">{filtered.length} item{filtered.length !== 1 ? "s" : ""} found</span>
          </div>

          {/* Grid */}
          <main className="mn-grid-wrap">
            {filtered.length === 0 ? (
              <div className="mn-no-results">
                <SlidersHorizontal className="w-8 h-8" style={{ opacity: 0.4 }} />
                <p className="mn-no-results-text">Nothing matches — try a different filter.</p>
                {search && (
                  <button className="mn-clear-btn" onClick={() => { setSearch(""); setActiveCategory("All"); }}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="mn-grid">
                {filtered.map((item, i) => (
                  <div
                    key={item.id ?? i}
                    className="mn-card-wrap"
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <MenuCard item={item} onSelect={handleAddToCart} />
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* View Cart FAB */}
          {count > 0 && (
            <button className="mn-fab" onClick={() => navigate("/cart")}>
              <ShoppingBag className="w-5 h-5" />
              <span>View Cart</span>
              <span className="mn-fab-count">{count}</span>
              <ChevronRight className="w-4 h-4" style={{ opacity: 0.65 }} />
            </button>
          )}

          <Footer />
        </div>
      </div>
    </>
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

  /* ─── Root layout ─── */
  .mn-root {
    display: flex;
    min-height: 100vh;
    overflow-x: hidden;
    width: 100%;
    background:
      radial-gradient(ellipse 80% 40% at 50% 0%, rgba(218,41,28,0.18) 0%, transparent 70%),
      var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    position: relative;
  }

  /* ─── Sidebar ─── */
  .mn-sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 50;
    width: 272px;
    background: rgba(14, 7, 0, 0.98);
    border-right: 1px solid var(--border);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  @media (min-width: 1024px) {
    .mn-sidebar { transform: translateX(0); }
    .lg-hidden   { display: none !important; }
  }
  .mn-sidebar-open { transform: translateX(0) !important; }

  .mn-sidebar-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px 16px;
    gap: 20px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,199,44,0.15) transparent;
  }
  .mn-sidebar-inner::-webkit-scrollbar { width: 4px; }
  .mn-sidebar-inner::-webkit-scrollbar-thumb { background: rgba(255,199,44,0.15); border-radius: 4px; }

  /* Logo row */
  .mn-sidebar-logo-row {
    display: flex; align-items: center; gap: 10px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .mn-sidebar-logo {
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--gold);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 24px rgba(255,199,44,0.35);
  }
  .mn-sidebar-brand-wrap { flex: 1; min-width: 0; }
  .mn-sidebar-brand {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 3px;
    color: var(--text); line-height: 1;
  }
  .mn-sidebar-tagline {
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--gold); margin-top: 2px;
  }
  .mn-sidebar-close {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: rgba(255,248,231,0.05); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .mn-sidebar-close:hover { color: var(--text); }

  /* Search */
  .mn-search-wrap {
    position: relative; display: flex; align-items: center;
    flex-shrink: 0;
  }
  .mn-search-icon {
    position: absolute; left: 12px;
    width: 15px; height: 15px; color: var(--muted);
    pointer-events: none;
  }
  .mn-search-input {
    width: 100%; padding: 10px 36px 10px 36px;
    background: rgba(255,248,231,0.05);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    color: var(--text); font-size: 13px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none; transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .mn-search-input:focus { border-color: rgba(255,199,44,0.35); }
  .mn-search-input::placeholder { color: var(--muted); }
  .mn-search-clear {
    position: absolute; right: 10px;
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(255,199,44,0.1);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--gold);
  }

  /* Nav sections */
  .mn-nav-section { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
  .mn-nav-title {
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted);
  }
  .mn-nav { display: flex; flex-direction: column; gap: 4px; }
  .mn-nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 12px;
    background: rgba(255,248,231,0.03);
    color: var(--muted); font-size: 13px; font-weight: 600;
    text-decoration: none; transition: all 0.2s;
  }
  .mn-nav-link:hover { background: rgba(255,248,231,0.07); color: var(--text); }
  .mn-nav-badge {
    margin-left: auto;
    min-width: 20px; height: 20px;
    background: var(--gold); color: #0e0700;
    font-size: 10px; font-weight: 900;
    border-radius: 10px; padding: 0 5px;
    display: flex; align-items: center; justify-content: center;
  }

  /* Driver card */
  .mn-driver-card {
    display: flex; align-items: center; gap: 12px;
    padding: 13px; border-radius: 14px;
    background: rgba(255,199,44,0.06);
    border: 1px solid rgba(255,199,44,0.18);
    text-decoration: none; transition: all 0.2s;
  }
  .mn-driver-card:hover { background: rgba(255,199,44,0.1); }
  .mn-driver-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--gold); color: #0e0700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .mn-driver-text { flex: 1; min-width: 0; }
  .mn-driver-label { display: block; font-size: 12px; font-weight: 800; color: var(--text); }
  .mn-driver-sub   { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* Contact pill */
  .mn-contact-pill {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 12px;
    background: rgba(255,199,44,0.08);
    border: 1px solid rgba(255,199,44,0.2);
    font-size: 12px; font-weight: 800; color: var(--gold);
    flex-shrink: 0;
  }

  /* User area */
  .mn-sidebar-user { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .mn-user-row { display: flex; align-items: center; gap: 8px; }
  .mn-user-email {
    flex: 1; min-width: 0;
    font-size: 11px; font-weight: 600; color: var(--muted);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mn-logout-btn {
    width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
    background: rgba(218,41,28,0.08); border: 1px solid rgba(218,41,28,0.2);
    display: flex; align-items: center; justify-content: center;
    color: rgba(218,41,28,0.6); cursor: pointer; transition: all 0.2s;
  }
  .mn-logout-btn:hover { background: rgba(218,41,28,0.2); color: var(--red); }
  .mn-signin-btn {
    width: 100%; padding: 11px; border-radius: 12px;
    background: rgba(255,199,44,0.08); border: 1.5px solid rgba(255,199,44,0.2);
    color: var(--gold); font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s;
  }
  .mn-signin-btn:hover { background: rgba(255,199,44,0.15); }

  /* ─── Overlay (mobile) ─── */
  .mn-overlay {
    position: fixed; inset: 0; z-index: 40;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
  }
  @media (min-width: 1024px) { .mn-overlay { display: none; } }

  /* ─── Main content area ─── */
  .mn-content {
    flex: 1;
    min-width: 0;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    padding-bottom: 96px;
  }
  @media (min-width: 1024px) {
    .mn-content { margin-left: 272px; }
  }

  /* Top bar - NO LONGER STICKY (removed position: sticky, top: 0, z-index: 40) */
  .mn-topbar {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 20px;
    background: rgba(14,7,0,0.95);
    backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    overflow: hidden;
  }
  .mn-topbar-menu {
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    background: rgba(255,248,231,0.05);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .mn-topbar-menu:hover { color: var(--text); }
  .mn-topbar-center {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column; align-items: center;
  }
  .mn-topbar-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px; letter-spacing: 2px; color: var(--text); line-height: 1;
  }
  .mn-topbar-sub { font-size: 10px; font-weight: 600; color: var(--muted); margin-top: 1px; }
  .mn-topbar-cart {
    position: relative; flex-shrink: 0;
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--red); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: white; transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(218,41,28,0.4);
  }
  .mn-topbar-cart:hover { background: var(--red2); transform: scale(1.05); }
  .mn-topbar-cart-badge {
    position: absolute; top: -5px; right: -5px;
    min-width: 18px; height: 18px; padding: 0 4px;
    background: var(--gold); color: #0e0700;
    font-size: 10px; font-weight: 900;
    border-radius: 10px; border: 2px solid #0e0700;
    display: flex; align-items: center; justify-content: center;
    animation: mnPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes mnPop { from { transform: scale(0); } to { transform: scale(1); } }

  /* Category pills - STICKY AT TOP (changed from top: 65px to top: 0, z-index: 50) */
  .mn-cats-wrap {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(14,7,0,0.92);
    border-bottom: 1px solid var(--border);
    overflow: hidden;
  }
  .mn-cats-scroll {
    display: flex; gap: 10px;
    padding: 10px 20px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .mn-cats-scroll::-webkit-scrollbar { display: none; }
  .mn-cat-pill {
    display: flex; flex-direction: column; align-items: center;
    gap: 5px; padding: 10px 14px; border-radius: 16px;
    background: rgba(255,248,231,0.04);
    border: 1.5px solid rgba(255,248,231,0.08);
    cursor: pointer; flex-shrink: 0;
    min-width: 60px; transition: all 0.22s;
  }
  .mn-cat-pill:hover {
    background: rgba(255,199,44,0.06);
    border-color: rgba(255,199,44,0.2);
    transform: translateY(-1px);
  }
  .mn-cat-active {
    background: var(--gold) !important;
    border-color: var(--gold) !important;
    box-shadow: 0 6px 20px rgba(255,199,44,0.35);
    transform: translateY(-2px);
  }
  .mn-cat-emoji { font-size: 20px; line-height: 1; }
  .mn-cat-label {
    font-size: 11px; font-weight: 700; white-space: nowrap;
    color: var(--muted); transition: color 0.2s;
  }
  .mn-cat-active .mn-cat-label { color: #0e0700; font-weight: 900; }

  /* Info strip */
  .mn-info-strip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 20px;
    background: linear-gradient(90deg, rgba(218,41,28,0.1) 0%, transparent 80%);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .mn-info-left {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 600; color: var(--muted);
  }
  .mn-info-flame { width: 14px; height: 14px; color: #fbbf24; flex-shrink: 0; }
  .mn-info-count { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: var(--gold); }

  /* Grid */
  .mn-grid-wrap {
    flex: 1;
    max-width: 1160px;
    margin: 0 auto;
    padding: 24px 20px;
    width: 100%;
    box-sizing: border-box;
  }
  .mn-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 285px), 1fr));
    gap: 20px;
    min-width: 0;
  }
  .mn-card-wrap {
    min-width: 0;
    overflow: hidden;
    animation: mnCardIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both;
  }
  @keyframes mnCardIn {
    from { opacity: 0; transform: translateY(22px) scale(0.96); }
    to   { opacity: 1; transform: none; }
  }

  /* No results */
  .mn-no-results {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; padding: 80px 24px; text-align: center;
    color: var(--muted);
  }
  .mn-no-results-text { font-size: 14px; font-weight: 500; }
  .mn-clear-btn {
    margin-top: 8px; padding: 10px 22px; border-radius: 50px;
    background: var(--gold); color: #0e0700;
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px; font-weight: 800;
    transition: all 0.2s;
  }
  .mn-clear-btn:hover { background: #e6b025; transform: scale(1.03); }

  /* ─── View Cart FAB ─── */
  .mn-fab {
    position: fixed; bottom: 24px; left: 50%; z-index: 50;
    transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 50px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 900;
    box-shadow: 0 8px 32px rgba(218,41,28,0.5), 0 0 0 2px rgba(255,199,44,0.2);
    transition: all 0.2s;
    white-space: nowrap;
    animation: mnFabIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .mn-fab:hover { background: var(--red2); transform: translateX(-50%) scale(1.04); }
  .mn-fab-count {
    min-width: 24px; height: 24px; padding: 0 6px;
    background: var(--gold); color: #0e0700;
    font-size: 11px; font-weight: 900;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
  }
  @keyframes mnFabIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  /* ─── Loading / state screens ─── */
  .mn-loading-screen {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 24px;
    background: var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    overflow: hidden;
  }
  .mn-wake-banner {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 18px; border-radius: 14px;
    background: rgba(255,199,44,0.07);
    border: 1px solid rgba(255,199,44,0.18);
    max-width: 300px;
  }
  .mn-wake-icon { width: 20px; height: 20px; color: var(--gold); flex-shrink: 0; margin-top: 1px; }
  .mn-wake-title { font-size: 12px; font-weight: 800; color: var(--gold); }
  .mn-wake-sub   { font-size: 11px; color: var(--muted); margin-top: 2px; }

  .mn-state-screen {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; padding: 24px; text-align: center;
    background: var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    overflow: hidden;
  }
  .mn-state-icon {
    width: 64px; height: 64px; border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
  }
  .mn-state-red  { background: rgba(218,41,28,0.1);  border: 1px solid rgba(218,41,28,0.2);  color: var(--red); }
  .mn-state-gold { background: rgba(255,199,44,0.08); border: 1px solid rgba(255,199,44,0.18); color: var(--gold); }
  .mn-state-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 30px; letter-spacing: 2px; color: var(--text);
  }
  .mn-state-sub  { font-size: 13px; color: var(--muted); max-width: 280px; line-height: 1.6; }
  .mn-state-btn  {
    display: flex; align-items: center; gap: 8px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 13px;
    padding: 12px 24px; border-radius: 50px; margin-top: 4px;
    box-shadow: 0 4px 16px rgba(218,41,28,0.35);
    transition: all 0.2s;
  }
  .mn-state-btn:hover { background: var(--red2); transform: scale(1.03); }

  /* ─── Mobile adjustments ─── */
  @media (max-width: 640px) {
    .mn-grid-wrap { padding: 16px 12px; }
    .mn-grid { grid-template-columns: 1fr; gap: 16px; }
    .mn-topbar { padding: 10px 14px; }
    .mn-info-strip { padding: 7px 14px; }
  }
`;

