// src/pages/ClientWallet.jsx — Customer Rewards Wallet
// Points system: R1 spent = 1 point. Redeem when points >= 50 (minimum claim = R50 value).
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/orders.api";
import {
  Flame, Star, Gift, ShoppingBag, ArrowLeft, ChevronRight,
  Zap, Trophy, Lock, CheckCircle2, Clock, TrendingUp,
  Loader, Info, Copy, Check, RefreshCw,
} from "lucide-react";

// ── Tier config ─────────────────────────────────────────────────────────────
const TIERS = [
  { name: "Bronze",   min: 0,    max: 499,  color: "#cd7f32", bg: "rgba(205,127,50,0.12)",  border: "rgba(205,127,50,0.3)",  icon: "🥉" },
  { name: "Silver",   min: 500,  max: 1499, color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)", icon: "🥈" },
  { name: "Gold",     min: 1500, max: 2999, color: "#FFC72C", bg: "rgba(255,199,44,0.12)",  border: "rgba(255,199,44,0.3)",  icon: "🥇" },
  { name: "Platinum", min: 3000, max: Infinity, color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)", icon: "💎" },
];

const REDEEM_OPTIONS = [
  { points: 50,   label: "R50 Off",   desc: "Deduct from your next order" },
  { points: 100,  label: "R100 Off",  desc: "Perfect for a big kota order" },
  { points: 200,  label: "R200 Off",  desc: "Free meal on us!" },
];

const STORAGE_KEY = "kb_redeemed_points";

function getTier(points) {
  return TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0];
}

function getNextTier(points) {
  return TIERS.find(t => t.min > points) || null;
}

function getRedeemedPoints() {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10); }
  catch { return 0; }
}

function saveRedeemedPoints(n) {
  try { localStorage.setItem(STORAGE_KEY, String(n)); } catch { /* */ }
}

