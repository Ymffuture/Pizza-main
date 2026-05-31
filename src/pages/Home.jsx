import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import Footer from "../components/Footer";
import CoverageSection from "./CoverageSection";
import {
  Search, Clock, ChevronRight, ShieldCheck,
  Zap, Star, MapPin, ArrowRight, X,
  Flame, User, ShoppingBag,
} from "lucide-react";

/* ── Stats ── */
const STATS = [
  { value: "20–30",  unit: "min",  label: "Average delivery" },
  { value: "1.3",    unit: "km",   label: "Delivery radius"  },
  { value: "4.9",    unit: "★",    label: "Customer rating"  },
];

/* ── Features ── */
const FEATURES = [
  {
    Icon: Zap,
    title: "Fast Delivery",
    desc:  "Hot food at your door in under 30 minutes. Every time.",
    color: "#FFC72C",
  },
  {
    Icon: ShieldCheck,
    title: "Freshly Made",
    desc:  "Every kota is made to order — never pre-packed or reheated.",
    color: "#4ade80",
  },
  {
    Icon: Star,
    title: "Best Value",
    desc:  "Quality street food at honest prices. No hidden fees.",
    color: "#60a5fa",
  },
];

export default function Home() {
  const [trackId,  setTrackId]  = useState("");
  const [trackErr, setTrackErr] = useState("");
  const [tracking, setTracking] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { isAuth } = useAuth();

  /* sticky nav shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    const raw = trackId.trim();
    if (!raw) { inputRef.current?.focus(); return; }
    setTrackErr("");
    if (!isAuth) { navigate(`/login?redirect=/order/${encodeURIComponent(raw)}`); return; }
    if (/^[0-9a-fA-F]{24}$/.test(raw)) { navigate(`/order/${raw}`); return; }
    setTracking(true);
    try {
      const res = await axiosClient.get("/orders/search", { params: { short_id: raw } });
      const fullId = res.data?.id;
      if (fullId) navigate(`/order/${fullId}`);
      else setTrackErr("Order not found — try your full Order ID.");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404)       setTrackErr("Order not found. Check the ID and try again.");
      else if (status === 401)  navigate(`/login?redirect=/order/${encodeURIComponent(raw)}`);
      else                      setTrackErr("Could not look up order. Try again shortly.");
    } finally { setTracking(false); }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="hm-root">

        {/* ════════════════════ NAV ════════════════════ */}
        <header className={`hm-nav${scrolled ? " hm-nav-scrolled" : ""}`}>
          <div className="hm-nav-inner">
            {/* Brand */}
            <Link to="/" className="hm-logo">
              <div className="hm-logo-icon">
                <Flame size={18} color="#0e0700" strokeWidth={2.5} />
              </div>
              <span className="hm-logo-text">KotaBites</span>
            </Link>

            {/* Nav links — desktop */}
            <nav className="hm-nav-links">
              <Link to="/menu"     className="hm-nav-link">Menu</Link>
              <Link to="/coverage" className="hm-nav-link">Coverage</Link>
              <Link to="/deliver"  className="hm-nav-link">Deliver with us</Link>
              <Link to="/info"     className="hm-nav-link">Help</Link>
            </nav>

            {/* Actions */}
            <div className="hm-nav-actions">
              {isAuth ? (
                <Link to="/menu" className="hm-nav-order-btn">
                  <ShoppingBag size={15} />
                  Order now
                </Link>
              ) : (
                <>
                  <Link to="/login"    className="hm-nav-link hm-nav-link-muted">Sign in</Link>
                  <Link to="/register" className="hm-nav-order-btn">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ════════════════════ HERO ════════════════════ */}
        <section className="hm-hero">
          {/* Subtle dot grid */}
          <div className="hm-hero-grid" />
          {/* Glow blob */}
          <div className="hm-hero-blob" />

          <div className="hm-hero-inner">

            {/* ── Left copy ── */}
            <div className="hm-hero-copy">
              {/* Badge */}
              <div className="hm-badge">
                <span className="hm-badge-dot" />
                <MapPin size={11} />
                <span>Delivering in Johannesburg</span>
              </div>

              {/* Headline */}
              <h1 className="hm-headline">
                Food that hits<br />
                <span className="hm-headline-accent">different.</span>
              </h1>

              <p className="hm-subline">
                Johannesburg's freshest kota, delivered hot to your door
                in under 30 minutes. No fuss, no waiting.
              </p>

              {/* CTAs */}
              <div className="hm-ctas">
                <Link to="/menu" className="hm-cta-primary">
                  Order now
                  <ArrowRight size={17} />
                </Link>
                <Link to="/coverage" className="hm-cta-ghost">
                  Check coverage
                </Link>
              </div>

              {/* Stats row */}
              <div className="hm-stats">
                {STATS.map(({ value, unit, label }, i) => (
                  <div key={i} className="hm-stat">
                    <p className="hm-stat-value">
                      {value}<span className="hm-stat-unit">{unit}</span>
                    </p>
                    <p className="hm-stat-label">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: track + promo card ── */}
            <div className="hm-hero-right">

              {/* Track order card */}
              <div className="hm-track-card">
                <div className="hm-track-header">
                  <Clock size={16} style={{ color: "#FFC72C" }} />
                  <span className="hm-track-title">Track your order</span>
                </div>
                <p className="hm-track-sub">Paste your Order ID or short code below</p>

                <form onSubmit={handleTrack} className="hm-track-form">
                  <div className={`hm-track-input-wrap${trackErr ? " hm-track-err" : ""}`}>
                    <Search size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
                    <input
                      ref={inputRef}
                      type="text"
                      className="hm-track-input"
                      placeholder="e.g. A1B2C3 or full ID…"
                      value={trackId}
                      onChange={(e) => { setTrackId(e.target.value); setTrackErr(""); }}
                    />
                    {trackId && (
                      <button type="button" className="hm-track-clear" onClick={() => setTrackId("")}>
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {trackErr && <p className="hm-track-error">{trackErr}</p>}

                  <button type="submit" disabled={tracking} className="hm-track-btn">
                    {tracking
                      ? <><span className="hm-spinner" /> Looking up…</>
                      : <><Search size={15} /> Track Order</>}
                  </button>
                </form>

                <div className="hm-track-footer">
                  <ShieldCheck size={11} style={{ color: "#4ade80" }} />
                  <span>Secure · real-time updates</span>
                </div>
              </div>

              {/* Promo chip */}
              <div className="hm-promo-chip">
                <Flame size={14} style={{ color: "#FFC72C" }} />
                <span>Free delivery on your first order 🎉</span>
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════ FEATURES ════════════════════ */}
        <section className="hm-features">
          <div className="hm-features-inner">
            <div className="hm-section-label">Why KotaBites</div>
            <h2 className="hm-section-title">Built around you</h2>
            <div className="hm-features-grid">
              {FEATURES.map(({ Icon, title, desc, color }) => (
                <div key={title} className="hm-feature-card">
                  <div className="hm-feature-icon" style={{ background: `${color}14`, border: `1px solid ${color}25` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="hm-feature-title">{title}</h3>
                  <p className="hm-feature-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════ POLICY NOTICE ════════════════════ */}
        <section className="hm-policy-section">
          <div className="hm-policy-inner">
            <div className="hm-policy-card" onClick={() => navigate("/info")}>
              <div className="hm-policy-left">
                <div className="hm-policy-icon">
                  <ShieldCheck size={20} style={{ color: "#FFC72C" }} />
                </div>
                <div>
                  <div className="hm-policy-heading">
                    <span className="hm-policy-title">Cancellation Policy</span>
                    <span className="hm-policy-new">Updated</span>
                  </div>
                  <p className="hm-policy-desc">
                    5 free cancellations per month · R20 charge after limit · Cancellations via KotaBot only
                  </p>
                </div>
              </div>
              <div className="hm-policy-cta">
                Read policy <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════ HOW IT WORKS ════════════════════ */}
        <section className="hm-how">
          <div className="hm-how-inner">
            <div className="hm-section-label">How it works</div>
            <h2 className="hm-section-title">Order in 3 steps</h2>
            <div className="hm-how-steps">
              {[
                { n: "01", title: "Browse the menu",   desc: "Pick your kota, add sides and drinks"  },
                { n: "02", title: "Pay securely",       desc: "Cash on delivery or pay online via Paystack" },
                { n: "03", title: "Track & enjoy",      desc: "Live order tracking until it hits your door" },
              ].map(({ n, title, desc }) => (
                <div key={n} className="hm-how-step">
                  <span className="hm-how-num">{n}</span>
                  <h3 className="hm-how-title">{title}</h3>
                  <p className="hm-how-desc">{desc}</p>
                </div>
              ))}
            </div>
            <Link to="/menu" className="hm-cta-primary hm-cta-center">
              Start your order <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {/* ════════════════════ COVERAGE + FOOTER ════════════════════ */}
        <CoverageSection />
        <Footer />
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════ */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

  :root {
    --red:    #DA291C;
    --red2:   #b91c1c;
    --gold:   #FFC72C;
    --dark:   #0a0600;
    --card:   #130c00;
    --card2:  #1a1000;
    --border: rgba(255,199,44,0.1);
    --text:   #fff8e7;
    --muted:  rgba(255,248,231,0.42);
    --faint:  rgba(255,248,231,0.08);
  }

  /* ── Root ── */
  .hm-root {
    min-height: 100vh;
    background: var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .hm-nav {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 100;
    background: transparent;
    transition: background 0.25s, box-shadow 0.25s;
  }
  .hm-nav-scrolled {
    background: rgba(10, 6, 0, 0.92);
    backdrop-filter: blur(20px) saturate(1.4);
    box-shadow: 0 1px 0 rgba(255,199,44,0.08);
  }
  .hm-nav-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 28px;
    height: 64px;
    display: flex; align-items: center; gap: 0;
  }

  /* Logo */
  .hm-logo {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none; flex-shrink: 0;
    margin-right: 40px;
  }
  .hm-logo-icon {
    width: 32px; height: 32px; border-radius: 9px;
    background: var(--gold); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 16px rgba(255,199,44,0.3);
  }
  .hm-logo-text {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 3px; color: var(--text); line-height: 1;
  }

  /* Nav links */
  .hm-nav-links {
    display: flex; align-items: center; gap: 4px; flex: 1;
  }
  .hm-nav-link {
    padding: 8px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    color: var(--muted); text-decoration: none;
    transition: color 0.18s, background 0.18s;
    white-space: nowrap;
  }
  .hm-nav-link:hover { color: var(--text); background: var(--faint); }
  .hm-nav-link-muted { color: rgba(255,248,231,0.35); }

  /* Actions */
  .hm-nav-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .hm-nav-order-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 20px; border-radius: 50px;
    background: var(--gold); color: #0a0600;
    font-size: 13px; font-weight: 800;
    text-decoration: none; transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(255,199,44,0.25);
  }
  .hm-nav-order-btn:hover { background: #e6b025; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,199,44,0.35); }

  @media (max-width: 768px) {
    .hm-nav-links { display: none; }
    .hm-nav-inner { padding: 0 20px; }
  }

  /* ── HERO ── */
  .hm-hero {
    position: relative;
    min-height: 100vh;
    display: flex; align-items: center;
    padding: 80px 28px 60px;
    overflow: hidden;
  }

  /* Dot grid */
  .hm-hero-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(255,199,44,0.08) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%);
  }

  /* Glow blob */
  .hm-hero-blob {
    position: absolute; pointer-events: none;
    width: 700px; height: 700px;
    top: -180px; left: -120px;
    background: radial-gradient(circle, rgba(218,41,28,0.14) 0%, transparent 65%);
    filter: blur(40px);
  }

  .hm-hero-inner {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto; width: 100%;
    display: grid; grid-template-columns: 1fr 420px;
    gap: 60px; align-items: center;
  }

  /* ── Copy ── */
  .hm-hero-copy { display: flex; flex-direction: column; gap: 28px; }

  .hm-badge {
    display: inline-flex; align-items: center; gap: 7px;
    width: fit-content;
    padding: 7px 14px; border-radius: 50px;
    background: rgba(255,199,44,0.08);
    border: 1px solid rgba(255,199,44,0.2);
    font-size: 12px; font-weight: 700;
    color: rgba(255,248,231,0.65);
    letter-spacing: 0.02em;
  }
  .hm-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 8px rgba(74,222,128,0.7);
    animation: hmDotPulse 1.6s ease infinite;
    flex-shrink: 0;
  }
  @keyframes hmDotPulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: 0.5; transform: scale(1.4); }
  }

  .hm-headline {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(52px, 6.5vw, 84px);
    font-weight: 900;
    color: var(--text);
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin: 0;
  }
  .hm-headline-accent {
    color: var(--gold);
    font-style: italic;
  }

  .hm-subline {
    font-size: clamp(15px, 1.6vw, 17px);
    color: var(--muted);
    line-height: 1.7;
    max-width: 480px;
    margin: 0;
    font-weight: 400;
  }

  /* CTAs */
  .hm-ctas { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .hm-cta-primary {
    display: inline-flex; align-items: center; gap: 9px;
    padding: 15px 32px; border-radius: 50px;
    background: var(--red); color: #fff;
    font-size: 15px; font-weight: 800;
    text-decoration: none;
    box-shadow: 0 8px 28px rgba(218,41,28,0.4), 0 0 0 1px rgba(255,199,44,0.12);
    transition: all 0.22s;
    border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .hm-cta-primary:hover { background: var(--red2); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(218,41,28,0.5); }
  .hm-cta-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 15px 28px; border-radius: 50px;
    background: transparent;
    border: 1.5px solid rgba(255,248,231,0.15);
    color: var(--muted); font-size: 15px; font-weight: 700;
    text-decoration: none; transition: all 0.2s;
  }
  .hm-cta-ghost:hover { border-color: rgba(255,248,231,0.35); color: var(--text); }

  .hm-cta-center { margin: 32px auto 0; width: fit-content; display: flex; }

  /* Stats */
  .hm-stats {
    display: flex; gap: 32px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,248,231,0.07);
  }
  .hm-stat { display: flex; flex-direction: column; gap: 3px; }
  .hm-stat-value {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 28px; font-weight: 900;
    color: var(--text); line-height: 1;
    letter-spacing: -0.02em;
  }
  .hm-stat-unit { font-size: 14px; font-weight: 700; color: var(--gold); margin-left: 3px; }
  .hm-stat-label { font-size: 12px; font-weight: 600; color: var(--muted); }

  /* ── Hero right ── */
  .hm-hero-right { display: flex; flex-direction: column; gap: 14px; }

  /* Track card */
  .hm-track-card {
    background: var(--card2);
    border: 1px solid rgba(255,199,44,0.12);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,248,231,0.04);
  }
  .hm-track-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 6px;
  }
  .hm-track-title { font-size: 15px; font-weight: 800; color: var(--text); }
  .hm-track-sub   { font-size: 12px; color: var(--muted); margin-bottom: 18px; line-height: 1.5; }

  .hm-track-form { display: flex; flex-direction: column; gap: 10px; }
  .hm-track-input-wrap {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,248,231,0.05);
    border: 1.5px solid rgba(255,248,231,0.1);
    border-radius: 12px; padding: 0 14px;
    transition: border-color 0.2s, background 0.2s;
  }
  .hm-track-input-wrap:focus-within {
    border-color: rgba(255,199,44,0.4);
    background: rgba(255,248,231,0.08);
  }
  .hm-track-err { border-color: rgba(218,41,28,0.5) !important; }
  .hm-track-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 13px 0;
  }
  .hm-track-input::placeholder { color: var(--muted); }
  .hm-track-clear {
    background: none; border: none; cursor: pointer;
    color: var(--muted); display: flex; align-items: center;
    padding: 0; transition: color 0.15s; flex-shrink: 0;
  }
  .hm-track-clear:hover { color: var(--text); }
  .hm-track-error { font-size: 11px; font-weight: 700; color: #f87171; padding-left: 4px; }
  .hm-track-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px;
    background: var(--gold); color: #0a0600;
    border: none; border-radius: 12px; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 900;
    box-shadow: 0 4px 18px rgba(255,199,44,0.3);
    transition: all 0.2s;
  }
  .hm-track-btn:hover:not(:disabled) { background: #e6b025; transform: translateY(-1px); }
  .hm-track-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .hm-track-footer {
    display: flex; align-items: center; gap: 6px;
    margin-top: 14px; padding-top: 14px;
    border-top: 1px solid rgba(255,248,231,0.06);
    font-size: 11px; font-weight: 600;
    color: rgba(74,222,128,0.6);
  }

  @keyframes hmSpin { to { transform: rotate(360deg); } }
  .hm-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(10,6,0,0.25);
    border-top-color: #0a0600;
    animation: hmSpin 0.7s linear infinite;
    display: inline-block;
  }

  /* Promo chip */
  .hm-promo-chip {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,199,44,0.07);
    border: 1px solid rgba(255,199,44,0.18);
    border-radius: 50px; padding: 10px 18px;
    font-size: 13px; font-weight: 700;
    color: rgba(255,248,231,0.65);
  }

  /* ── FEATURES ── */
  .hm-features { padding: 96px 28px; }
  .hm-features-inner { max-width: 1100px; margin: 0 auto; }
  .hm-section-label {
    font-size: 11px; font-weight: 800;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 10px;
  }
  .hm-section-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: 900; letter-spacing: -0.025em;
    color: var(--text); margin: 0 0 44px;
    line-height: 1.1;
  }
  .hm-features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  .hm-feature-card {
    background: var(--card2);
    border: 1px solid rgba(255,248,231,0.06);
    border-radius: 18px; padding: 28px 24px;
    display: flex; flex-direction: column; gap: 12px;
    transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
  }
  .hm-feature-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,199,44,0.15);
    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  }
  .hm-feature-icon {
    width: 48px; height: 48px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center;
  }
  .hm-feature-title { font-size: 17px; font-weight: 800; color: var(--text); margin: 0; }
  .hm-feature-desc  { font-size: 13px; color: var(--muted); line-height: 1.65; margin: 0; }

  /* ── POLICY NOTICE ── */
  .hm-policy-section { padding: 0 28px 72px; }
  .hm-policy-inner   { max-width: 1100px; margin: 0 auto; }
  .hm-policy-card {
    display: flex; align-items: center; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    background: rgba(255,199,44,0.04);
    border: 1px solid rgba(255,199,44,0.14);
    border-radius: 16px; padding: 20px 24px;
    cursor: pointer; transition: all 0.2s;
  }
  .hm-policy-card:hover { background: rgba(255,199,44,0.07); border-color: rgba(255,199,44,0.25); }
  .hm-policy-left  { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
  .hm-policy-icon  {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: rgba(255,199,44,0.1); border: 1px solid rgba(255,199,44,0.2);
    display: flex; align-items: center; justify-content: center;
  }
  .hm-policy-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .hm-policy-title { font-size: 14px; font-weight: 800; color: var(--text); }
  .hm-policy-new {
    font-size: 9px; font-weight: 900; letter-spacing: 0.1em;
    text-transform: uppercase;
    background: rgba(255,199,44,0.18); color: var(--gold);
    border: 1px solid rgba(255,199,44,0.3);
    padding: 2px 8px; border-radius: 50px;
  }
  .hm-policy-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }
  .hm-policy-cta  {
    display: flex; align-items: center; gap: 5px; flex-shrink: 0;
    font-size: 13px; font-weight: 700; color: var(--gold);
    white-space: nowrap;
  }

  /* ── HOW IT WORKS ── */
  .hm-how { padding: 0 28px 96px; }
  .hm-how-inner { max-width: 1100px; margin: 0 auto; }
  .hm-how-steps {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 18px; margin-bottom: 0;
  }
  .hm-how-step {
    display: flex; flex-direction: column; gap: 10px;
    padding: 28px 24px;
    background: var(--card2);
    border: 1px solid rgba(255,248,231,0.05);
    border-radius: 18px;
    position: relative; overflow: hidden;
  }
  .hm-how-step::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--red), var(--gold));
    opacity: 0.4;
  }
  .hm-how-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 40px; letter-spacing: 2px;
    color: rgba(255,199,44,0.15); line-height: 1;
  }
  .hm-how-title { font-size: 16px; font-weight: 800; color: var(--text); }
  .hm-how-desc  { font-size: 13px; color: var(--muted); line-height: 1.6; }

  /* ── Responsive ── */
  @media (max-width: 960px) {
    .hm-hero-inner   { grid-template-columns: 1fr; gap: 48px; padding-top: 32px; }
    .hm-hero-right   { max-width: 480px; }
    .hm-hero         { min-height: auto; padding: 100px 28px 60px; }
    .hm-features-grid, .hm-how-steps { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .hm-hero         { padding: 80px 20px 48px; }
    .hm-features, .hm-policy-section, .hm-how { padding-left: 20px; padding-right: 20px; }
    .hm-features-grid, .hm-how-steps { grid-template-columns: 1fr; }
    .hm-stats        { gap: 20px; flex-wrap: wrap; }
    .hm-ctas         { flex-direction: column; align-items: flex-start; }
    .hm-policy-card  { flex-direction: column; align-items: flex-start; }
    .hm-headline     { font-size: 44px; }
  }
`;
