import { useEffect, useState, useCallback } from "react";
import { getMenu } from "../api/menu.api";
import MenuCard from "../components/MenuCard";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import Footer from "../components/Footer";
import {
  ShoppingBag, ShoppingCart, RefreshCw, UtensilsCrossed, Zap,
  ChevronRight, Flame, Search, SlidersHorizontal, LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Kota", "Chips", "Drinks", "Extras"];

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wakingUp, setWakingUp] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
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
      setMenu(items);
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
    const matchSearch =
      !search || item.name?.toLowerCase().includes(search.toLowerCase());
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
    <div className="menu-root">
      <style>{menuStyles}</style>

      {/* ── Navbar ── */}
      <header className="menu-header">
        <div className="menu-header-inner">
          <div className="menu-brand">
            <div className="brand-badge">
              <img src="/copilot_image_1772714931398.jpeg" alt="Logo" className="h-10 w-10 rounded" />
            </div>
            <div>
              <h1 className="brand-name">KOTABITES</h1>
              <p className="brand-tagline">Fresh · Fast · Fire</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => setShowSearch((s) => !s)}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button className="cart-pill2 icon-btn" onClick={() => navigate("/cart")}>
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
            {isAuth ? (
              <button className="menu-logout-btn" onClick={handleLogout} title={`Sign out (${user?.email ?? ""})`}>
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button className="menu-login-btn" onClick={() => navigate("/login")}>
                Sign In
              </button>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="search-bar-wrap">
            <Search className="search-bar-icon" />
            <input
              autoFocus
              className="search-bar-input"
              placeholder="Search the menu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>
                ×
              </button>
            )}
          </div>
        )}

        <div className="category-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`cat-chip${activeCategory === cat ? " cat-chip-active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* ── Info strip ── */}
      <div className="hero-strip">
        <div className="hero-strip-inner">
          <span className="hero-strip-text">
            <Flame className="w-4 h-4 inline mr-1" style={{ color: "#fbbf24" }} />
            Today&apos;s picks — freshly updated
          </span>
          <span className="hero-strip-count">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      <main className="menu-grid-wrap">
        {filtered.length === 0 ? (
          <div className="no-results">
            <SlidersHorizontal className="w-8 h-8 opacity-40" />
            <p>Nothing matches — try a different filter.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filtered.map((item, i) => (
              <div
                key={item.id ?? i}
                className="menu-card-wrap"
                style={{ "--i": i }}
              >
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

      <Footer />
    </div>
  );
}

const menuStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --red:    #DA291C;
    --red2:   #b91c1c;
    --gold:   #FFC72C;
    --dark:   #0e0700;
    --border: rgba(255,199,44,0.1);
    --text:   #fff8e7;
    --muted:  rgba(255,248,231,0.42);
  }

  .menu-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 40% at 50% 0%, rgba(218,41,28,0.18) 0%, transparent 70%),
      var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding-bottom: 100px;
  }

  /* Loading */
  .menu-loading-screen {
    min-height: 100vh;
    background: var(--dark);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 24px;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  .wakeup-banner {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,199,44,0.07);
    border: 1px solid rgba(255,199,44,0.18);
    border-radius: 14px;
    padding: 14px 20px; max-width: 320px;
  }
  .wakeup-icon { width: 20px; height: 20px; color: var(--gold); flex-shrink: 0; }
  .wakeup-title { font-weight: 700; color: var(--gold); font-size: 13px; }
  .wakeup-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* State screens */
  .menu-state-screen {
    min-height: 100vh; background: var(--dark);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; padding: 24px; text-align: center;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  .state-icon-wrap {
    width: 72px; height: 72px;
    background: rgba(255,199,44,0.08);
    border: 1px solid rgba(255,199,44,0.18);
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    color: var(--gold);
  }
  .error-icon-wrap { background: rgba(218,41,28,0.1); border-color: rgba(218,41,28,0.2); color: var(--red); }
  .state-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 34px; letter-spacing: 3px; color: var(--text);
  }
  .state-sub { color: var(--muted); font-size: 14px; max-width: 280px; line-height: 1.6; }
  .state-btn {
    display: flex; align-items: center; gap: 8px;
    background: var(--red); color: white;
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 14px;
    padding: 12px 26px; border-radius: 50px;
    transition: background 0.2s, transform 0.15s;
    margin-top: 8px;
  }
  .state-btn:hover { background: var(--red2); transform: scale(1.03); }

  /* Header */
  .menu-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(14,7,0,0.94);
    backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 1px solid var(--border);
  }
  .menu-header-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 14px 20px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px;
  }

  /* Brand */
  .menu-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .brand-badge {
    width: 40px; height: 40px;
    background: var(--gold); border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 24px rgba(255,199,44,0.35);
  }
  .brand-flame { color: #0e0700; }
  .brand-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 3px;
    color: var(--text); line-height: 1;
  }
  .brand-tagline {
    font-size: 10px; font-weight: 700;
    color: var(--gold); letter-spacing: 0.18em;
    text-transform: uppercase; margin-top: 1px;
  }

  /* Actions */
  .header-actions { display: flex; align-items: center; gap: 8px; }
  .icon-btn {
    width: 38px; height: 38px;
    background: rgba(255,248,231,0.05);
    border: 1px solid var(--border); border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .icon-btn:hover { color: var(--text); border-color: rgba(255,199,44,0.3); background: rgba(255,199,44,0.07); }
  .cart-pill {
    display: flex; align-items: center; gap: 7px;
    background: var(--red); color: white;
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700; font-size: 13px;
    padding: 8px 16px; border-radius: 50px;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(218,41,28,0.35);
  }
  .cart-pill:hover { background: var(--red2); transform: scale(1.04); }
  .menu-logout-btn { width:38px; height:38px; border-radius:10px; background:rgba(218,41,28,0.08); border:1px solid rgba(218,41,28,0.2); display:flex; align-items:center; justify-content:center; color:rgba(218,41,28,0.6); cursor:pointer; transition:all 0.2s; }
  .menu-logout-btn:hover { background:rgba(218,41,28,0.2); color:var(--red); border-color:rgba(218,41,28,0.4); }
  .menu-login-btn { padding:8px 14px; border-radius:10px; background:rgba(255,199,44,0.08); border:1px solid rgba(255,199,44,0.2); color:var(--gold); font-family:'Plus Jakarta Sans',sans-serif; font-size:12px; font-weight:800; cursor:pointer; transition:all 0.2s; }
  .menu-login-btn:hover { background:rgba(255,199,44,0.15); }
  .cart-badge {
    background: var(--gold); color: #0e0700;
    font-weight: 900; font-size: 11px;
    min-width: 20px; height: 20px;
    border-radius: 50px; padding: 0 5px;
    display: flex; align-items: center; justify-content: center;
    animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }

  /* Search */
  .search-bar-wrap {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 20px; border-top: 1px solid var(--border);
  }
  .search-bar-icon { width: 15px; height: 15px; color: var(--muted); flex-shrink: 0; }
  .search-bar-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .search-bar-input::placeholder { color: var(--muted); }
  .search-clear { color: var(--muted); background: none; border: none; cursor: pointer; font-size: 20px; }

  /* Category chips */
  .category-row {
    display: flex; gap: 7px;
    padding: 10px 20px 14px;
    overflow-x: auto; scrollbar-width: none;
  }
  .category-row::-webkit-scrollbar { display: none; }
  .cat-chip {
    flex-shrink: 0; padding: 6px 16px; border-radius: 50px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; cursor: pointer; transition: all 0.2s;
    background: rgba(255,248,231,0.04);
    border: 1px solid var(--border); color: var(--muted);
  }
  .cat-chip:hover { color: var(--text); border-color: rgba(255,199,44,0.25); }
  .cat-chip-active {
    background: var(--gold); color: #0e0700;
    border-color: var(--gold);
    box-shadow: 0 0 18px rgba(255,199,44,0.28);
  }

  /* Hero strip */
  .hero-strip {
    background: linear-gradient(90deg, rgba(218,41,28,0.12) 0%, transparent 80%);
    border-bottom: 1px solid var(--border);
  }
  .hero-strip-inner {
    max-width: 1200px; margin: 0 auto; padding: 9px 20px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .hero-strip-text { font-size: 12px; font-weight: 600; color: var(--muted); }
  .hero-strip-count { font-size: 12px; font-weight: 800; color: var(--gold); letter-spacing: 0.05em; }

  /* Grid */
  .menu-grid-wrap { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
  .menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
    gap: 20px;
  }
  .menu-card-wrap {
    animation: cardIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both;
    animation-delay: calc(var(--i) * 55ms);
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(22px) scale(0.96); }
    to   { opacity: 1; transform: none; }
  }

  /* No results */
  .no-results {
    text-align: center; padding: 80px 20px;
    color: var(--muted); display: flex; flex-direction: column;
    align-items: center; gap: 12px; font-size: 14px; font-weight: 500;
  }

  /* FAB */
  .fab {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px;
    background: var(--red); color: white;
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 14px;
    padding: 14px 28px; border-radius: 50px;
    box-shadow: 0 8px 32px rgba(218,41,28,0.5), 0 0 0 2px rgba(255,199,44,0.2);
    transition: all 0.25s; z-index: 200;
    animation: fabIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .fab:hover { background: var(--red2); transform: translateX(-50%) scale(1.04); }
  .fab-badge {
    background: var(--gold); color: #0e0700;
    font-size: 12px; font-weight: 900;
    min-width: 22px; height: 22px; border-radius: 50px; padding: 0 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .fab-arrow { opacity: 0.65; }
  @keyframes fabIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  @media (max-width: 600px) {
    .brand-name { font-size: 19px; }
    .menu-grid  { grid-template-columns: 1fr; }
    .fab        { width: calc(100% - 40px); justify-content: center; }
  }
`;