export default function ClientWallet() {
  const navigate = useNavigate();
  const { isAuth, user } = useAuth();

  const [loading,     setLoading]     = useState(true);
  const [orders,      setOrders]      = useState([]);
  const [error,       setError]       = useState(null);
  const [redeemed,    setRedeemed]    = useState(getRedeemedPoints);
  const [claiming,    setClaiming]    = useState(null);
  const [claimedCode, setClaimedCode] = useState(null);
  const [copied,      setCopied]      = useState(false);
  const [tab,         setTab]         = useState("overview");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrders();
      const all = Array.isArray(res.data) ? res.data : [];
      // Only count delivered orders
      const delivered = all.filter(o => o.status === "delivered");
      setOrders(delivered);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Could not load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuth) load();
  }, [isAuth]);

  // Points earned = sum of delivered order totals (R1 = 1 point)
  const earnedPoints = Math.floor(orders.reduce((sum, o) => sum + (o.total_amount || 0), 0));
  const availablePoints = Math.max(0, earnedPoints - redeemed);
  const tier = getTier(earnedPoints);
  const nextTier = getNextTier(earnedPoints);
  const tierProgress = nextTier
    ? Math.min(100, Math.round(((earnedPoints - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;

  const handleClaim = async (option) => {
    if (availablePoints < option.points) return;
    setClaiming(option.points);
    await new Promise(r => setTimeout(r, 1200)); // simulate processing

    const code = `KB${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const newRedeemed = redeemed + option.points;
    setRedeemed(newRedeemed);
    saveRedeemedPoints(newRedeemed);
    setClaimedCode({ code, label: option.label, points: option.points });
    setClaiming(null);
    setTab("overview");
  };

  const copyCode = async () => {
    if (!claimedCode?.code) return;
    try {
      await navigator.clipboard.writeText(claimedCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* */ }
  };

  /* ── Unauthenticated ── */
  if (!isAuth) return (
    <div className="cw-root"><style>{styles}</style>
      <div className="cw-center">
        <div className="cw-gate-icon">⭐</div>
        <h2 className="cw-big-title">Rewards Wallet</h2>
        <p className="cw-sub">Sign in to track your KotaPoints and claim rewards.</p>
        <Link to="/login?redirect=/rewards" className="cw-red-btn">Sign In</Link>
      </div>
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <div className="cw-root"><style>{styles}</style>
      <div className="cw-center">
        <Loader className="cw-spin" style={{ width: 36, height: 36, color: "#FFC72C" }} />
        <p className="cw-sub">Loading your rewards…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="cw-root"><style>{styles}</style>
      <div className="cw-center">
        <div className="cw-gate-icon">⚠️</div>
        <h2 className="cw-big-title">Couldn't Load</h2>
        <p className="cw-sub">{error}</p>
        <button className="cw-red-btn" onClick={load}><RefreshCw className="w-4 h-4" /> Retry</button>
      </div>
    </div>
  );

  return (
    <div className="cw-root">
      <style>{styles}</style>

      {/* Header */}
      <header className="cw-header">
        <div className="cw-header-inner">
          <button className="cw-back-btn" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
          <div className="cw-hbrand">
            <div className="cw-logo"><Flame className="w-4 h-4" style={{ color: "#0e0700" }} /></div>
            <span className="cw-brand">KOTAPOINTS</span>
          </div>
          <span className="cw-tier-pill" style={{ background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }}>
            {tier.icon} {tier.name}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="cw-tabs">
        {["overview", "redeem", "history"].map(t => (
          <button key={t} className={`cw-tab${tab === t ? " cw-tab-active" : ""}`} onClick={() => setTab(t)}>
            {t === "overview" && <Star        className="w-4 h-4" />}
            {t === "redeem"   && <Gift        className="w-4 h-4" />}
            {t === "history"  && <ShoppingBag className="w-4 h-4" />}
            <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
          </button>
        ))}
      </div>

      <div className="cw-body">

        {/* ═══════════ OVERVIEW ═══════════ */}
        {tab === "overview" && (
          <>
            {/* Claimed code banner */}
            {claimedCode && (
              <div className="cw-claimed-card">
                <div className="cw-claimed-icon"><CheckCircle2 className="w-6 h-6" style={{ color: "#4ade80" }} /></div>
                <div className="cw-claimed-info">
                  <p className="cw-claimed-title">{claimedCode.label} claimed!</p>
                  <p className="cw-claimed-sub">Use code at checkout · {claimedCode.points} pts redeemed</p>
                  <div className="cw-code-row">
                    <span className="cw-code">{claimedCode.code}</span>
                    <button className="cw-copy-btn" onClick={copyCode}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <button className="cw-dismiss-btn" onClick={() => setClaimedCode(null)}>×</button>
              </div>
            )}

            {/* Points Hero */}
            <div className="cw-hero" style={{ "--tier-color": tier.color }}>
              <div className="cw-hero-glow" style={{ background: `radial-gradient(circle, ${tier.color}20 0%, transparent 70%)` }} />
              <div className="cw-hero-badge" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                <span style={{ fontSize: 28 }}>{tier.icon}</span>
              </div>
              <div className="cw-hero-pts">
                <span className="cw-pts-num">{availablePoints.toLocaleString()}</span>
                <span className="cw-pts-label">KotaPoints available</span>
              </div>
              <div className="cw-hero-stats">
                <div className="cw-hero-stat">
                  <span className="cw-hs-val">{earnedPoints.toLocaleString()}</span>
                  <span className="cw-hs-lbl">Total earned</span>
                </div>
                <div className="cw-hs-div" />
                <div className="cw-hero-stat">
                  <span className="cw-hs-val">{redeemed.toLocaleString()}</span>
                  <span className="cw-hs-lbl">Redeemed</span>
                </div>
                <div className="cw-hs-div" />
                <div className="cw-hero-stat">
                  <span className="cw-hs-val">{orders.length}</span>
                  <span className="cw-hs-lbl">Orders</span>
                </div>
              </div>
            </div>

            {/* Tier Card */}
            <div className="cw-card">
              <div className="cw-card-label"><Trophy className="w-4 h-4" style={{ color: tier.color }} /> Your Tier</div>
              <div className="cw-tier-row">
                <div className="cw-tier-info">
                  <p className="cw-tier-name" style={{ color: tier.color }}>{tier.icon} {tier.name}</p>
                  <p className="cw-tier-pts">{earnedPoints.toLocaleString()} pts earned</p>
                </div>
                {nextTier && (
                  <div className="cw-tier-next">
                    <p className="cw-tier-next-label">Next: {nextTier.icon} {nextTier.name}</p>
                    <p className="cw-tier-next-pts">{(nextTier.min - earnedPoints).toLocaleString()} pts away</p>
                  </div>
                )}
              </div>
              {nextTier && (
                <div className="cw-progress-wrap">
                  <div className="cw-progress-track">
                    <div className="cw-progress-fill" style={{ width: `${tierProgress}%`, background: tier.color }} />
                  </div>
                  <span className="cw-progress-pct" style={{ color: tier.color }}>{tierProgress}%</span>
                </div>
              )}
              {!nextTier && (
                <div className="cw-max-tier">
                  <Zap className="w-4 h-4" style={{ color: "#60a5fa" }} />
                  <span>Maximum tier reached! You're a KotaBites VIP 💎</span>
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="cw-card">
              <div className="cw-card-label"><Info className="w-4 h-4" style={{ color: "#FFC72C" }} /> How KotaPoints Work</div>
              <div className="cw-how-grid">
                {[
                  { emoji: "🛒", title: "Order food",         sub: "Place any order on KotaBites" },
                  { emoji: "💰", title: "Earn 1pt per R1",    sub: "Points added after delivery" },
                  { emoji: "🎁", title: "Claim rewards",       sub: "50+ pts = redeem for discount" },
                  { emoji: "⬆️", title: "Level up",           sub: "Unlock better perks each tier" },
                ].map(({ emoji, title, sub }) => (
                  <div key={title} className="cw-how-item">
                    <span className="cw-how-emoji">{emoji}</span>
                    <p className="cw-how-title">{title}</p>
                    <p className="cw-how-sub">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick redeem CTA */}
            {availablePoints >= 50 && (
              <button className="cw-redeem-cta" onClick={() => setTab("redeem")}>
                <Gift className="w-5 h-5" />
                Claim a reward with {availablePoints} pts
                <ChevronRight className="w-4 h-4" style={{ marginLeft: "auto" }} />
              </button>
            )}
            {availablePoints < 50 && (
              <div className="cw-earn-cta">
                <TrendingUp className="w-4 h-4" style={{ color: "#FFC72C", flexShrink: 0 }} />
                <div>
                  <p className="cw-earn-title">Keep ordering to unlock rewards</p>
                  <p className="cw-earn-sub">
                    You need <strong style={{ color: "#FFC72C" }}>{50 - availablePoints} more points</strong> to claim your first reward.
                  </p>
                </div>
                <Link to="/menu" className="cw-order-btn">Order Now</Link>
              </div>
            )}
          </>
        )}

        {/* ═══════════ REDEEM ═══════════ */}
        {tab === "redeem" && (
          <>
            <div className="cw-pts-bar">
              <Star className="w-4 h-4" style={{ color: "#FFC72C" }} />
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Available:</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#FFC72C", letterSpacing: 1 }}>
                {availablePoints.toLocaleString()} pts
              </span>
            </div>

            <div className="cw-redeem-list">
              {REDEEM_OPTIONS.map(opt => {
                const canClaim = availablePoints >= opt.points;
                const isClaiming = claiming === opt.points;
                return (
                  <div key={opt.points} className={`cw-redeem-card${canClaim ? " cw-redeem-available" : " cw-redeem-locked"}`}>
                    <div className="cw-redeem-left">
                      <div className="cw-redeem-icon-wrap" style={{ background: canClaim ? "rgba(255,199,44,0.15)" : "rgba(255,248,231,0.04)" }}>
                        {canClaim ? <Gift className="w-6 h-6" style={{ color: "#FFC72C" }} /> : <Lock className="w-6 h-6" style={{ color: "var(--muted)" }} />}
                      </div>
                      <div>
                        <p className="cw-redeem-label">{opt.label}</p>
                        <p className="cw-redeem-desc">{opt.desc}</p>
                        <p className="cw-redeem-cost">
                          <Star className="w-3 h-3" style={{ color: canClaim ? "#FFC72C" : "var(--muted)" }} />
                          {opt.points} KotaPoints
                        </p>
                      </div>
                    </div>
                    <button
                      className={`cw-claim-btn${canClaim ? " cw-claim-available" : " cw-claim-locked"}`}
                      onClick={() => canClaim && handleClaim(opt)}
                      disabled={!canClaim || isClaiming || claiming !== null}
                    >
                      {isClaiming ? (
                        <Loader className="w-4 h-4 cw-spin" />
                      ) : canClaim ? (
                        "Claim"
                      ) : (
                        `${opt.points - availablePoints} more`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cw-redeem-note">
              <Info className="w-4 h-4" style={{ color: "var(--muted)", flexShrink: 0 }} />
              <p>Redemption codes are generated instantly and valid for 30 days. Share the code with our team when placing your next order.</p>
            </div>
          </>
        )}

        {/* ═══════════ HISTORY ═══════════ */}
        {tab === "history" && (
          <>
            {orders.length === 0 ? (
              <div className="cw-empty">
                <ShoppingBag className="w-10 h-10" style={{ color: "var(--muted)" }} />
                <p>No delivered orders yet</p>
                <span>Points are earned on completed deliveries</span>
                <Link to="/menu" className="cw-red-btn" style={{ marginTop: 4 }}>
                  <ShoppingBag className="w-4 h-4" /> Order Now
                </Link>
              </div>
            ) : (
              <div className="cw-history-list">
                <div className="cw-history-header">
                  <span>Order</span>
                  <span>Amount</span>
                  <span style={{ textAlign: "right" }}>Points</span>
                </div>
                {orders.slice().reverse().map(order => {
                  const pts = Math.floor(order.total_amount || 0);
                  const date = new Date(order.created_at);
                  return (
                    <div key={order.id} className="cw-history-row">
                      <div className="cw-history-order">
                        <span className="cw-history-id">#{String(order.id).slice(-8).toUpperCase()}</span>
                        <span className="cw-history-date">
                          {date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <span className="cw-history-amount">R{(order.total_amount || 0).toFixed(2)}</span>
                      <div className="cw-history-pts">
                        <Star className="w-3 h-3" style={{ color: "#FFC72C" }} />
                        <span>+{pts}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="cw-history-total">
                  <span>Total earned</span>
                  <span style={{ color: "#FFC72C", fontWeight: 900 }}>⭐ {earnedPoints.toLocaleString()} pts</span>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root{--red:#DA291C;--red2:#b91c1c;--gold:#FFC72C;--dark:#0e0700;--card:#1a0e00;--border:rgba(255,199,44,0.1);--text:#fff8e7;--muted:rgba(255,248,231,0.42);}
  .cw-root{min-height:100vh;background:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(255,199,44,0.1) 0%,transparent 60%),var(--dark);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--text);padding-bottom:60px;}

  /* Center screens */
  .cw-center{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:40px 24px;}
  .cw-gate-icon{font-size:56px;filter:drop-shadow(0 0 20px rgba(255,199,44,0.4));}
  .cw-big-title{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:2px;margin:0;}
  .cw-sub{font-size:14px;color:var(--muted);max-width:280px;line-height:1.6;margin:0;}
  .cw-red-btn{display:inline-flex;align-items:center;gap:8px;background:var(--red);color:white;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:900;font-size:15px;padding:13px 28px;border-radius:50px;text-decoration:none;box-shadow:0 6px 20px rgba(218,41,28,0.4);transition:all 0.2s;}
  .cw-red-btn:hover{background:var(--red2);transform:scale(1.03);}
  @keyframes cwSpin{to{transform:rotate(360deg);}}.cw-spin{animation:cwSpin 0.8s linear infinite;}

  /* Header */
  .cw-header{position:sticky;top:0;z-index:100;background:rgba(14,7,0,0.95);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
  .cw-header-inner{max-width:680px;margin:0 auto;padding:13px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .cw-back-btn{width:36px;height:36px;border-radius:10px;flex-shrink:0;background:rgba(255,248,231,0.05);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:all 0.2s;}
  .cw-back-btn:hover{color:var(--text);}
  .cw-hbrand{display:flex;align-items:center;gap:8px;}
  .cw-logo{width:32px;height:32px;background:var(--gold);border-radius:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(255,199,44,0.3);}
  .cw-brand{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:3px;color:var(--text);}
  .cw-tier-pill{padding:5px 12px;border-radius:50px;font-size:11px;font-weight:800;}

  /* Tabs */
  .cw-tabs{display:flex;background:rgba(14,7,0,0.9);border-bottom:1px solid var(--border);max-width:680px;margin:0 auto;padding:0 16px;overflow-x:auto;scrollbar-width:none;}
  .cw-tabs::-webkit-scrollbar{display:none;}
  .cw-tab{display:flex;align-items:center;gap:6px;padding:12px 18px;cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);font-size:13px;font-weight:700;transition:all 0.2s;white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif;}
  .cw-tab:hover{color:var(--text);}
  .cw-tab-active{color:var(--gold);border-bottom-color:var(--gold);}

  /* Body */
  .cw-body{max-width:680px;margin:0 auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px;}

  /* Claimed code banner */
  .cw-claimed-card{background:linear-gradient(135deg,rgba(74,222,128,0.1) 0%,var(--card) 70%);border:1px solid rgba(74,222,128,0.3);border-radius:18px;padding:18px;display:flex;align-items:flex-start;gap:14px;animation:cwFadeUp 0.4s ease;}
  @keyframes cwFadeUp{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
  .cw-claimed-icon{width:44px;height:44px;border-radius:12px;background:rgba(74,222,128,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .cw-claimed-info{flex:1;min-width:0;}
  .cw-claimed-title{font-size:14px;font-weight:800;color:var(--text);}
  .cw-claimed-sub{font-size:12px;color:var(--muted);margin-top:2px;}
  .cw-code-row{display:flex;align-items:center;gap:10px;margin-top:10px;}
  .cw-code{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:#4ade80;}
  .cw-copy-btn{display:flex;align-items:center;gap:5px;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.3);border-radius:8px;padding:5px 10px;color:#4ade80;font-size:11px;font-weight:800;cursor:pointer;transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
  .cw-copy-btn:hover{background:rgba(74,222,128,0.25);}
  .cw-dismiss-btn{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1;flex-shrink:0;padding:0 4px;}

  /* Points Hero */
  .cw-hero{position:relative;overflow:hidden;background:var(--card);border:1px solid var(--border);border-radius:24px;padding:32px 24px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;}
  .cw-hero-glow{position:absolute;inset:0;pointer-events:none;}
  .cw-hero-badge{width:72px;height:72px;border-radius:20px;display:flex;align-items:center;justify-content:center;position:relative;}
  .cw-pts-num{font-family:'Bebas Neue',sans-serif;font-size:64px;letter-spacing:-1px;color:var(--text);line-height:1;position:relative;}
  .cw-pts-label{font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);position:relative;}
  .cw-hero-stats{display:flex;align-items:center;gap:20px;padding-top:16px;border-top:1px solid var(--border);width:100%;justify-content:center;position:relative;}
  .cw-hero-stat{display:flex;flex-direction:column;align-items:center;gap:3px;}
  .cw-hs-val{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:0.5px;color:var(--text);}
  .cw-hs-lbl{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;}
  .cw-hs-div{width:1px;height:28px;background:var(--border);}

  /* Tier Card */
  .cw-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px 20px;display:flex;flex-direction:column;gap:14px;}
  .cw-card-label{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold);}
  .cw-tier-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .cw-tier-info{}
  .cw-tier-name{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:2px;}
  .cw-tier-pts{font-size:12px;color:var(--muted);margin-top:2px;}
  .cw-tier-next{text-align:right;}
  .cw-tier-next-label{font-size:12px;font-weight:700;color:var(--text);}
  .cw-tier-next-pts{font-size:11px;color:var(--muted);margin-top:2px;}
  .cw-progress-wrap{display:flex;align-items:center;gap:12px;}
  .cw-progress-track{flex:1;height:8px;background:rgba(255,248,231,0.07);border-radius:4px;overflow:hidden;}
  .cw-progress-fill{height:100%;border-radius:4px;transition:width 0.6s ease;}
  .cw-progress-pct{font-size:12px;font-weight:800;flex-shrink:0;}
  .cw-max-tier{display:flex;align-items:center;gap:8px;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.25);border-radius:10px;padding:10px 14px;font-size:12px;font-weight:700;color:#60a5fa;}

  /* How It Works */
  .cw-how-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
  .cw-how-item{background:rgba(255,248,231,0.03);border:1px solid var(--border);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px;}
  .cw-how-emoji{font-size:24px;line-height:1;}
  .cw-how-title{font-size:13px;font-weight:800;color:var(--text);}
  .cw-how-sub{font-size:11px;color:var(--muted);line-height:1.5;}

  /* Redeem CTA / Earn CTA */
  .cw-redeem-cta{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(255,199,44,0.12) 0%,rgba(218,41,28,0.08) 100%);border:1px solid rgba(255,199,44,0.3);border-radius:14px;padding:16px 18px;color:var(--gold);font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.2s;}
  .cw-redeem-cta:hover{background:linear-gradient(135deg,rgba(255,199,44,0.18) 0%,rgba(218,41,28,0.12) 100%);}
  .cw-earn-cta{display:flex;align-items:flex-start;gap:14px;background:rgba(255,199,44,0.07);border:1px solid rgba(255,199,44,0.18);border-radius:14px;padding:16px 18px;}
  .cw-earn-title{font-size:13px;font-weight:800;color:var(--text);}
  .cw-earn-sub{font-size:12px;color:var(--muted);line-height:1.5;margin-top:3px;}
  .cw-order-btn{margin-left:auto;flex-shrink:0;background:var(--red);color:white;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:12px;padding:9px 16px;border-radius:50px;text-decoration:none;white-space:nowrap;transition:all 0.2s;}
  .cw-order-btn:hover{background:var(--red2);}

  /* Redeem tab */
  .cw-pts-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(255,199,44,0.08);border:1px solid rgba(255,199,44,0.2);}
  .cw-redeem-list{display:flex;flex-direction:column;gap:12px;}
  .cw-redeem-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;transition:all 0.2s;}
  .cw-redeem-available{border-color:rgba(255,199,44,0.25);}
  .cw-redeem-locked{opacity:0.65;}
  .cw-redeem-left{display:flex;align-items:center;gap:14px;flex:1;min-width:0;}
  .cw-redeem-icon-wrap{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .cw-redeem-label{font-size:15px;font-weight:800;color:var(--text);}
  .cw-redeem-desc{font-size:12px;color:var(--muted);margin-top:2px;}
  .cw-redeem-cost{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;margin-top:6px;color:var(--muted);}
  .cw-claim-btn{flex-shrink:0;padding:10px 20px;border-radius:50px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:13px;cursor:pointer;transition:all 0.2s;border:none;display:flex;align-items:center;gap:6px;}
  .cw-claim-available{background:var(--gold);color:#0e0700;}
  .cw-claim-available:hover:not(:disabled){background:#e6b025;}
  .cw-claim-locked{background:rgba(255,248,231,0.07);color:var(--muted);cursor:not-allowed;}
  .cw-claim-btn:disabled{opacity:0.7;cursor:not-allowed;}
  .cw-redeem-note{display:flex;align-items:flex-start;gap:10px;background:rgba(255,248,231,0.02);border:1px solid var(--border);border-radius:12px;padding:14px 16px;font-size:11px;color:var(--muted);line-height:1.6;}

  /* History tab */
  .cw-empty{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:60px 24px;background:var(--card);border:1px solid var(--border);border-radius:18px;}
  .cw-empty p{font-size:15px;font-weight:800;color:var(--text);}
  .cw-empty span{font-size:13px;color:var(--muted);}
  .cw-history-list{background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden;}
  .cw-history-header{display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:12px 18px;background:rgba(255,248,231,0.03);border-bottom:1px solid var(--border);font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);}
  .cw-history-row{display:grid;grid-template-columns:1fr auto auto;gap:12px;padding:14px 18px;border-bottom:1px solid rgba(255,248,231,0.04);align-items:center;}
  .cw-history-row:last-of-type{border-bottom:none;}
  .cw-history-order{display:flex;flex-direction:column;gap:3px;}
  .cw-history-id{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1.5px;color:var(--text);}
  .cw-history-date{font-size:11px;color:var(--muted);}
  .cw-history-amount{font-size:13px;font-weight:700;color:var(--text);}
  .cw-history-pts{display:flex;align-items:center;gap:5px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:0.5px;color:#FFC72C;justify-content:flex-end;}
  .cw-history-total{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:rgba(255,199,44,0.06);border-top:1px solid rgba(255,199,44,0.15);font-size:13px;font-weight:700;color:var(--muted);}

  @media(max-width:480px){.cw-body{padding:16px 12px;}.cw-how-grid{grid-template-columns:1fr;}.cw-pts-num{font-size:48px;}}
`;
