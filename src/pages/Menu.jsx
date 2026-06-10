import { useEffect, useState, useCallback } from "react";
import { getMenu } from "../api/menu.api";
import MenuCard from "../components/MenuCard";
import {Loader3} from "../components/Loader";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import Footer from "../components/Footer";
import Avatar from "../components/Avatar";
import NotificationBell from "../components/NotificationBell";
import {
  ShoppingBag, RefreshCw, UtensilsCrossed, Zap, PanelLeftClose, MessagesSquare, LayoutDashboard,
  ChevronRight, Flame, Search, SlidersHorizontal, LogOut,
  PanelLeftOpen, X, Info, Home, Phone, Wallet, WalletCards, Bike,
  Settings, ChevronLeft, ChevronRight as ChevRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Tooltip } from "antd";
import ActiveOrderTracker from "../components/ActiveOrderTracker";
import SettingsPanel from "../components/SettingsPanel";

const CATEGORIES = [
  { label: "All",      emoji: "🍽️" },
  { label: "Kota",     emoji: "🥪" },
  { label: "Drinks",   emoji: "🥤" },
  { label: "Sides",    emoji: "🍟" },
  { label: "Combos",   emoji: "🔥" },
  { label: "Desserts", emoji: "🍰" },
];

// Nav items for sidebar
const NAV_ITEMS = [
  { to: "/",                label: "Home",           Icon: Home,          section: "main" },
  { to: "/info",            label: "Policies",       Icon: Info,          section: "main" },
  { to: "/cart",            label: "Bag",            Icon: ShoppingBag,   section: "main", badge: "cart" },
  { to: "/rewards",         label: "Rewards",        Icon: WalletCards,   section: "main", badge: "new" },
  { to: "/driver-dashboard",label: "Dashboard",      Icon: LayoutDashboard,section: "main", badge: "new" },
  { to: "/wallet",          label: "Wallet",         Icon: Wallet,        section: "main" },
];

