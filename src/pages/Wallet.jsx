// src/pages/Wallet.jsx — Driver Earnings Wallet · simplified · auto sign-out
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getWalletBalance,
  getWalletTransactions,
  getDriverProfile,
  withdrawFunds,
} from "../api/delivery.api";
import {
  Flame, ArrowLeft, TrendingUp, Download, Clock,
  CheckCircle2, AlertCircle, ArrowDownRight, Gift,
  Zap, ShoppingBag, Loader, X, Info, ChevronRight,
  RefreshCw, WifiOff, Shield, LogOut, Timer,
  Banknote, Wallet,
} from "lucide-react";
import { Loader3 } from "../components/Loader";
import SecurityTimeoutAlert from "../components/SecurityTimeoutAlert_BankStyle";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const AUTO_SIGNOUT_MS  = 1.5 * 60 * 1000;   // 2 min
const WARN_AT_MS       = 30 * 1000;        // show warning when 60s remain
const APPROVED         = new Set(["approved", "active", "offline"]);

const TX_CFG = {
  delivery_payment: { Icon: Banknote,      color: "#4ade80", bg: "rgba(74,222,128,0.12)",  label: "Delivery"   },
  withdrawal:       { Icon: ArrowDownRight, color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "Withdrawal" },
  bonus:            { Icon: Gift,           color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  label: "Bonus"      },
  penalty:          { Icon: AlertCircle,    color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  label: "Penalty"    },
};
const TX_DEFAULT = { Icon: Zap, color: "var(--muted)", bg: "rgba(255,248,231,0.06)", label: "Other" };

function classifyError(err) {
  if (!err?.response || err?.code === "ERR_NETWORK" || err?.code === "ECONNABORTED")
    return { type: "network",     msg: "Server is waking up — please wait 30–60 seconds." };
  const s = err.response.status;
  const d = err.response.data?.detail || err.response.data?.message || err.message;
  if (s === 401) return { type: "auth",       msg: "Session expired. Please sign in again." };
  if (s === 404) return { type: "no_profile", msg: d || "Driver profile not found." };
  if (s === 403) return { type: "forbidden",  msg: d || "Access denied." };
  return        { type: "error",      msg: d || "Failed to load wallet." };
}

