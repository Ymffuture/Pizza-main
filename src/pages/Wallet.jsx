// src/pages/Wallet.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Flame, Wallet as WalletIcon, Star, Gift, TrendingUp,
  ArrowLeft, ChevronRight, Zap, Crown, Shield,
  ShoppingBag, Clock, CheckCircle2, Lock,
  Copy, Check, Sparkles, Award, Info
} from "lucide-react";

/* ── Tier config ── */
const TIERS = [
  {
    id: "bronze",
    name: "Bronze",
    icon: "🥉",
    min: 0,
    max: 499,
    color: "#cd7f32",
    bg: "rgba(205,127,50,0.12)",
    border: "rgba(205,127,50,0.25)",
    perks: ["1 point per R1 spent", "Birthday bonus: 50pts", "Early menu access"],
  },
  {
    id: "silver",
    name: "Silver",
    icon: "🥈",
    min: 500,
    max: 1499,
    color: "#a8a9ad",
    bg: "rgba(168,169,173,0.1)",
    border: "rgba(168,169,173,0.22)",
    perks: ["1.5× points on all orders", "Free delivery on 5th order", "Priority support"],
  },
  {
    id: "gold",
    name: "Gold",
    icon: "🥇",
    min: 1500,
    max: 3999,
    color: "#FFC72C",
    bg: "rgba(255,199,44,0.1)",
    border: "rgba(255,199,44,0.25)",
    perks: ["2× points on all orders", "Free delivery every order", "Exclusive Gold deals"],
  },
  {
    id: "platinum",
    name: "Platinum",
    icon: "💎",
    min: 4000,
    max: Infinity,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.25)",
    perks: ["3× points on all orders", "Free delivery + priority prep", "VIP line + chef's specials"],
  },
];

/* ── Rewards catalogue ── */
const REWARDS = [
  { id: 1, name: "Free Drink",        pts: 150,  emoji: "🥤", locked: false },
  { id: 2, name: "R20 Off Next Order", pts: 200,  emoji: "💳", locked: false },
  { id: 3, name: "Free Side",          pts: 250,  emoji: "🍟", locked: false },
  { id: 4, name: "Free Delivery",      pts: 300,  emoji: "🛵", locked: false },
  { id: 5, name: "R50 Off",            pts: 500,  emoji: "🎁", locked: false },
  { id: 6, name: "Free Kota",          pts: 800,  emoji: "🥪", locked: true  },
  { id: 7, name: "Full Meal Deal",     pts: 1200, emoji: "🍽️", locked: true  },
  { id: 8, name: "Gold Box (R200 val)",pts: 2000, emoji: "📦", locked: true  },
];

/* ── Mock transaction history ── */
const TRANSACTIONS = [
  { id: 1, type: "earn",   label: "Kota Meal Order",       pts: +42,  date: "Today, 12:34",       amount: "R42.00"  },
  { id: 2, type: "earn",   label: "Combo Special Order",   pts: +68,  date: "Yesterday, 19:11",   amount: "R68.00"  },
  { id: 3, type: "redeem", label: "Redeemed: Free Drink",  pts: -150, date: "3 days ago",          amount: null      },
  { id: 4, type: "earn",   label: "Double Points Weekend", pts: +96,  date: "Sat, 13 Mar",         amount: "R48.00"  },
  { id: 5, type: "earn",   label: "Sides + Drinks Order",  pts: +33,  date: "Fri, 12 Mar",         amount: "R33.00"  },
  { id: 6, type: "bonus",  label: "Welcome Bonus",         pts: +100, date: "Mon, 9 Mar",           amount: null      },
];

/* ── Demo points (replace with real user data) ── */
const DEMO_POINTS = 642;