export default function Menu() {
  const [menu,           setMenu]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [wakingUp,       setWakingUp]       = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search,         setSearch]         = useState("");
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [collapsed,      setCollapsed]      = useState(false); // desktop collapse
  const [settingsOpen,   setSettingsOpen]   = useState(false);

  const navigate           = useNavigate();
  const { addItem, count } = useCart();
  const { logout, isAuth, user } = useAuth();
  const toast              = useToast();

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
        : Array.isArray(raw?.data)  ? raw.data
        : Array.isArray(raw?.items) ? raw.items
        : Array.isArray(raw?.menu)  ? raw.menu
        : [];
      setMenu(items.sort((a, b) => {
        const cc = (a.category || "").localeCompare(b.category || "");
        return cc !== 0 ? cc : (a.name || "").localeCompare(b.name || "");
      }));
    } catch (err) {
      const msg =
        err.code === "ECONNABORTED"
          ? "Server is waking up — please try again in 30–60 seconds."
          : err?.response?.data?.detail || err?.response?.data?.message || err.message || "Failed to load menu.";
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
      title:   "Added to Bag",
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

  const sidebarWidth = collapsed ? 72 : 272;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="mn-loading-screen">
        <style>{styles}</style>
        <Loader3 />
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
      <ActiveOrderTracker />

      {/* NotificationBell rendered at root level — outside any constrained/stacking contexts */}
      <div className="mn-notif-bell-wrapper">
        <NotificationBell />
      </div>

      <div className="mn-root">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="mn-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`mn-sidebar${sidebarOpen ? " mn-sidebar-open" : ""}${collapsed ? " mn-sidebar-collapsed" : ""}`}
          style={{ "--sidebar-w": `${sidebarWidth}px` }}
        >
          <div className="mn-sidebar-inner">

            {/* Logo row — visible only when expanded */}
            <div className="mn-sidebar-logo-row">
              <button className="mn-sidebar-close lg-hidden" onClick={() => setSidebarOpen(false)} title="Close">
                <PanelLeftClose className="w-6 h-6" />
              </button>
              {!collapsed && (
                <div className="mn-sidebar-brand-text">
                  <span className="mn-sidebar-brand">KotaBites</span>
                  <span className="mn-sidebar-tagline">Fresh · Fast · Fire</span>
                </div>
              )}
              {/* Desktop collapse toggle */}
              <button
                className="mn-collapse-btn lg-only"
                onClick={() => setCollapsed(c => !c)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed
                  ? <ChevRight style={{ width: 15, height: 15 }} />
                  : <ChevronLeft style={{ width: 15, height: 15 }} />}
              </button>
            </div>

            {/* Nav items */}
            <nav className="mn-nav">
              {NAV_ITEMS.map(({ to, label, Icon, badge }) => (
                <Tooltip
                  key={to}
                  title={collapsed ? label : ""}
                  placement="right"
                  overlayStyle={{ fontSize: 12 }}
                >
                  <Link
                    to={to}
                    className={`mn-nav-link${collapsed ? " mn-nav-link-collapsed" : ""}`}
                    title={collapsed ? label : undefined}
                  >
                    <div className="mn-nav-icon-wrap">
                      <Icon className="w-4 h-4" />
                    </div>
                    {!collapsed && <span className="mn-nav-label">{label}</span>}
                    {!collapsed && badge === "cart" && count > 0 && (
                      <span className="mn-nav-badge">{count}</span>
                    )}
                    {!collapsed && badge === "new" && (
                      <span className="mn-nav-badge mn-nav-badge-new">New</span>
                    )}
                    {collapsed && badge === "cart" && count > 0 && (
                      <span className="mn-nav-badge-dot" />
                    )}
                  </Link>
                </Tooltip>
              ))}
            </nav>

            {/* Earn with us — hidden when collapsed */}
            {!collapsed && (
              <div className="mn-nav-section">
                <span className="mn-nav-title">Earn with us</span>
                <Link to="/deliver" className="mn-driver-card">
                  <div className="mn-driver-icon"><Bike className="w-4 h-4" /></div>
                  <div className="mn-driver-text">
                    <span className="mn-driver-label">Become a Driver</span>
                    <span className="mn-driver-sub">Earn on your schedule</span>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: "rgba(255,248,231,0.3)" }} />
                </Link>
              </div>
            )}

            {/* Collapsed: driver icon */}
            {collapsed && (
              <Tooltip title="Become a Driver" placement="right">
                <Link to="/deliver" className={`mn-nav-link mn-nav-link-collapsed`}>
                  <div className="mn-nav-icon-wrap" style={{ background: "rgba(255,199,44,0.1)", color: "var(--gold)" }}>
                    <Bike className="w-4 h-4" />
                  </div>
                </Link>
              </Tooltip>
            )}

            {/* Contact — hidden when collapsed */}
            {!collapsed && (
              <div className="mn-contact-pill">
                <MessagesSquare className="w-4 h-4" />
                <span>063 441 4863</span>
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Settings button — smart styled */}
            <Tooltip title={collapsed ? "Settings" : ""} placement="right">
              <button
                onClick={() => setSettingsOpen(true)}
                className={`mn-settings-btn${collapsed ? " mn-settings-btn-collapsed" : ""}`}
              >
                <div className="mn-settings-icon-wrap">
                  <Settings className="w-4 h-4 mn-settings-gear" />
                </div>
                {!collapsed && (
                  <>
                    <span className="mn-settings-label">Settings</span>
                    <div className="mn-settings-arrow">
                      <ChevronRight style={{ width: 13, height: 13 }} />
                    </div>
                  </>
                )}
              </button>
            </Tooltip>

            {/* User row */}
            <div className={`mn-sidebar-user${collapsed ? " mn-sidebar-user-collapsed" : ""}`}>
              {isAuth ? (
                <Tooltip title={collapsed ? (user?.email || "User") : ""} placement="right">
                  <div className="mn-user-row">
                    <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={32} />
                    {!collapsed && (
                      <>
                        <div className="mn-user-info">
                          <span className="mn-user-name">{user?.full_name?.split(" ")[0] || "User"}</span>
                          <span className="mn-user-email">{user?.email}</span>
                        </div>
                        <button className="mn-logout-btn" onClick={handleLogout} title="Sign out">
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </Tooltip>
              ) : (
                <Tooltip title={collapsed ? "Sign In" : ""} placement="right">
                  <button
                    className={`mn-signin-btn${collapsed ? " mn-signin-btn-icon" : ""}`}
                    onClick={() => navigate("/login")}
                  >
                    {collapsed ? <LogOut className="w-4 h-4" style={{ transform: "scaleX(-1)" }} /> : "Sign In"}
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </aside>

        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {/* ── Main content ── */}
        <div
          className="mn-content"
          style={{ "--content-ml": `${sidebarWidth}px` }}
        >

          {/* Top bar */}
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
            <Tooltip title={user?.full_name} placement="top">
              <span style={{ flexShrink: 0 }}>
                <Avatar picture={user?.picture || user?.avatar} name={user?.full_name} email={user?.email} size={40} />
              </span>
            </Tooltip>
          </header>

          {/* Search bar - STICKY */}
          <div className="mn-search-bar-wrap">
            <div className="mn-search-bar-inner">
              <Search className="mn-search-bar-icon" />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mn-search-bar-input"
              />
              {search && (
                <button className="mn-search-bar-clear" onClick={() => setSearch("")}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category pills - STICKY */}
          <div className="mn-cats-wrap">
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
                  <div key={item.id ?? i} className="mn-card-wrap" style={{ animationDelay: `${i * 55}ms` }}>
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

  /* ─── Notification Bell Wrapper ───
     Rendered at root level to escape all stacking contexts.
     The bell button is visually positioned in the search bar area
     but the DOM is outside any backdrop-filter / overflow containers. */
  .mn-notif-bell-wrapper {
    position: fixed;
    top: 12px;
    right: 80px;
    z-index: 9999;
  }
  @media (max-width: 1023px) {
    .mn-notif-bell-wrapper {
      top: 14px;
      right: 72px;
    }
  }
  @media (max-width: 640px) {
    .mn-notif-bell-wrapper {
      top: 14px;
      right: 64px;
    }
  }

  /* ─── Root ─── */
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
    width: var(--sidebar-w, 272px);
    background: rgba(14, 7, 0, 0.98);
    border-right: 1px solid var(--border);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
  }
  @media (min-width: 1024px) {
    .mn-sidebar { transform: translateX(0); }
    .lg-hidden  { display: none !important; }
    .lg-only    { display: flex !important; }
  }
  @media (max-width: 1023px) {
    .lg-only { display: none !important; }
  }
  .mn-sidebar-open { transform: translateX(0) !important; }

  .mn-sidebar-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px 10px 16px;
    gap: 6px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,199,44,0.15) transparent;
  }
  .mn-sidebar-inner::-webkit-scrollbar { width: 3px; }
  .mn-sidebar-inner::-webkit-scrollbar-thumb { background: rgba(255,199,44,0.15); border-radius: 3px; }

  /* Logo row */
  .mn-sidebar-logo-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 4px 12px;
    border-bottom: 1px solid rgba(255,199,44,0.08);
    margin-bottom: 4px;
    flex-shrink: 0;
    min-height: 48px;
  }
  .mn-sidebar-brand-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .mn-sidebar-brand {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px; letter-spacing: 3px;
    color: var(--text); line-height: 1;
  }
  .mn-sidebar-tagline {
    font-size: 9px; font-weight: 800;
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

  /* Collapse toggle (desktop) */
  .mn-collapse-btn {
    width: 26px; height: 26px; border-radius: 7px;
    background: rgba(255,248,231,0.05); border: 1px solid rgba(255,199,44,0.15);
    display: none;
    align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
    flex-shrink: 0; margin-left: auto;
  }
  .mn-collapse-btn:hover { color: var(--gold); background: rgba(255,199,44,0.1); border-color: rgba(255,199,44,0.3); }

  /* ── Nav ── */
  .mn-nav-section { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
  .mn-nav-title {
    font-size: 9px; font-weight: 800;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted); padding: 0 8px; margin-bottom: 2px;
  }
  .mn-nav { display: flex; flex-direction: column; gap: 2px; }

  .mn-nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 11px;
    color: var(--muted); font-size: 13px; font-weight: 600;
    text-decoration: none; transition: all 0.2s;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    min-height: 40px;
  }
  .mn-nav-link:hover {
    background: rgba(255,248,231,0.07); color: var(--text);
  }
  .mn-nav-link-collapsed {
    justify-content: center;
    padding: 10px;
    gap: 0;
  }
  .mn-nav-icon-wrap {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,248,231,0.05);
    transition: all 0.2s;
  }
  .mn-nav-link:hover .mn-nav-icon-wrap {
    background: rgba(255,199,44,0.1);
    color: var(--gold);
  }
  .mn-nav-label { flex: 1; }
  .mn-nav-badge {
    min-width: 20px; height: 20px;
    background: var(--gold); color: #0e0700;
    font-size: 10px; font-weight: 900;
    border-radius: 10px; padding: 0 5px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .mn-nav-badge-new {
    background: rgba(218,41,28,0.2);
    border: 1px solid rgba(218,41,28,0.4);
    color: #f87171;
    font-size: 9px;
  }
  .mn-nav-badge-dot {
    position: absolute; top: 6px; right: 6px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--red); border: 1.5px solid var(--dark);
  }

  /* Driver card */
  .mn-driver-card {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 10px; border-radius: 12px;
    background: rgba(255,199,44,0.06);
    border: 1px solid rgba(255,199,44,0.16);
    text-decoration: none; transition: all 0.2s;
  }
  .mn-driver-card:hover { background: rgba(255,199,44,0.1); }
  .mn-driver-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--gold); color: #0e0700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mn-driver-text { flex: 1; min-width: 0; }
  .mn-driver-label { display: block; font-size: 12px; font-weight: 800; color: var(--text); }
  .mn-driver-sub   { display: block; font-size: 10px; color: var(--muted); margin-top: 1px; }

  /* Contact pill */
  .mn-contact-pill {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 12px; border-radius: 10px;
    background: rgba(255,199,44,0.06);
    border: 1px solid rgba(255,199,44,0.14);
    font-size: 11px; font-weight: 800; color: var(--gold);
    flex-shrink: 0;
  }

  /* ── Settings button — smart styled ── */
  .mn-settings-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255,199,44,0.08) 0%, rgba(218,41,28,0.06) 100%);
    border: 1px solid rgba(255,199,44,0.2);
    color: var(--text); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.25s;
    width: 100%; text-align: left;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .mn-settings-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,199,44,0.12) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.25s;
  }
  .mn-settings-btn:hover { border-color: rgba(255,199,44,0.4); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(255,199,44,0.12); }
  .mn-settings-btn:hover::before { opacity: 1; }
  .mn-settings-btn-collapsed {
    justify-content: center;
    padding: 10px;
    background: rgba(255,199,44,0.06);
    border-color: rgba(255,199,44,0.15);
  }
  .mn-settings-icon-wrap {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(255,199,44,0.15);
    border: 1px solid rgba(255,199,44,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative;
    box-shadow: 0 0 12px rgba(255,199,44,0.15);
    color: var(--gold);
  }
  .mn-settings-gear {
    transition: transform 0.5s cubic-bezier(0.34,1.2,0.64,1);
  }
  .mn-settings-btn:hover .mn-settings-gear {
    transform: rotate(60deg);
  }
  .mn-settings-label { flex: 1; position: relative; }
  .mn-settings-arrow {
    color: rgba(255,199,44,0.5); flex-shrink: 0; position: relative;
    transition: transform 0.2s;
  }
  .mn-settings-btn:hover .mn-settings-arrow { transform: translateX(2px); color: var(--gold); }

  /* User area */
  .mn-sidebar-user { padding-top: 10px; border-top: 1px solid rgba(255,199,44,0.08); flex-shrink: 0; }
  .mn-sidebar-user-collapsed { display: flex; justify-content: center; }
  .mn-user-row { display: flex; align-items: center; gap: 8px; padding: 4px 2px; cursor: default; }
  .mn-user-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .mn-user-name  { font-size: 12px; font-weight: 800; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mn-user-email { font-size: 10px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mn-logout-btn {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    background: rgba(218,41,28,0.08); border: 1px solid rgba(218,41,28,0.2);
    display: flex; align-items: center; justify-content: center;
    color: rgba(218,41,28,0.6); cursor: pointer; transition: all 0.2s;
  }
  .mn-logout-btn:hover { background: rgba(218,41,28,0.2); color: var(--red); }
  .mn-signin-btn {
    width: 100%; padding: 11px; border-radius: 11px;
    background: rgba(255,199,44,0.08); border: 1.5px solid rgba(255,199,44,0.2);
    color: var(--gold); font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s;
  }
  .mn-signin-btn:hover { background: rgba(255,199,44,0.15); }
  .mn-signin-btn-icon {
    width: 40px; height: 40px; border-radius: 11px;
    padding: 0; display: flex; align-items: center; justify-content: center;
  }

  /* ── Overlay (mobile) ── */
  .mn-overlay {
    position: fixed; inset: 0; z-index: 40;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
  }
  @media (min-width: 1024px) { .mn-overlay { display: none; } }

  /* ── Main content ── */
  .mn-content {
    flex: 1; min-width: 0;
    overflow-x: hidden;
    display: flex; flex-direction: column;
    padding-bottom: 96px;
    transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  @media (min-width: 1024px) {
    .mn-content { margin-left: var(--content-ml, 272px); }
  }

  /* Top bar */
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
    background: rgba(255,248,231,0.05); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .mn-topbar-menu:hover { color: var(--text); }
  .mn-topbar-center { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; }
  .mn-topbar-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 2px; color: var(--text); line-height: 1; }
  .mn-topbar-sub { font-size: 10px; font-weight: 600; color: var(--muted); margin-top: 1px; }
  .mn-topbar-cart {
    position: relative; flex-shrink: 0;
    width: 40px; height: 40px; border-radius: 12px;
    background: transparent; border: 1px solid transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: white; transition: all 0.2s;
  }
  .mn-topbar-cart:hover { background: var(--red2); transform: scale(1.05); }
  .mn-topbar-cart-badge {
    position: absolute; top: -3px; right: -3px;
    min-width: 18px; height: 18px; padding: 0 4px;
    background: var(--gold); color: #0e0700;
    font-size: 10px; font-weight: 900;
    border-radius: 10px; border: 2px solid #0e0700;
    display: flex; align-items: center; justify-content: center;
    animation: mnPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes mnPop { from{transform:scale(0)} to{transform:scale(1)} }

  /* Search bar */
  .mn-search-bar-wrap {
    position: sticky; top: 0; z-index: 48;
    background: rgba(14,7,0,0.95);
    backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    padding: 12px 20px;
  }
  .mn-search-bar-inner {
    position: relative; display: flex; align-items: center;
    max-width: 600px; margin: 0 auto; width: 100%; gap: 8px;
  }
  .mn-search-bar-icon {
    position: absolute; left: 16px;
    width: 18px; height: 18px;
    color: var(--muted); pointer-events: none;
  }
  .mn-search-bar-input {
    width: 100%; padding: 12px 44px 12px 44px;
    background: rgba(255,248,231,0.05);
    border: 1.5px solid var(--border); border-radius: 14px;
    color: var(--text); font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none; transition: border-color 0.2s, background 0.2s;
    box-sizing: border-box; flex: 1;
  }
  .mn-search-bar-input:focus { border-color: rgba(255,199,44,0.35); background: rgba(255,248,231,0.08); }
  .mn-search-bar-input::placeholder { color: var(--muted); }
  .mn-search-bar-clear {
    position: absolute; right: 12px;
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(255,199,44,0.1); border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--gold); transition: all 0.2s;
  }
  .mn-search-bar-clear:hover { background: rgba(255,199,44,0.2); }

  /* Category pills */
  .mn-cats-wrap {
    position: sticky; top: 61px; z-index: 47;
    background: rgba(14,7,0,0.92); border-bottom: 1px solid var(--border);
    overflow: hidden;
  }
  .mn-cats-scroll {
    display: flex; gap: 10px;
    padding: 10px 20px;
    overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
  }
  .mn-cats-scroll::-webkit-scrollbar { display: none; }
  .mn-cat-pill {
    display: flex; flex-direction: column; align-items: center;
    gap: 5px; padding: 10px 14px; border-radius: 16px;
    background: rgba(255,248,231,0.04);
    border: 1.5px solid rgba(255,248,231,0.08);
    cursor: pointer; flex-shrink: 0; min-width: 60px;
    transition: all 0.22s;
  }
  .mn-cat-pill:hover { background: rgba(255,199,44,0.06); border-color: rgba(255,199,44,0.2); transform: translateY(-1px); }
  .mn-cat-active { background: var(--gold) !important; border-color: var(--gold) !important; box-shadow: 0 6px 20px rgba(255,199,44,0.35); transform: translateY(-2px); }
  .mn-cat-emoji { font-size: 20px; line-height: 1; }
  .mn-cat-label { font-size: 11px; font-weight: 700; white-space: nowrap; color: var(--muted); transition: color 0.2s; }
  .mn-cat-active .mn-cat-label { color: #0e0700; font-weight: 900; }

  /* Info strip */
  .mn-info-strip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 20px;
    background: linear-gradient(90deg, rgba(218,41,28,0.1) 0%, transparent 80%);
    border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .mn-info-left { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--muted); }
  .mn-info-flame { width: 14px; height: 14px; color: #fbbf24; flex-shrink: 0; }
  .mn-info-count { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: var(--gold); }

  /* Grid */
  .mn-grid-wrap { flex: 1; max-width: 1160px; margin: 0 auto; padding: 24px 20px; width: 100%; box-sizing: border-box; }
  .mn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,285px),1fr)); gap: 20px; min-width: 0; }
  .mn-card-wrap { min-width: 0; overflow: hidden; animation: mnCardIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both; }
  @keyframes mnCardIn { from{opacity:0;transform:translateY(22px) scale(0.96)} to{opacity:1;transform:none} }

  /* No results */
  .mn-no-results { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 24px; text-align: center; color: var(--muted); }
  .mn-no-results-text { font-size: 14px; font-weight: 500; }
  .mn-clear-btn { margin-top: 8px; padding: 10px 22px; border-radius: 50px; background: var(--gold); color: #0e0700; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans',sans-serif; font-size: 12px; font-weight: 800; transition: all 0.2s; }
  .mn-clear-btn:hover { background: #e6b025; transform: scale(1.03); }

  /* FAB */
  .mn-fab {
    position: fixed; bottom: 24px; left: 50%; z-index: 50;
    transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 50px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 900;
    box-shadow: 0 8px 32px rgba(218,41,28,0.5), 0 0 0 2px rgba(255,199,44,0.2);
    transition: all 0.2s; white-space: nowrap;
    animation: mnFabIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .mn-fab:hover { background: var(--red2); transform: translateX(-50%) scale(1.04); }
  .mn-fab-count { min-width: 24px; height: 24px; padding: 0 6px; background: var(--gold); color: #0e0700; font-size: 11px; font-weight: 900; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  @keyframes mnFabIn { from{opacity:0;transform:translateX(-50%) translateY(20px) scale(0.9)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }

  /* Loading / state */
  .mn-loading-screen { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; background:var(--dark); font-family:'Plus Jakarta Sans',system-ui,sans-serif; overflow:hidden; }
  .mn-wake-banner { display:flex; align-items:flex-start; gap:12px; padding:14px 18px; border-radius:14px; background:rgba(255,199,44,0.07); border:1px solid rgba(255,199,44,0.18); max-width:300px; }
  .mn-wake-icon { width:20px; height:20px; color:var(--gold); flex-shrink:0; margin-top:1px; }
  .mn-wake-title { font-size:12px; font-weight:800; color:var(--gold); }
  .mn-wake-sub   { font-size:11px; color:var(--muted); margin-top:2px; }
  .mn-state-screen { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:24px; text-align:center; background:var(--dark); font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--text); overflow:hidden; }
  .mn-state-icon { width:64px; height:64px; border-radius:18px; display:flex; align-items:center; justify-content:center; }
  .mn-state-red  { background:rgba(218,41,28,0.1);  border:1px solid rgba(218,41,28,0.2);  color:var(--red); }
  .mn-state-gold { background:rgba(255,199,44,0.08); border:1px solid rgba(255,199,44,0.18); color:var(--gold); }
  .mn-state-title { font-family:'Bebas Neue',sans-serif; font-size:30px; letter-spacing:2px; color:var(--text); }
  .mn-state-sub  { font-size:13px; color:var(--muted); max-width:280px; line-height:1.6; }
  .mn-state-btn  { display:flex; align-items:center; gap:8px; background:var(--red); color:white; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:13px; padding:12px 24px; border-radius:50px; margin-top:4px; box-shadow:0 4px 16px rgba(218,41,28,0.35); transition:all 0.2s; }
  .mn-state-btn:hover { background:var(--red2); transform:scale(1.03); }

  @media (max-width: 640px) {
    .mn-grid-wrap { padding: 16px 12px; }
    .mn-grid { grid-template-columns: 1fr; gap: 16px; }
    .mn-topbar { padding: 10px 14px; }
    .mn-search-bar-wrap { padding: 10px 14px; }
    .mn-cats-wrap { top: 57px; }
    .mn-cats-scroll { padding: 10px 14px; }
    .mn-info-strip { padding: 7px 14px; }
  }
`;