/* ─────────────────────────────────────────────
   Auto sign-out hook
───────────────────────────────────────────── */
function useAutoSignOut(onSignOut, enabled = true) {
  const [remaining, setRemaining] = useState(AUTO_SIGNOUT_MS);
  const timerRef   = useRef(null);
  const intervalRef = useRef(null);

  const reset = useCallback(() => {
    setRemaining(AUTO_SIGNOUT_MS);
    if (timerRef.current)   clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!enabled) return;

    timerRef.current = setTimeout(() => { onSignOut(); }, AUTO_SIGNOUT_MS);

    // tick every second for the countdown
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        const next = r - 1000;
        return next < 0 ? 0 : next;
      });
    }, 1000);
  }, [enabled, onSignOut]);

  useEffect(() => {
    if (!enabled) return;
    reset();
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [enabled, reset]);

  const showWarning = remaining <= WARN_AT_MS && remaining > 0;
  const secs        = Math.ceil(remaining / 1000);
  return { remaining, secs, showWarning };
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function WalletPage() {
  const navigate         = useNavigate();
  const { isAuth, token, logout } = useAuth();

  const [loading,      setLoading]      = useState(true);
  const [balance,      setBalance]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profile,      setProfile]      = useState(null);
  const [errorInfo,    setErrorInfo]    = useState(null);
  const [retryIn,      setRetryIn]      = useState(null);
  const retryRef = useRef(null);

  // Withdrawal modal
  const [showModal,    setShowModal]    = useState(false);
  const [amount,       setAmount]       = useState("");
  const [withdrawing,  setWithdrawing]  = useState(false);
  const [withdrawErr,  setWithdrawErr]  = useState(null);
  const [withdrawOk,   setWithdrawOk]   = useState(false);

  /* ── Auto sign-out ── */
  const handleAutoSignOut = useCallback(() => {
    logout();
    navigate("/login?redirect=/wallet");
  }, [logout, navigate]);
  const { secs, showWarning } = useAutoSignOut(handleAutoSignOut, isAuth);

  /* ── Fetch ── */
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorInfo(null);
    if (retryRef.current) { clearInterval(retryRef.current); retryRef.current = null; setRetryIn(null); }
    try {
      const [pR, bR, tR] = await Promise.allSettled([
        getDriverProfile(), getWalletBalance(), getWalletTransactions(50),
      ]);
      if (pR.status === "rejected") {
        const info = classifyError(pR.reason);
        setErrorInfo(info);
        if (info.type === "network") {
          setRetryIn(40);
          retryRef.current = setInterval(() => {
            setRetryIn(p => {
              if (p <= 1) { clearInterval(retryRef.current); retryRef.current = null; fetchData(true); return null; }
              return p - 1;
            });
          }, 1000);
        }
        return;
      }
      setProfile(pR.value.data);
      if (bR.status === "fulfilled") setBalance(bR.value.data);
      if (tR.status === "fulfilled") setTransactions(Array.isArray(tR.value.data) ? tR.value.data : []);
    } catch (err) {
      setErrorInfo(classifyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth && token) fetchData();
    return () => { if (retryRef.current) clearInterval(retryRef.current); };
  }, [isAuth, token, fetchData]);

  /* ── Withdraw ── */
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 50)            { setWithdrawErr("Minimum withdrawal is R50"); return; }
    if (val > (balance?.balance ?? 0))     { setWithdrawErr("Insufficient balance"); return; }
    if (!profile?.bank_name || !profile?.account_number) {
      setWithdrawErr("Banking details missing — update your driver profile first."); return;
    }
    setWithdrawing(true); setWithdrawErr(null);
    try {
      await withdrawFunds({ amount: val, bank_name: profile.bank_name, account_number: profile.account_number, account_holder: profile.account_holder });
      setWithdrawOk(true);
      setTimeout(() => { setShowModal(false); setWithdrawOk(false); setAmount(""); fetchData(true); }, 2500);
    } catch (err) {
      setWithdrawErr(err?.response?.data?.detail || err.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const masked = (() => {
    const n = profile?.account_number;
    return n?.length >= 4 ? `••••${n.slice(-4)}` : (n || "—");
  })();

  const canWithdraw = APPROVED.has(profile?.status) && (balance?.balance ?? 0) >= 50 && profile?.bank_name;

  /* ─── Unauthenticated ─── */
  if (!isAuth) return (
    <div className="wl-root"><style>{css}</style>
      <div className="wl-gate">
        <div className="wl-gate-icon"><Wallet style={{ width: 32, height: 32, color: "#FFC72C" }} /></div>
        <h2 className="wl-gate-title">Driver Wallet</h2>
        <p className="wl-gate-sub">Sign in to view your earnings and make withdrawals.</p>
        <Link to="/login?redirect=/wallet" className="wl-btn-red">Sign In</Link>
        <Link to="/deliver" className="wl-ghost">Not a driver yet? Apply →</Link>
      </div>
    </div>
  );

  /* ─── Loading ─── */
  if (loading) return (
    <div className="wl-root"><style>{css}</style>
      <div className="wl-gate"><Loader3 /><p className="wl-gate-sub">Loading wallet…</p></div>
    </div>
  );

  /* ─── Error ─── */
  if (errorInfo) return (
    <div className="wl-root"><style>{css}</style>
      <div className="wl-nav">
        <div className="wl-nav-inner">
          <button className="wl-icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <span className="wl-nav-title">Wallet</span>
          <div />
        </div>
      </div>
      <div className="wl-gate" style={{ minHeight: "calc(100vh - 60px)" }}>
        {errorInfo.type === "network" && <>
          <div className="wl-err-icon wl-err-gold"><WifiOff style={{ width: 28, height: 28, color: "#FFC72C" }} /></div>
          <h3 className="wl-gate-title">Server Waking Up</h3>
          <p className="wl-gate-sub">{errorInfo.msg}</p>
          {retryIn !== null
            ? <div className="wl-countdown"><div className="wl-ring"><span>{retryIn}</span></div><p style={{ fontSize: 12, color: "var(--muted)" }}>Auto-retry in {retryIn}s</p></div>
            : <button className="wl-btn-red" onClick={() => fetchData()}><RefreshCw size={14} /> Retry</button>}
        </>}
        {errorInfo.type === "no_profile" && <>
          <div className="wl-err-icon wl-err-gold"><Wallet style={{ width: 28, height: 28, color: "#FFC72C" }} /></div>
          <h3 className="wl-gate-title">No Driver Profile</h3>
          <p className="wl-gate-sub">Complete driver signup to access your wallet.</p>
          <Link to="/deliver" className="wl-btn-red">Apply to Drive</Link>
        </>}
        {(errorInfo.type === "auth" || errorInfo.type === "error" || errorInfo.type === "forbidden") && <>
          <div className="wl-err-icon wl-err-red"><AlertCircle style={{ width: 28, height: 28, color: "#f87171" }} /></div>
          <h3 className="wl-gate-title">{errorInfo.type === "auth" ? "Session Expired" : "Something Went Wrong"}</h3>
          <p className="wl-gate-sub">{errorInfo.msg}</p>
          {errorInfo.type === "auth"
            ? <Link to="/login?redirect=/wallet" className="wl-btn-red">Sign In Again</Link>
            : <button className="wl-btn-red" onClick={() => fetchData()}><RefreshCw size={14} /> Retry</button>}
        </>}
      </div>
    </div>
  );

  /* ─── Main ─── */
  return (
    <div className="wl-root">
      <style>{css}</style>

      {/* ── Auto sign-out warning banner ── */}
      {showWarning && (
        <SecurityTimeoutAlert 
  secs={45} 
  onStaySignedIn={() => resetTimer()} 
  onDismiss={() => setShowWarning(false)} 
/>
      )}

      {/* ── Nav ── */}
      <header className="wl-nav">
        <div className="wl-nav-inner">
          <button className="wl-icon-btn" onClick={() => navigate(-1)} title="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="wl-nav-brand">
            <div className="wl-flame"><Flame size={14} color="#0e0700" /></div>
            <span className="wl-nav-title">Driver Wallet</span>
          </div>
          <div className="wl-nav-right">
            {/* Session timer */}
            <div className={`wl-session-chip${showWarning ? " wl-session-warn" : ""}`} title={`Auto sign-out in ${Math.floor(secs / 60)}m ${secs % 60}s`}>
              <Shield size={11} />
              <span>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
            </div>
            <button className="wl-icon-btn wl-icon-btn-red" onClick={handleAutoSignOut} title="Sign out now">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="wl-body">

        {/* ── Balance hero ── */}
        <div className="wl-balance-card">
          {/* Status badge */}
          <div className="wl-status-row">
            <span className={`wl-status-badge${APPROVED.has(profile?.status) ? " wl-status-active" : ""}`}>
              <span className="wl-status-dot" />
              {APPROVED.has(profile?.status) ? "Active Driver" : profile?.status || "Pending"}
            </span>
            <button className="wl-refresh-btn" onClick={() => fetchData(true)} title="Refresh">
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Big balance */}
          <div className="wl-bal-wrap">
            <span className="wl-bal-currency">R</span>
            <span className="wl-bal-amount">{(balance?.balance ?? 0).toFixed(2)}</span>
          </div>
          <p className="wl-bal-label">Available balance</p>

          {/* 3 stats */}
          <div className="wl-stats">
            {[
              { label: "Total earned",    val: `R${(balance?.total_earned    ?? 0).toFixed(2)}`, color: "#4ade80" },
              { label: "Withdrawn",       val: `R${(balance?.total_withdrawn ?? 0).toFixed(2)}`, color: "#f87171" },
              { label: "Pending",         val: `R${(balance?.pending_amount  ?? 0).toFixed(2)}`, color: "#fbbf24" },
            ].map(({ label, val, color }) => (
              <div key={label} className="wl-stat">
                <span className="wl-stat-val" style={{ color }}>{val}</span>
                <span className="wl-stat-lbl">{label}</span>
              </div>
            ))}
          </div>

          {/* Withdraw CTA */}
          {canWithdraw && (
            <button className="wl-withdraw-cta" onClick={() => setShowModal(true)}>
              <Download size={16} />
              Withdraw funds
            </button>
          )}

          {/* Notices */}
          {!APPROVED.has(profile?.status) && (
            <div className="wl-notice wl-notice-blue">
              <Info size={14} style={{ flexShrink: 0 }} />
              Withdrawals unlock once your account is approved.
            </div>
          )}
          {APPROVED.has(profile?.status) && !profile?.bank_name && (
            <div className="wl-notice wl-notice-red">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>Banking details missing — <Link to="/driver-dashboard" style={{ color: "inherit", fontWeight: 800 }}>add them in your profile</Link>.</span>
            </div>
          )}
        </div>

        {/* ── Driver summary ── */}
        {profile && (
          <div className="wl-summary-row">
            {[
              { label: "Deliveries", val: profile.total_deliveries || 0 },
              { label: "Rating",     val: `⭐ ${profile.rating?.toFixed(1) || "5.0"}` },
              { label: "Status",     val: profile.is_available ? "Online" : "Offline",
                color: profile.is_available ? "#4ade80" : "var(--muted)" },
            ].map(({ label, val, color }) => (
              <div key={label} className="wl-summary-item">
                <span className="wl-summary-val" style={color ? { color } : {}}>{val}</span>
                <span className="wl-summary-lbl">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick links ── */}
        <div className="wl-quick-links">
          <Link to="/driver-dashboard" className="wl-quick-card">
            <div className="wl-quick-icon" style={{ background: "rgba(74,222,128,0.12)" }}>
              <ShoppingBag size={18} style={{ color: "#4ade80" }} />
            </div>
            <div className="wl-quick-text">
              <span className="wl-quick-title">Dashboard</span>
              <span className="wl-quick-sub">Orders & deliveries</span>
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </Link>
          <Link to="/driver-dashboard?tab=orders" className="wl-quick-card">
            <div className="wl-quick-icon" style={{ background: "rgba(96,165,250,0.12)" }}>
              <Clock size={18} style={{ color: "#60a5fa" }} />
            </div>
            <div className="wl-quick-text">
              <span className="wl-quick-title">Available Orders</span>
              <span className="wl-quick-sub">Accept new deliveries</span>
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </Link>
        </div>

        {/* ── Transactions ── */}
        <div className="wl-tx-section">
          <div className="wl-tx-header">
            <h2 className="wl-tx-title">Transactions</h2>
            <span className="wl-tx-badge">{transactions.length}</span>
          </div>

          {transactions.length === 0 ? (
            <div className="wl-empty">
              <Clock size={36} style={{ color: "var(--muted)", opacity: 0.5 }} />
              <p>No transactions yet</p>
              <span>Your earnings will appear here after your first delivery</span>
            </div>
          ) : (
            <div className="wl-tx-list">
              {transactions.map((tx, i) => {
                const cfg = TX_CFG[tx.type] || TX_DEFAULT;
                const pos = tx.amount > 0;
                const TxIcon = cfg.Icon;
                return (
                  <div key={tx.id || i} className="wl-tx">
                    <div className="wl-tx-icon" style={{ background: cfg.bg }}>
                      <TxIcon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div className="wl-tx-info">
                      <p className="wl-tx-desc">{tx.description || cfg.label}</p>
                      <p className="wl-tx-date">
                        {new Date(tx.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {tx.reference && <span className="wl-tx-ref"> · #{tx.reference.slice(-6).toUpperCase()}</span>}
                      </p>
                    </div>
                    <div className="wl-tx-amount-col">
                      <span className={`wl-tx-amount${pos ? " wl-pos" : " wl-neg"}`}>
                        {pos ? "+" : "−"}R{Math.abs(tx.amount).toFixed(2)}
                      </span>
                      {tx.balance_after != null && (
                        <span className="wl-tx-balance">R{tx.balance_after.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Info footer ── */}
        <div className="wl-info-footer">
          <div className="wl-info-row">
            <Info size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <span>Earnings credited after delivery confirmation · Min withdrawal <strong>R50</strong> · Payout 24–48 hrs</span>
          </div>
          <div className="wl-info-row">
            <Shield size={13} style={{ color: "#4ade80", flexShrink: 0 }} />
            <span style={{ color: "rgba(74,222,128,0.6)" }}>Auto sign-out after 2 min of inactivity for your security</span>
          </div>
        </div>

      </div>

      {/* ── Withdrawal Modal ── */}
      {showModal && (
        <div className="wl-overlay" onClick={() => !withdrawing && setShowModal(false)}>
          <div className="wl-modal" onClick={e => e.stopPropagation()}>

            {withdrawOk ? (
              <div className="wl-modal-success">
                <div className="wl-succ-icon"><CheckCircle2 size={36} style={{ color: "#4ade80" }} /></div>
                <h3 className="wl-modal-ok-title">Withdrawal Submitted</h3>
                <p className="wl-modal-ok-sub">Funds will arrive within 24–48 hours to {profile?.bank_name} {masked}.</p>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="wl-modal-hd">
                  <div>
                    <h3 className="wl-modal-title">Withdraw funds</h3>
                    <p className="wl-modal-sub">To {profile?.bank_name} · {masked}</p>
                  </div>
                  <button className="wl-icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
                </div>

                {/* Available */}
                <div className="wl-modal-avail">
                  <span className="wl-modal-avail-lbl">Available</span>
                  <span className="wl-modal-avail-val">R{(balance?.balance ?? 0).toFixed(2)}</span>
                </div>

                <form onSubmit={handleWithdraw} className="wl-modal-form">
                  {/* Amount input */}
                  <div className="wl-modal-input-wrap">
                    <span className="wl-modal-r">R</span>
                    <input
                      type="number" step="0.01" min="50" max={balance?.balance ?? 0}
                      value={amount}
                      onChange={e => { setAmount(e.target.value); setWithdrawErr(null); }}
                      placeholder="0.00"
                      className="wl-modal-input"
                      disabled={withdrawing}
                      autoFocus
                    />
                  </div>
                  <p className="wl-modal-hint">Minimum R50</p>

                  {/* Quick amounts */}
                  <div className="wl-modal-quick">
                    {[50, 100, 200].filter(a => a <= (balance?.balance ?? 0)).map(a => (
                      <button key={a} type="button" className="wl-modal-quick-btn" onClick={() => setAmount(a.toFixed(2))} disabled={withdrawing}>R{a}</button>
                    ))}
                    {(balance?.balance ?? 0) >= 50 && (
                      <button type="button" className="wl-modal-quick-btn wl-modal-quick-all" onClick={() => setAmount((balance?.balance ?? 0).toFixed(2))} disabled={withdrawing}>All</button>
                    )}
                  </div>

                  {withdrawErr && (
                    <div className="wl-notice wl-notice-red" style={{ marginTop: 0 }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{withdrawErr}</span>
                    </div>
                  )}

                  <button type="submit" disabled={withdrawing || !amount} className="wl-modal-submit">
                    {withdrawing
                      ? <><Loader size={16} className="wl-spin" /> Processing…</>
                      : <><Download size={16} /> Withdraw R{amount || "0.00"}</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

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
    --faint:  rgba(255,248,231,0.06);
  }

  /* ── Root ── */
  .wl-root {
    min-height: 100vh;
    background: var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    padding-bottom: 60px;
  }

  /* ── Auto sign-out warning ── */
  .wl-timeout-banner {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: rgba(218,41,28,0.95);
    backdrop-filter: blur(10px);
    padding: 10px 20px;
    font-size: 13px; font-weight: 700; color: #fff;
    box-shadow: 0 2px 20px rgba(218,41,28,0.4);
    animation: wlBannerIn 0.3s ease;
  }
  @keyframes wlBannerIn {
    from { transform: translateY(-100%); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }
  .wl-timeout-dismiss {
    margin-left: 8px; padding: 4px 12px;
    background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35);
    border-radius: 20px; color: #fff; font-size: 12px; font-weight: 800;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.15s;
  }
  .wl-timeout-dismiss:hover { background: rgba(255,255,255,0.3); }

  /* ── Nav ── */
  .wl-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(10,6,0,0.96);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .wl-nav-inner {
    max-width: 680px; margin: 0 auto;
    padding: 0 20px; height: 60px;
    display: flex; align-items: center; gap: 12px;
  }
  .wl-nav-brand { display: flex; align-items: center; gap: 8px; flex: 1; }
  .wl-flame {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--gold); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 12px rgba(255,199,44,0.25);
  }
  .wl-nav-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px; letter-spacing: 2.5px; color: var(--text);
  }
  .wl-nav-right { display: flex; align-items: center; gap: 8px; }

  /* Session chip */
  .wl-session-chip {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 20px;
    background: rgba(74,222,128,0.08);
    border: 1px solid rgba(74,222,128,0.18);
    font-size: 11px; font-weight: 800;
    color: rgba(74,222,128,0.65);
    font-family: 'Plus Jakarta Sans', monospace;
    transition: all 0.3s;
    cursor: default;
  }
  .wl-session-warn {
    background: rgba(218,41,28,0.1) !important;
    border-color: rgba(218,41,28,0.35) !important;
    color: #f87171 !important;
    animation: wlChipPulse 1s ease infinite;
  }
  @keyframes wlChipPulse {
    0%,100% { opacity: 1; }
    50%     { opacity: 0.6; }
  }

  /* Icon buttons */
  .wl-icon-btn {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: var(--faint); border: 1px solid rgba(255,248,231,0.08);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.18s;
  }
  .wl-icon-btn:hover { color: var(--text); border-color: rgba(255,199,44,0.25); }
  .wl-icon-btn-red:hover { background: rgba(218,41,28,0.15); color: #f87171; border-color: rgba(218,41,28,0.3); }

  /* ── Gate / error screens ── */
  .wl-gate {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; text-align: center; padding: 40px 24px;
  }
  .wl-gate-icon  { width: 76px; height: 76px; border-radius: 20px; background: rgba(255,199,44,0.1); border: 1px solid rgba(255,199,44,0.2); display: flex; align-items: center; justify-content: center; }
  .wl-err-icon   { width: 72px; height: 72px; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
  .wl-err-gold   { background: rgba(255,199,44,0.1); border: 1px solid rgba(255,199,44,0.2); }
  .wl-err-red    { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); }
  .wl-gate-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; margin: 0; }
  .wl-gate-sub   { font-size: 14px; color: var(--muted); max-width: 300px; line-height: 1.6; margin: 0; }
  .wl-btn-red    { display: inline-flex; align-items: center; gap: 8px; background: var(--red); color: white; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 14px; padding: 13px 28px; border-radius: 50px; text-decoration: none; box-shadow: 0 6px 20px rgba(218,41,28,0.38); transition: all 0.2s; }
  .wl-btn-red:hover { background: var(--red2); transform: scale(1.02); }
  .wl-ghost      { font-size: 13px; font-weight: 700; color: var(--gold); text-decoration: none; background: none; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
  .wl-countdown  { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .wl-ring       { width: 60px; height: 60px; border-radius: 50%; border: 3px solid rgba(255,199,44,0.2); border-top-color: var(--gold); animation: wlSpin 1s linear infinite; display: flex; align-items: center; justify-content: center; }
  .wl-ring span  { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: var(--gold); animation: wlCounterSpin 1s linear infinite; }
  @keyframes wlCounterSpin { to { transform: rotate(-360deg); } }

  /* ── Body ── */
  .wl-body { max-width: 680px; margin: 0 auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 14px; }

  /* ── Balance card ── */
  .wl-balance-card {
    background: linear-gradient(160deg, #1e1000 0%, #110a00 100%);
    border: 1px solid rgba(255,199,44,0.14);
    border-radius: 22px; padding: 24px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,248,231,0.04);
    display: flex; flex-direction: column; gap: 16px;
  }
  .wl-status-row { display: flex; align-items: center; justify-content: space-between; }
  .wl-status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 20px;
    background: rgba(255,248,231,0.06); border: 1px solid rgba(255,248,231,0.1);
    font-size: 11px; font-weight: 800; color: var(--muted);
    letter-spacing: 0.03em;
  }
  .wl-status-active {
    background: rgba(74,222,128,0.08) !important;
    border-color: rgba(74,222,128,0.2) !important;
    color: rgba(74,222,128,0.8) !important;
  }
  .wl-status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: currentColor;
    animation: wlDotPulse 1.5s ease infinite;
  }
  @keyframes wlDotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
  .wl-refresh-btn {
    background: none; border: none; color: var(--muted); cursor: pointer;
    display: flex; align-items: center; padding: 6px; border-radius: 8px;
    transition: all 0.15s;
  }
  .wl-refresh-btn:hover { color: var(--gold); background: rgba(255,199,44,0.08); }

  .wl-bal-wrap    { display: flex; align-items: baseline; gap: 4px; line-height: 1; }
  .wl-bal-currency { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: var(--muted); }
  .wl-bal-amount  { font-family: 'Bebas Neue', sans-serif; font-size: 64px; letter-spacing: -2px; color: var(--text); }
  .wl-bal-label   { font-size: 12px; font-weight: 600; color: var(--muted); margin-top: -8px; }

  .wl-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: rgba(255,248,231,0.07); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,248,231,0.07); }
  .wl-stat  { background: rgba(255,248,231,0.03); padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
  .wl-stat-val { font-size: 14px; font-weight: 900; }
  .wl-stat-lbl { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }

  .wl-withdraw-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px; border-radius: 14px;
    background: var(--red); color: #fff; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 900;
    box-shadow: 0 4px 18px rgba(218,41,28,0.38); transition: all 0.2s;
  }
  .wl-withdraw-cta:hover { background: var(--red2); transform: translateY(-1px); }

  .wl-notice { display: flex; align-items: flex-start; gap: 10px; padding: 11px 14px; border-radius: 11px; font-size: 12px; font-weight: 600; line-height: 1.5; }
  .wl-notice-blue { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.25); color: #60a5fa; }
  .wl-notice-red  { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #f87171; }

  /* ── Driver summary row ── */
  .wl-summary-row {
    display: flex; align-items: center;
    background: var(--card2); border: 1px solid var(--border); border-radius: 14px;
    overflow: hidden;
  }
  .wl-summary-item { flex: 1; text-align: center; padding: 14px 12px; border-right: 1px solid var(--border); }
  .wl-summary-item:last-child { border-right: none; }
  .wl-summary-val { display: block; font-size: 16px; font-weight: 900; color: var(--text); }
  .wl-summary-lbl { display: block; font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }

  /* ── Quick links ── */
  .wl-quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .wl-quick-card  { display: flex; align-items: center; gap: 12px; background: var(--card2); border: 1px solid var(--border); border-radius: 14px; padding: 14px; text-decoration: none; transition: all 0.2s; }
  .wl-quick-card:hover { border-color: rgba(255,199,44,0.22); transform: translateY(-1px); }
  .wl-quick-icon  { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .wl-quick-text  { flex: 1; min-width: 0; }
  .wl-quick-title { display: block; font-size: 13px; font-weight: 800; color: var(--text); }
  .wl-quick-sub   { display: block; font-size: 11px; color: var(--muted); margin-top: 1px; }

  /* ── Transactions ── */
  .wl-tx-section { display: flex; flex-direction: column; gap: 10px; }
  .wl-tx-header  { display: flex; align-items: center; gap: 10px; }
  .wl-tx-title   { font-size: 15px; font-weight: 800; color: var(--text); flex: 1; }
  .wl-tx-badge   { font-size: 11px; font-weight: 800; color: var(--muted); background: var(--faint); padding: 3px 10px; border-radius: 20px; }

  .wl-empty      { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 48px 24px; background: var(--card2); border: 1px solid var(--border); border-radius: 16px; }
  .wl-empty p    { font-size: 15px; font-weight: 800; color: var(--text); margin: 0; }
  .wl-empty span { font-size: 12px; color: var(--muted); }

  .wl-tx-list    { background: var(--card2); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .wl-tx         { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-bottom: 1px solid rgba(255,248,231,0.04); transition: background 0.15s; }
  .wl-tx:last-child { border-bottom: none; }
  .wl-tx:hover   { background: rgba(255,248,231,0.02); }
  .wl-tx-icon    { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .wl-tx-info    { flex: 1; min-width: 0; }
  .wl-tx-desc    { font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
  .wl-tx-date    { font-size: 11px; color: var(--muted); margin: 2px 0 0; }
  .wl-tx-ref     { opacity: 0.6; font-family: monospace; }
  .wl-tx-amount-col { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
  .wl-tx-amount  { font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 0.5px; }
  .wl-pos        { color: #4ade80; }
  .wl-neg        { color: #f87171; }
  .wl-tx-balance { font-size: 10px; color: var(--muted); font-weight: 700; }

  /* ── Info footer ── */
  .wl-info-footer { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; background: var(--faint); border: 1px solid rgba(255,248,231,0.06); border-radius: 12px; }
  .wl-info-row    { display: flex; align-items: flex-start; gap: 8px; font-size: 11px; font-weight: 600; color: var(--muted); line-height: 1.5; }
  .wl-info-row strong { color: var(--text); }

  /* ── Overlay ── */
  .wl-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(10,6,0,0.88); backdrop-filter: blur(10px); display: flex; align-items: flex-end; justify-content: center; padding: 0; }
  @media (min-width: 480px) { .wl-overlay { align-items: center; padding: 20px; } }

  /* ── Modal ── */
  .wl-modal {
    background: var(--card2);
    border: 1px solid rgba(255,199,44,0.14);
    border-radius: 24px 24px 0 0;
    width: 100%; max-width: 460px;
    box-shadow: 0 -20px 60px rgba(0,0,0,0.5);
    animation: wlModalUp 0.3s cubic-bezier(0.34,1.2,0.64,1);
    overflow: hidden;
  }
  @media (min-width: 480px) { .wl-modal { border-radius: 24px; animation: wlModalScale 0.3s cubic-bezier(0.34,1.2,0.64,1); } }
  @keyframes wlModalUp    { from { transform: translateY(100%); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes wlModalScale { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .wl-modal-hd   { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 22px 22px 0; }
  .wl-modal-title { font-size: 18px; font-weight: 900; color: var(--text); margin: 0; }
  .wl-modal-sub   { font-size: 12px; color: var(--muted); margin: 3px 0 0; }

  .wl-modal-avail { display: flex; align-items: center; justify-content: space-between; margin: 16px 22px 0; padding: 12px 14px; background: rgba(255,248,231,0.04); border: 1px solid var(--border); border-radius: 11px; }
  .wl-modal-avail-lbl { font-size: 12px; font-weight: 700; color: var(--muted); }
  .wl-modal-avail-val { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: var(--text); }

  .wl-modal-form  { display: flex; flex-direction: column; gap: 12px; padding: 16px 22px 24px; }
  .wl-modal-input-wrap { display: flex; align-items: center; gap: 8px; background: rgba(255,248,231,0.05); border: 1.5px solid var(--border); border-radius: 14px; padding: 0 16px; transition: border-color 0.2s; }
  .wl-modal-input-wrap:focus-within { border-color: rgba(255,199,44,0.4); }
  .wl-modal-r     { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: var(--muted); flex-shrink: 0; }
  .wl-modal-input { flex: 1; background: none; border: none; outline: none; color: var(--text); font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: -0.5px; padding: 10px 0; }
  .wl-modal-input::placeholder { color: rgba(255,248,231,0.15); }
  .wl-modal-hint  { font-size: 11px; color: var(--muted); font-weight: 600; margin: -4px 0 0 2px; }

  .wl-modal-quick { display: flex; gap: 8px; flex-wrap: wrap; }
  .wl-modal-quick-btn { padding: 8px 16px; border-radius: 10px; background: rgba(255,248,231,0.06); border: 1px solid var(--border); color: var(--text); font-size: 13px; font-weight: 800; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; }
  .wl-modal-quick-btn:hover:not(:disabled) { background: rgba(255,199,44,0.1); border-color: rgba(255,199,44,0.3); }
  .wl-modal-quick-all { background: rgba(255,199,44,0.08); border-color: rgba(255,199,44,0.2); color: var(--gold); }
  .wl-modal-quick-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .wl-modal-submit { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; background: var(--red); color: #fff; border: none; border-radius: 14px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 900; box-shadow: 0 6px 20px rgba(218,41,28,0.38); transition: all 0.2s; }
  .wl-modal-submit:hover:not(:disabled) { background: var(--red2); transform: translateY(-1px); }
  .wl-modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .wl-modal-success { padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
  .wl-succ-icon     { width: 72px; height: 72px; border-radius: 20px; background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.25); display: flex; align-items: center; justify-content: center; }
  .wl-modal-ok-title { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 2px; color: var(--text); margin: 0; }
  .wl-modal-ok-sub   { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 280px; margin: 0; }

  @keyframes wlSpin { to { transform: rotate(360deg); } }
  .wl-spin { animation: wlSpin 0.8s linear infinite; }

  @media (max-width: 600px) {
    .wl-body       { padding: 16px 12px; }
    .wl-bal-amount { font-size: 52px; }
    .wl-stats      { grid-template-columns: 1fr; }
    .wl-quick-links { grid-template-columns: 1fr; }
    .wl-summary-row { flex-direction: column; gap: 0; }
    .wl-summary-item { border-right: none; border-bottom: 1px solid var(--border); }
    .wl-summary-item:last-child { border-bottom: none; }
  }
`;