function getCurrentTier(pts) {
  return TIERS.find((t) => pts >= t.min && pts <= t.max) ?? TIERS[0];
}
function getNextTier(pts) {
  const idx = TIERS.findIndex((t) => pts >= t.min && pts <= t.max);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export default function WalletPage() {
  const navigate       = useNavigate();
  const { isAuth, user } = useAuth();
  const [points]       = useState(DEMO_POINTS);
  const [copied,       setCopied]       = useState(false);
  const [redeeming,    setRedeeming]    = useState(null);
  const [redeemed,     setRedeemed]     = useState([]);
  const [activeTab,    setActiveTab]    = useState("rewards"); // rewards | history | tiers
  const [confetti,     setConfetti]     = useState(false);

  const tier     = getCurrentTier(points);
  const nextTier = getNextTier(points);
  const progress = nextTier
    ? Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  const refCode = user?.email
    ? "KOTA" + user.email.slice(0, 3).toUpperCase() + "88"
    : "KOTAXXX88";

  const copyRef = async () => {
    try { await navigator.clipboard.writeText(refCode); }
    catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = (reward) => {
    if (reward.locked || points < reward.pts || redeemed.includes(reward.id)) return;
    setRedeeming(reward.id);
    setTimeout(() => {
      setRedeemed((r) => [...r, reward.id]);
      setRedeeming(null);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2500);
    }, 1200);
  };

  /* ── Not logged in ── */
  if (!isAuth) {
    return (
      <div className="wl-root">
        <style>{styles}</style>
        <div className="wl-auth-gate">
          <div className="wl-auth-icon"><WalletIcon className="w-10 h-10" style={{ color: "#FFC72C" }} /></div>
          <h2 className="wl-auth-title">Your Rewards Wallet</h2>
          <p className="wl-auth-sub">Sign in to view your points, redeem rewards, and track your tier progress.</p>
          <Link to="/login?redirect=/wallet" className="wl-auth-btn">Sign In to Continue</Link>
          <Link to="/register" className="wl-auth-link">No account yet? Create one free →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-root">
      <style>{styles}</style>

      {/* Confetti burst */}
      {confetti && (
        <div className="wl-confetti" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="wl-confetti-dot" style={{
              left: `${Math.random() * 100}%`,
              background: ["#FFC72C","#DA291C","#4ade80","#60a5fa","#fff8e7"][i % 5],
              animationDelay: `${Math.random() * 0.4}s`,
              animationDuration: `${0.8 + Math.random() * 0.8}s`,
            }} />
          ))}
        </div>
      )}

      {/* ── Header ── */}
      <header className="wl-header">
        <div className="wl-header-inner">
          <button className="wl-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="wl-header-brand">
            <div className="wl-logo"><Flame className="w-4 h-4" style={{ color: "#0e0700" }} /></div>
            <span className="wl-brand">KOTABITES</span>
          </div>
          <div className="wl-header-user">
            <span className="wl-user-pill">
              {tier.icon} {tier.name}
            </span>
          </div>
        </div>
      </header>

      <div className="wl-body">

        {/* ── Hero card ── */}
        <div className="wl-hero-card" style={{ "--tier-color": tier.color, "--tier-bg": tier.bg, "--tier-border": tier.border }}>
          <div className="wl-hero-glow" />

          <div className="wl-hero-top">
            <div className="wl-tier-badge" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
              <span className="wl-tier-emoji">{tier.icon}</span>
              <span className="wl-tier-name" style={{ color: tier.color }}>{tier.name} Member</span>
            </div>
            <div className="wl-pts-display">
              <Sparkles className="wl-pts-spark" style={{ color: tier.color }} />
              <span className="wl-pts-num">{points.toLocaleString()}</span>
              <span className="wl-pts-label">points</span>
            </div>
          </div>

          {/* Progress bar */}
          {nextTier && (
            <div className="wl-progress-wrap">
              <div className="wl-progress-labels">
                <span>{tier.name}</span>
                <span style={{ color: nextTier.color }}>{nextTier.name} — {nextTier.min - points} pts away</span>
              </div>
              <div className="wl-progress-track">
                <div
                  className="wl-progress-fill"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})` }}
                />
              </div>
            </div>
          )}
          {!nextTier && (
            <div className="wl-max-tier">
              <Crown className="w-4 h-4" style={{ color: tier.color }} />
              <span>You've reached the highest tier!</span>
            </div>
          )}

          {/* Quick stats */}
          <div className="wl-hero-stats">
            <div className="wl-hero-stat">
              <span className="wl-hero-stat-num">
                {TRANSACTIONS.filter((t) => t.type === "earn" || t.type === "bonus")
                  .reduce((s, t) => s + t.pts, 0)}
              </span>
              <span className="wl-hero-stat-label">Total earned</span>
            </div>
            <div className="wl-hero-stat-div" />
            <div className="wl-hero-stat">
              <span className="wl-hero-stat-num">
                {Math.abs(TRANSACTIONS.filter((t) => t.type === "redeem").reduce((s, t) => s + t.pts, 0))}
              </span>
              <span className="wl-hero-stat-label">Redeemed</span>
            </div>
            <div className="wl-hero-stat-div" />
            <div className="wl-hero-stat">
              <span className="wl-hero-stat-num">{TRANSACTIONS.filter((t) => t.type === "earn").length}</span>
              <span className="wl-hero-stat-label">Orders placed</span>
            </div>
          </div>
        </div>

        {/* ── Earn more banner ── */}
        <div className="wl-earn-banner">
          <div className="wl-earn-icon"><TrendingUp className="w-5 h-5" style={{ color: "#4ade80" }} /></div>
          <div className="wl-earn-copy">
            <p className="wl-earn-title">Earn points on every order</p>
            <p className="wl-earn-sub">You earn <strong style={{ color: tier.color }}>1 point per R1 spent</strong> at your current {tier.name} tier</p>
          </div>
          <Link to="/menu" className="wl-earn-cta">
            Order Now <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Referral card ── */}
        <div className="wl-ref-card">
          <div className="wl-ref-left">
            <Gift className="wl-ref-icon" />
            <div>
              <p className="wl-ref-title">Refer a Friend</p>
              <p className="wl-ref-sub">You both get <strong style={{ color: "#FFC72C" }}>+100 bonus points</strong> when they place their first order</p>
            </div>
          </div>
          <div className="wl-ref-code-wrap">
            <span className="wl-ref-label">Your code</span>
            <button className="wl-ref-code" onClick={copyRef}>
              <span>{refCode}</span>
              {copied
                ? <Check className="w-4 h-4" style={{ color: "#4ade80" }} />
                : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="wl-tabs">
          {[
            { key: "rewards", label: "Rewards",  icon: Gift   },
            { key: "history", label: "History",  icon: Clock  },
            { key: "tiers",   label: "Tiers",    icon: Crown  },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`wl-tab${activeTab === key ? " wl-tab-active" : ""}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Rewards ── */}
        {activeTab === "rewards" && (
          <div className="wl-rewards-grid">
            {REWARDS.map((r) => {
              const canRedeem  = !r.locked && points >= r.pts && !redeemed.includes(r.id);
              const isRedeemed = redeemed.includes(r.id);
              const isLoading  = redeeming === r.id;
              return (
                <div
                  key={r.id}
                  className={`wl-reward-card${r.locked ? " wl-reward-locked" : ""}${isRedeemed ? " wl-reward-done" : ""}`}
                >
                  {r.locked && (
                    <div className="wl-reward-lock"><Lock className="w-3.5 h-3.5" /></div>
                  )}
                  <div className="wl-reward-emoji">{r.emoji}</div>
                  <p className="wl-reward-name">{r.name}</p>
                  <div className="wl-reward-pts">
                    <Star className="w-3 h-3" style={{ color: "#FFC72C" }} />
                    <span>{r.pts.toLocaleString()} pts</span>
                  </div>

                  {isRedeemed ? (
                    <div className="wl-reward-redeemed">
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#4ade80" }} />
                      Redeemed!
                    </div>
                  ) : (
                    <button
                      className={`wl-reward-btn${!canRedeem ? " wl-reward-btn-disabled" : ""}`}
                      disabled={!canRedeem || isLoading}
                      onClick={() => handleRedeem(r)}
                    >
                      {isLoading ? (
                        <span className="wl-spin-dot" />
                      ) : r.locked ? (
                        <><Lock className="w-3 h-3" /> Locked</>
                      ) : points < r.pts ? (
                        `Need ${r.pts - points} more pts`
                      ) : (
                        "Redeem"
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab: History ── */}
        {activeTab === "history" && (
          <div className="wl-history">
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="wl-tx-row">
                <div className={`wl-tx-icon wl-tx-${tx.type}`}>
                  {tx.type === "earn"   && <ShoppingBag className="w-4 h-4" />}
                  {tx.type === "redeem" && <Gift className="w-4 h-4" />}
                  {tx.type === "bonus"  && <Zap className="w-4 h-4" />}
                </div>
                <div className="wl-tx-info">
                  <p className="wl-tx-label">{tx.label}</p>
                  <p className="wl-tx-date">{tx.date}{tx.amount ? ` · ${tx.amount}` : ""}</p>
                </div>
                <span className={`wl-tx-pts wl-tx-pts-${tx.type}`}>
                  {tx.pts > 0 ? "+" : ""}{tx.pts} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Tiers ── */}
        {activeTab === "tiers" && (
          <div className="wl-tiers-list">
            {TIERS.map((t) => {
              const isCurrent = t.id === tier.id;
              const isUnlocked = points >= t.min;
              return (
                <div
                  key={t.id}
                  className={`wl-tier-card${isCurrent ? " wl-tier-current" : ""}${!isUnlocked ? " wl-tier-future" : ""}`}
                  style={{ "--tc": t.color, "--tb": t.bg, "--tbr": t.border }}
                >
                  {isCurrent && <div className="wl-tier-current-tag">Current</div>}
                  <div className="wl-tier-card-header">
                    <span className="wl-tier-card-emoji">{t.emoji}</span>
                    <div>
                      <p className="wl-tier-card-name" style={{ color: t.color }}>{t.name}</p>
                      <p className="wl-tier-card-range">
                        {t.max === Infinity
                          ? `${t.min.toLocaleString()}+ pts`
                          : `${t.min.toLocaleString()} – ${t.max.toLocaleString()} pts`}
                      </p>
                    </div>
                    {isUnlocked
                      ? <CheckCircle2 className="wl-tier-check" style={{ color: t.color }} />
                      : <Lock className="wl-tier-lock" />}
                  </div>
                  <ul className="wl-tier-perks">
                    {t.perks.map((p, i) => (
                      <li key={i} className="wl-tier-perk">
                        <span className="wl-tier-perk-dot" style={{ background: t.color }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <div className="wl-bottom-strip">
          <Info className="w-4 h-4" style={{ color: "var(--muted)", flexShrink: 0 }} />
          <p className="wl-bottom-note">
            Points are credited after order delivery. They expire after 12 months of inactivity.
          </p>
        </div>

      </div>
    </div>
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

  /* ── Root ── */
  .wl-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 35% at 50% 0%, rgba(218,41,28,0.15) 0%, transparent 65%),
      var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    overflow-x: hidden;
    padding-bottom: 60px;
  }

  /* ── Header ── */
  .wl-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(14,7,0,0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .wl-header-inner {
    max-width: 680px; margin: 0 auto;
    padding: 13px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .wl-back-btn {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: rgba(255,248,231,0.05); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .wl-back-btn:hover { color: var(--text); border-color: rgba(255,199,44,0.3); }
  .wl-header-brand { display: flex; align-items: center; gap: 8px; }
  .wl-logo {
    width: 32px; height: 32px; background: var(--gold); border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 14px rgba(255,199,44,0.25);
  }
  .wl-brand { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 3px; color: var(--text); }
  .wl-user-pill {
    padding: 5px 12px; border-radius: 50px;
    background: rgba(255,199,44,0.08); border: 1px solid rgba(255,199,44,0.2);
    font-size: 12px; font-weight: 800; color: var(--gold);
  }

  /* ── Body ── */
  .wl-body {
    max-width: 680px; margin: 0 auto;
    padding: 24px 16px;
    display: flex; flex-direction: column; gap: 16px;
  }

  /* ── Auth gate ── */
  .wl-auth-gate {
    max-width: 420px; margin: 0 auto;
    padding: 80px 24px;
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; text-align: center;
  }
  .wl-auth-icon {
    width: 80px; height: 80px; border-radius: 22px;
    background: rgba(255,199,44,0.1); border: 1px solid rgba(255,199,44,0.2);
    display: flex; align-items: center; justify-content: center;
  }
  .wl-auth-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 2px; }
  .wl-auth-sub { font-size: 14px; color: var(--muted); line-height: 1.65; max-width: 300px; }
  .wl-auth-btn {
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 15px;
    padding: 14px 32px; border-radius: 50px; text-decoration: none;
    box-shadow: 0 6px 20px rgba(218,41,28,0.4); transition: all 0.2s; margin-top: 4px;
  }
  .wl-auth-btn:hover { background: var(--red2); transform: scale(1.03); }
  .wl-auth-link { font-size: 13px; color: var(--gold); font-weight: 700; text-decoration: none; }

  /* ── Hero card ── */
  .wl-hero-card {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, var(--card) 0%, rgba(26,14,0,0.95) 100%);
    border: 1px solid var(--tier-border, var(--border));
    border-radius: 24px; padding: 28px 24px;
    box-shadow: 0 0 0 1px var(--tier-border, transparent) inset;
    animation: wlFadeUp 0.5s ease both;
  }
  .wl-hero-glow {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 80% 60% at 20% 0%, rgba(255,199,44,0.06) 0%, transparent 60%);
  }
  .wl-hero-top {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; margin-bottom: 24px; position: relative;
  }
  .wl-tier-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: 50px;
  }
  .wl-tier-emoji { font-size: 18px; }
  .wl-tier-name { font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }

  .wl-pts-display {
    display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
    position: relative;
  }
  .wl-pts-spark {
    position: absolute; top: -6px; right: -4px;
    width: 16px; height: 16px;
    filter: drop-shadow(0 0 8px currentColor);
  }
  .wl-pts-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 52px; letter-spacing: 1px; color: var(--text); line-height: 1;
  }
  .wl-pts-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
  }

  /* Progress */
  .wl-progress-wrap { margin-bottom: 20px; position: relative; }
  .wl-progress-labels {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 10px; font-weight: 700; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;
  }
  .wl-progress-track {
    height: 6px; background: rgba(255,248,231,0.06);
    border-radius: 6px; overflow: hidden;
  }
  .wl-progress-fill {
    height: 100%; border-radius: 6px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px rgba(255,199,44,0.4);
  }
  .wl-max-tier {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 700; color: var(--gold);
    margin-bottom: 20px;
  }

  /* Hero stats */
  .wl-hero-stats {
    display: flex; align-items: center;
    padding-top: 18px; border-top: 1px solid rgba(255,199,44,0.08);
    position: relative;
  }
  .wl-hero-stat { flex: 1; text-align: center; }
  .wl-hero-stat-num {
    display: block; font-family: 'Bebas Neue', sans-serif;
    font-size: 26px; letter-spacing: 1px; color: var(--text); line-height: 1;
  }
  .wl-hero-stat-label { font-size: 9px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .wl-hero-stat-div { width: 1px; height: 32px; background: rgba(255,199,44,0.1); flex-shrink: 0; }

  /* ── Earn banner ── */
  .wl-earn-banner {
    display: flex; align-items: center; gap: 14px;
    background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.2);
    border-radius: 16px; padding: 16px 18px;
    animation: wlFadeUp 0.5s ease 0.1s both;
  }
  .wl-earn-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .wl-earn-copy { flex: 1; min-width: 0; }
  .wl-earn-title { font-size: 13px; font-weight: 800; color: var(--text); }
  .wl-earn-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .wl-earn-cta {
    display: flex; align-items: center; gap: 4px; flex-shrink: 0;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 12px;
    padding: 9px 14px; border-radius: 50px; text-decoration: none;
    transition: all 0.2s; white-space: nowrap;
  }
  .wl-earn-cta:hover { background: var(--red2); }

  /* ── Referral card ── */
  .wl-ref-card {
    display: flex; align-items: center; gap: 16px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 18px; padding: 18px 20px;
    flex-wrap: wrap;
    animation: wlFadeUp 0.5s ease 0.15s both;
  }
  .wl-ref-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; }
  .wl-ref-icon { width: 20px; height: 20px; color: var(--gold); flex-shrink: 0; margin-top: 1px; }
  .wl-ref-title { font-size: 13px; font-weight: 800; color: var(--text); }
  .wl-ref-sub { font-size: 11px; color: var(--muted); margin-top: 3px; line-height: 1.5; }
  .wl-ref-code-wrap { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
  .wl-ref-label { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .wl-ref-code {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,199,44,0.08); border: 1.5px solid rgba(255,199,44,0.25);
    border-radius: 10px; padding: 8px 12px; cursor: pointer;
    font-family: monospace; font-size: 14px; font-weight: 900; color: var(--gold);
    transition: all 0.2s;
  }
  .wl-ref-code:hover { background: rgba(255,199,44,0.14); border-color: rgba(255,199,44,0.4); }

  /* ── Tabs ── */
  .wl-tabs {
    display: flex; gap: 8px;
    animation: wlFadeUp 0.5s ease 0.2s both;
  }
  .wl-tab {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px; border-radius: 12px;
    background: rgba(255,248,231,0.04); border: 1.5px solid var(--border);
    color: var(--muted); font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .wl-tab:hover { color: var(--text); border-color: rgba(255,199,44,0.2); }
  .wl-tab-active {
    background: rgba(255,199,44,0.1) !important;
    border-color: rgba(255,199,44,0.35) !important;
    color: var(--gold) !important;
  }

  /* ── Rewards grid ── */
  .wl-rewards-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    animation: wlFadeUp 0.4s ease both;
  }
  .wl-reward-card {
    position: relative; overflow: hidden;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; padding: 18px 14px;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    text-align: center; transition: all 0.25s;
  }
  .wl-reward-card:hover:not(.wl-reward-locked) {
    border-color: rgba(255,199,44,0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .wl-reward-locked { opacity: 0.55; }
  .wl-reward-done { border-color: rgba(74,222,128,0.3) !important; background: rgba(74,222,128,0.04) !important; }
  .wl-reward-lock {
    position: absolute; top: 8px; right: 8px;
    background: rgba(255,248,231,0.06); border: 1px solid var(--border);
    border-radius: 6px; padding: 4px;
    color: var(--muted);
  }
  .wl-reward-emoji { font-size: 28px; line-height: 1; }
  .wl-reward-name { font-size: 11px; font-weight: 800; color: var(--text); line-height: 1.3; }
  .wl-reward-pts {
    display: flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 800; color: var(--gold);
  }
  .wl-reward-btn {
    width: 100%; padding: 8px 6px; border-radius: 8px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 10px;
    transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;
  }
  .wl-reward-btn:hover:not(.wl-reward-btn-disabled) { background: var(--red2); }
  .wl-reward-btn-disabled {
    background: rgba(255,248,231,0.06) !important; color: var(--muted) !important;
    cursor: not-allowed; border: 1px solid var(--border);
  }
  .wl-reward-redeemed {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 800; color: #4ade80;
  }
  .wl-spin-dot {
    width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: wlSpin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes wlSpin { to { transform: rotate(360deg); } }

  /* ── History ── */
  .wl-history {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 18px; overflow: hidden;
    animation: wlFadeUp 0.4s ease both;
  }
  .wl-tx-row {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255,248,231,0.04);
    transition: background 0.2s;
  }
  .wl-tx-row:last-child { border-bottom: none; }
  .wl-tx-row:hover { background: rgba(255,248,231,0.02); }
  .wl-tx-icon {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .wl-tx-earn   { background: rgba(74,222,128,0.1);  color: #4ade80; }
  .wl-tx-redeem { background: rgba(255,199,44,0.1);  color: var(--gold); }
  .wl-tx-bonus  { background: rgba(96,165,250,0.1);  color: #60a5fa; }
  .wl-tx-info { flex: 1; min-width: 0; }
  .wl-tx-label { font-size: 13px; font-weight: 700; color: var(--text); }
  .wl-tx-date  { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .wl-tx-pts { font-size: 14px; font-weight: 900; flex-shrink: 0; }
  .wl-tx-pts-earn   { color: #4ade80; }
  .wl-tx-pts-redeem { color: #f87171; }
  .wl-tx-pts-bonus  { color: #60a5fa; }

  /* ── Tiers ── */
  .wl-tiers-list {
    display: flex; flex-direction: column; gap: 12px;
    animation: wlFadeUp 0.4s ease both;
  }
  .wl-tier-card {
    position: relative; overflow: hidden;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 18px; padding: 20px;
    transition: all 0.25s;
  }
  .wl-tier-current {
    border-color: var(--tbr, var(--border)) !important;
    background: linear-gradient(135deg, var(--tb, transparent) 0%, var(--card) 100%) !important;
    box-shadow: 0 0 0 1px var(--tbr, transparent) inset, 0 12px 32px rgba(0,0,0,0.4);
  }
  .wl-tier-future { opacity: 0.55; }
  .wl-tier-current-tag {
    position: absolute; top: 14px; right: 14px;
    background: var(--tc, var(--gold)); color: #0e0700;
    font-size: 9px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 20px;
  }
  .wl-tier-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .wl-tier-card-emoji { font-size: 32px; flex-shrink: 0; }
  .wl-tier-card-name { font-size: 18px; font-weight: 800; line-height: 1; }
  .wl-tier-card-range { font-size: 11px; color: var(--muted); margin-top: 3px; font-weight: 600; }
  .wl-tier-check { width: 22px; height: 22px; margin-left: auto; }
  .wl-tier-lock  { width: 18px; height: 18px; color: var(--muted); margin-left: auto; }
  .wl-tier-perks { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
  .wl-tier-perk {
    display: flex; align-items: center; gap: 9px;
    font-size: 12px; font-weight: 600; color: var(--muted);
  }
  .wl-tier-perk-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .wl-tier-current .wl-tier-perk { color: rgba(255,248,231,0.7); }

  /* ── Bottom note ── */
  .wl-bottom-strip {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 14px 16px; border-radius: 12px;
    background: rgba(255,248,231,0.02); border: 1px solid var(--border);
  }
  .wl-bottom-note { font-size: 11px; color: var(--muted); line-height: 1.55; }

  /* ── Confetti ── */
  .wl-confetti {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9999; overflow: hidden;
  }
  .wl-confetti-dot {
    position: absolute; top: -10px;
    width: 8px; height: 8px; border-radius: 50%;
    animation: wlConfettiFall linear both;
  }
  @keyframes wlConfettiFall {
    from { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    to   { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  @keyframes wlFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: none; }
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .wl-body { padding: 16px 12px; }
    .wl-rewards-grid { grid-template-columns: repeat(2, 1fr); }
    .wl-ref-card { flex-direction: column; }
    .wl-ref-code-wrap { width: 100%; }
    .wl-ref-code { justify-content: center; }
    .wl-hero-card { padding: 20px 16px; }
    .wl-pts-num { font-size: 40px; }
  }
`;
