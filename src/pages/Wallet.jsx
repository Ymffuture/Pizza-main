// src/pages/Wallet.jsx - Driver Earnings Wallet
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getWalletBalance,
  getWalletTransactions,
  getDriverProfile,
  withdrawFunds,
} from "../api/delivery.api";
import {
  Flame, Wallet as WalletIcon, ArrowLeft, TrendingUp,
  DollarSign, Download, Clock, CheckCircle2, AlertCircle,
  ArrowDownRight, Gift, Zap, ShoppingBag,
  Loader, X, Info, ChevronRight, RefreshCw, WifiOff,
} from "lucide-react";

// ── Classify API errors ───────────────────────────────────────────────────
function classifyError(err) {
  if (!err?.response || err?.code === "ERR_NETWORK" || err?.code === "ECONNABORTED") {
    return { type: "network", msg: "Server is waking up — this can take 30–60 seconds on first load." };
  }
  const status = err.response.status;
  const detail = err.response.data?.detail || err.response.data?.message || err.message;
  if (status === 401) return { type: "auth",       msg: "Session expired. Please sign in again." };
  if (status === 404) return { type: "no_profile", msg: detail || "Driver profile not found." };
  if (status === 403) return { type: "forbidden",  msg: detail || "Access denied." };
  return { type: "error", msg: detail || "Failed to load wallet data." };
}

export default function WalletPage() {
  const navigate = useNavigate();
  const { isAuth, token } = useAuth();

  const [loading, setLoading]           = useState(true);
  const [balance, setBalance]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile]           = useState(null);
  const [errorInfo, setErrorInfo]       = useState(null);
  const [retryIn, setRetryIn]           = useState(null);
  const timerRef = useRef(null);

  // Withdrawal modal
  const [showWithdraw, setShowWithdraw]     = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing]       = useState(false);
  const [withdrawError, setWithdrawError]   = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const clearRetry = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRetryIn(null);
  };

  const startRetry = (seconds) => {
    setRetryIn(seconds);
    timerRef.current = setInterval(() => {
      setRetryIn(prev => {
        if (prev <= 1) { clearRetry(); fetchData(true); return null; }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorInfo(null);
    clearRetry();
    try {
      const [balRes, txRes, profRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(50),
        getDriverProfile(),
      ]);
      setBalance(balRes.data);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      setProfile(profRes.data);
    } catch (err) {
      const info = classifyError(err);
      setErrorInfo(info);
      if (info.type === "network") startRetry(40);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuth && token) fetchData();
    return () => clearRetry();
  }, [isAuth, token]); // eslint-disable-line

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 50) { setWithdrawError("Minimum withdrawal is R50"); return; }
    if (amount > (balance?.balance ?? 0)) { setWithdrawError("Insufficient balance"); return; }
    if (!profile?.bank_name || !profile?.account_number || !profile?.account_holder) {
      setWithdrawError("Banking details incomplete. Update your driver profile first."); return;
    }
    setWithdrawing(true); setWithdrawError(null);
    try {
      await withdrawFunds({ amount, bank_name: profile.bank_name, account_number: profile.account_number, account_holder: profile.account_holder });
      setWithdrawSuccess(true);
      setTimeout(() => { setShowWithdraw(false); setWithdrawSuccess(false); setWithdrawAmount(""); fetchData(true); }, 2000);
    } catch (err) {
      setWithdrawError(err?.response?.data?.detail || err.message || "Withdrawal failed");
    } finally { setWithdrawing(false); }
  };

  const maskedAccount = (() => {
    const n = profile?.account_number;
    return n && n.length >= 4 ? `****${n.slice(-4)}` : (n || "—");
  })();

  const canWithdraw = profile?.status === "approved" && (balance?.balance ?? 0) >= 50 && profile?.bank_name && profile?.account_number;

  const txIcon  = t => ({ delivery_payment:<ShoppingBag className="w-4 h-4"/>, withdrawal:<ArrowDownRight className="w-4 h-4"/>, bonus:<Gift className="w-4 h-4"/>, penalty:<AlertCircle className="w-4 h-4"/> }[t] || <Zap className="w-4 h-4"/>);
  const txColor = t => ({ delivery_payment:{bg:"rgba(74,222,128,0.1)",c:"#4ade80"}, bonus:{bg:"rgba(96,165,250,0.1)",c:"#60a5fa"}, withdrawal:{bg:"rgba(248,113,113,0.1)",c:"#f87171"}, penalty:{bg:"rgba(251,191,36,0.1)",c:"#fbbf24"} }[t] || {bg:"rgba(255,248,231,0.05)",c:"var(--muted)"});

  /* ── Unauthenticated ── */
  if (!isAuth) return (
    <div className="wl-root"><style>{styles}</style>
      <div className="wl-center">
        <div className="wl-gate-icon"><WalletIcon className="w-10 h-10" style={{color:"#FFC72C"}}/></div>
        <h2 className="wl-big-title">Driver Wallet</h2>
        <p className="wl-sub">Sign in to view your earnings and withdraw funds.</p>
        <Link to="/login?redirect=/wallet" className="wl-red-btn">Sign In</Link>
        <Link to="/deliver" className="wl-ghost-link">Not a driver yet? Apply now →</Link>
      </div>
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <div className="wl-root"><style>{styles}</style>
      <div className="wl-center">
        <Loader className="wl-spin" style={{width:36,height:36,color:"#FFC72C"}}/>
        <p className="wl-sub">Loading wallet…</p>
      </div>
    </div>
  );

  /* ── Error screens ── */
  if (errorInfo) return (
    <div className="wl-root"><style>{styles}</style>
    <header className="wl-header">
      <div className="wl-header-inner">
        <button className="wl-back-btn" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5"/></button>
        <div className="wl-hbrand"><div className="wl-logo"><Flame className="w-4 h-4" style={{color:"#0e0700"}}/></div><span className="wl-brand">KOTABITES</span></div>
        <div style={{width:36}}/>
      </div>
    </header>
    <div className="wl-center" style={{minHeight:"calc(100vh - 64px)"}}>
      {errorInfo.type === "network" ? (
        <>
          <div className="wl-err-icon wl-err-gold"><WifiOff className="w-10 h-10" style={{color:"#FFC72C"}}/></div>
          <h3 className="wl-big-title">Server Waking Up</h3>
          <p className="wl-sub" style={{maxWidth:300}}>{errorInfo.msg}</p>
          <div className="wl-cold-card">
            <Zap className="w-4 h-4" style={{color:"#FFC72C",flexShrink:0}}/>
            <p>The free server sleeps when idle. It takes <strong>30–60s</strong> to restart. Hang tight!</p>
          </div>
          {retryIn !== null ? (
            <div className="wl-countdown">
              <div className="wl-ring"><span className="wl-ring-num">{retryIn}</span></div>
              <p className="wl-sub" style={{fontSize:12}}>Auto-retrying in {retryIn}s…</p>
              <button className="wl-ghost-link" onClick={() => { clearRetry(); fetchData(); }}>Retry now instead</button>
            </div>
          ) : (
            <button className="wl-red-btn" onClick={() => fetchData()}>
              <RefreshCw className="w-4 h-4"/> Retry Now
            </button>
          )}
        </>
      ) : errorInfo.type === "no_profile" ? (
        <>
          <div className="wl-err-icon wl-err-gold"><WalletIcon className="w-10 h-10" style={{color:"#FFC72C"}}/></div>
          <h3 className="wl-big-title">No Driver Profile</h3>
          <p className="wl-sub">Complete driver signup to access your wallet.</p>
          <Link to="/deliver" className="wl-red-btn">Apply to Drive</Link>
          <button className="wl-ghost-link" onClick={() => fetchData()}>Retry</button>
        </>
      ) : errorInfo.type === "auth" ? (
        <>
          <div className="wl-err-icon wl-err-red"><AlertCircle className="w-10 h-10" style={{color:"#f87171"}}/></div>
          <h3 className="wl-big-title">Session Expired</h3>
          <p className="wl-sub">{errorInfo.msg}</p>
          <Link to="/login?redirect=/wallet" className="wl-red-btn">Sign In Again</Link>
        </>
      ) : (
        <>
          <div className="wl-err-icon wl-err-red"><AlertCircle className="w-10 h-10" style={{color:"#f87171"}}/></div>
          <h3 className="wl-big-title">Something Went Wrong</h3>
          <p className="wl-sub">{errorInfo.msg}</p>
          <button className="wl-red-btn" onClick={() => fetchData()}><RefreshCw className="w-4 h-4"/> Retry</button>
        </>
      )}
    </div>
    </div>
  );

  /* ── Main view ── */
  return (
    <div className="wl-root">
      <style>{styles}</style>

      <header className="wl-header">
        <div className="wl-header-inner">
          <button className="wl-back-btn" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5"/></button>
          <div className="wl-hbrand"><div className="wl-logo"><Flame className="w-4 h-4" style={{color:"#0e0700"}}/></div><span className="wl-brand">KOTABITES</span></div>
          <span className="wl-user-pill">{profile?.status === "approved" ? "✅" : "⏳"} {profile?.status || "Driver"}</span>
        </div>
      </header>

      <div className="wl-body">

        {/* Balance Card */}
        <div className="wl-balance-card">
          <div className="wl-bal-header">
            <div className="wl-bal-label"><WalletIcon className="w-4 h-4"/><span>Available Balance</span></div>
            {canWithdraw && <button onClick={() => setShowWithdraw(true)} className="wl-withdraw-btn"><Download className="w-4 h-4"/> Withdraw</button>}
          </div>
          <div className="wl-bal-amount"><span className="wl-cur">R</span><span className="wl-amt">{(balance?.balance ?? 0).toFixed(2)}</span></div>

          {profile?.status !== "approved" && (
            <div className="wl-notice wl-notice-blue"><Info className="w-4 h-4" style={{flexShrink:0}}/><span>Account pending approval. Withdrawals unlock once approved.</span></div>
          )}
          {profile?.status === "approved" && (!profile?.bank_name || !profile?.account_number) && (
            <div className="wl-notice wl-notice-red"><AlertCircle className="w-4 h-4" style={{flexShrink:0}}/>
              <span>Banking details missing — update your <Link to="/driver-dashboard" style={{color:"inherit",fontWeight:800,textDecoration:"underline"}}>driver profile</Link> to enable withdrawals.</span>
            </div>
          )}

          <div className="wl-stats-row">
            {[
              { label:"Total Earned",    val:`R${(balance?.total_earned??0).toFixed(2)}`,    icon:<TrendingUp className="w-4 h-4"/>, c:"#4ade80" },
              { label:"Total Withdrawn", val:`R${(balance?.total_withdrawn??0).toFixed(2)}`, icon:<ArrowDownRight className="w-4 h-4"/>, c:"#f87171" },
              { label:"Pending",         val:`R${(balance?.pending_amount??0).toFixed(2)}`,  icon:<Clock className="w-4 h-4"/>, c:"#FFC72C" },
            ].map(({label,val,icon,c}) => (
              <div key={label} className="wl-stat">
                <div className="wl-stat-icon" style={{background:`${c}18`}}><span style={{color:c}}>{icon}</span></div>
                <span className="wl-stat-lbl">{label}</span>
                <span className="wl-stat-val">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Stats */}
        {profile && (
          <div className="wl-driver-row">
            <div className="wl-dstat"><span className="wl-dstat-lbl">Deliveries</span><span className="wl-dstat-val">{profile.total_deliveries||0}</span></div>
            <div className="wl-divider"/>
            <div className="wl-dstat"><span className="wl-dstat-lbl">Rating</span><span className="wl-dstat-val">⭐ {profile.rating?.toFixed(1)||"5.0"}</span></div>
            <div className="wl-divider"/>
            <div className="wl-dstat"><span className="wl-dstat-lbl">Status</span><span className="wl-dstat-val" style={{color:profile.is_available?"#4ade80":"var(--muted)"}}>{profile.is_available?"Online":"Offline"}</span></div>
          </div>
        )}

        {/* Quick Links */}
        <div className="wl-links">
          {[
            { to:"/driver-dashboard",           label:"Driver Dashboard",  sub:"Orders & deliveries", bg:"rgba(74,222,128,0.1)",  c:"#4ade80",  icon:<ShoppingBag className="w-5 h-5"/> },
            { to:"/driver-dashboard?tab=orders", label:"Available Orders",  sub:"Accept new orders",   bg:"rgba(96,165,250,0.1)",  c:"#60a5fa",  icon:<Clock className="w-5 h-5"/> },
          ].map(({to,label,sub,bg,c,icon}) => (
            <Link key={to} to={to} className="wl-link-card">
              <div className="wl-link-icon" style={{background:bg}}><span style={{color:c}}>{icon}</span></div>
              <div><span className="wl-link-title">{label}</span><span className="wl-link-sub">{sub}</span></div>
              <ChevronRight className="w-5 h-5" style={{color:"var(--muted)",marginLeft:"auto"}}/>
            </Link>
          ))}
        </div>

        {/* Transactions */}
        <div className="wl-tx-header">
          <h2 className="wl-tx-title">Transaction History</h2>
          <span className="wl-tx-count">{transactions.length}</span>
        </div>

        {transactions.length === 0 ? (
          <div className="wl-empty"><Clock className="w-10 h-10" style={{color:"var(--muted)"}}/><p>No transactions yet</p><span>Start delivering to see earnings here</span></div>
        ) : (
          <div className="wl-tx-list">
            {transactions.map(tx => {
              const col = txColor(tx.type); const pos = tx.amount > 0;
              return (
                <div key={tx.id} className="wl-tx">
                  <div className="wl-tx-icon" style={{background:col.bg,color:col.c}}>{txIcon(tx.type)}</div>
                  <div className="wl-tx-info">
                    <p className="wl-tx-lbl">{tx.description}</p>
                    <p className="wl-tx-date">{new Date(tx.created_at).toLocaleDateString("en-ZA",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}{tx.order_id&&<span style={{opacity:.6}}> · #{(tx.reference||tx.order_id).slice(-8)}</span>}</p>
                  </div>
                  <div className="wl-tx-right">
                    <span className={`wl-tx-amt ${pos?"wl-pos":"wl-neg"}`}>{pos?"+":""}R{Math.abs(tx.amount).toFixed(2)}</span>
                    {tx.balance_after!=null&&<span className="wl-tx-bal">Bal: R{tx.balance_after.toFixed(2)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="wl-footer-note"><Info className="w-4 h-4" style={{color:"var(--muted)",flexShrink:0}}/><p>Earnings credited after delivery. Min withdrawal <strong>R50</strong>. Payout within 24–48 hrs.</p></div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdraw && (
        <div className="wl-overlay" onClick={() => !withdrawing && setShowWithdraw(false)}>
          <div className="wl-modal" onClick={e => e.stopPropagation()}>
            {withdrawSuccess ? (
              <div className="wl-modal-success">
                <div className="wl-succ-icon"><CheckCircle2 className="w-10 h-10" style={{color:"#4ade80"}}/></div>
                <h3 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:2,color:"var(--text)"}}>Withdrawal Submitted!</h3>
                <p style={{fontSize:13,color:"var(--muted)"}}>Funds transferred within 24–48 hours.</p>
              </div>
            ) : (
              <>
                <div className="wl-modal-head">
                  <h3 className="wl-modal-title">Withdraw Funds</h3>
                  <button className="wl-modal-close" onClick={() => setShowWithdraw(false)}><X className="w-5 h-5"/></button>
                </div>
                <div className="wl-modal-body">
                  <div className="wl-modal-info">
                    <div className="wl-mrow"><span>Available</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"var(--text)"}}>R{(balance?.balance??0).toFixed(2)}</span></div>
                    <div className="wl-mrow"><span>Bank</span><span>{profile?.bank_name} — {maskedAccount}</span></div>
                    <div className="wl-mrow"><span>Holder</span><span>{profile?.account_holder||"—"}</span></div>
                  </div>
                  {withdrawError && <div className="wl-notice wl-notice-red"><AlertCircle className="w-4 h-4" style={{flexShrink:0}}/><span>{withdrawError}</span></div>}
                  <form onSubmit={handleWithdraw} className="wl-modal-form">
                    <div className="wl-amt-wrap"><span className="wl-amt-r">R</span><input type="number" step="0.01" min="50" max={balance?.balance??0} value={withdrawAmount} onChange={e=>{setWithdrawAmount(e.target.value);setWithdrawError(null);}} placeholder="0.00" className="wl-amt-inp" disabled={withdrawing}/></div>
                    <p style={{fontSize:11,color:"var(--muted)"}}>Minimum: R50</p>
                    <div className="wl-quick-amts">
                      {[50,100,200].filter(a=>a<=(balance?.balance??0)).map(a=>(
                        <button key={a} type="button" onClick={()=>setWithdrawAmount(a.toFixed(2))} className="wl-quick-btn" disabled={withdrawing}>R{a}</button>
                      ))}
                      {(balance?.balance??0)>=50&&<button type="button" onClick={()=>setWithdrawAmount((balance?.balance??0).toFixed(2))} className="wl-quick-btn" disabled={withdrawing}>All</button>}
                    </div>
                    <button type="submit" disabled={withdrawing} className="wl-submit-btn">
                      {withdrawing?<><Loader className="w-5 h-5 wl-spin"/> Processing…</>:<><Download className="w-5 h-5"/> Withdraw Funds</>}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root{--red:#DA291C;--red2:#b91c1c;--gold:#FFC72C;--dark:#0e0700;--card:#1a0e00;--border:rgba(255,199,44,0.1);--text:#fff8e7;--muted:rgba(255,248,231,0.42);}
  .wl-root{min-height:100vh;background:radial-gradient(ellipse 80% 35% at 50% 0%,rgba(218,41,28,0.12) 0%,transparent 65%),var(--dark);font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--text);overflow-x:hidden;padding-bottom:60px;}

  /* Header */
  .wl-header{position:sticky;top:0;z-index:100;background:rgba(14,7,0,0.95);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
  .wl-header-inner{max-width:680px;margin:0 auto;padding:13px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .wl-back-btn{width:36px;height:36px;border-radius:10px;flex-shrink:0;background:rgba(255,248,231,0.05);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:all 0.2s;}
  .wl-back-btn:hover{color:var(--text);border-color:rgba(255,199,44,0.3);}
  .wl-hbrand{display:flex;align-items:center;gap:8px;}
  .wl-logo{width:32px;height:32px;background:var(--gold);border-radius:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(255,199,44,0.25);}
  .wl-brand{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:3px;color:var(--text);}
  .wl-user-pill{padding:5px 12px;border-radius:50px;background:rgba(255,199,44,0.08);border:1px solid rgba(255,199,44,0.2);font-size:11px;font-weight:800;color:var(--gold);text-transform:capitalize;}

  /* Center screens */
  .wl-center{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:40px 24px;}
  .wl-gate-icon,.wl-err-icon{width:80px;height:80px;border-radius:22px;display:flex;align-items:center;justify-content:center;}
  .wl-err-gold{background:rgba(255,199,44,0.1);border:1px solid rgba(255,199,44,0.2);}
  .wl-err-red{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);}
  .wl-big-title{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:2px;margin:0;}
  .wl-sub{font-size:14px;color:var(--muted);max-width:320px;line-height:1.6;margin:0;}
  .wl-red-btn{display:inline-flex;align-items:center;gap:8px;background:var(--red);color:white;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;box-shadow:0 6px 20px rgba(218,41,28,0.4);transition:all 0.2s;margin-top:4px;}
  .wl-red-btn:hover{background:var(--red2);transform:scale(1.03);}
  .wl-ghost-link{background:none;border:none;cursor:pointer;font-size:13px;color:var(--gold);font-weight:700;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif;}

  /* Cold start */
  .wl-cold-card{display:flex;align-items:flex-start;gap:10px;background:rgba(255,199,44,0.08);border:1px solid rgba(255,199,44,0.2);border-radius:14px;padding:14px 16px;max-width:340px;font-size:12px;color:var(--muted);text-align:left;line-height:1.6;}
  .wl-cold-card strong{color:var(--text);}
  .wl-countdown{display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:4px;}
  .wl-ring{width:64px;height:64px;border-radius:50%;border:3px solid rgba(255,199,44,0.25);border-top-color:var(--gold);display:flex;align-items:center;justify-content:center;animation:wlSpin 1s linear infinite;}
  .wl-ring-num{font-family:'Bebas Neue',sans-serif;font-size:24px;color:var(--gold);animation:wlCounterSpin 1s linear infinite;}
  @keyframes wlCounterSpin{to{transform:rotate(-360deg);}}

  /* Body */
  .wl-body{max-width:680px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:20px;}

  /* Balance card */
  .wl-balance-card{background:linear-gradient(135deg,var(--card) 0%,rgba(26,14,0,0.95) 100%);border:1px solid var(--border);border-radius:24px;padding:28px 24px;}
  .wl-bal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
  .wl-bal-label{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);}
  .wl-withdraw-btn{display:flex;align-items:center;gap:6px;background:var(--red);color:white;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:12px;padding:8px 16px;border-radius:50px;transition:all 0.2s;}
  .wl-withdraw-btn:hover{background:var(--red2);}
  .wl-bal-amount{display:flex;align-items:baseline;gap:4px;margin-bottom:8px;}
  .wl-cur{font-family:'Bebas Neue',sans-serif;font-size:32px;color:var(--muted);}
  .wl-amt{font-family:'Bebas Neue',sans-serif;font-size:64px;letter-spacing:-1px;color:var(--text);line-height:1;}

  /* Notices */
  .wl-notice{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:12px;font-size:12px;font-weight:700;margin-top:8px;}
  .wl-notice-blue{background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.25);color:#60a5fa;}
  .wl-notice-red{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);color:#f87171;}

  /* Stats row */
  .wl-stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-top:20px;border-top:1px solid rgba(255,199,44,0.08);margin-top:16px;}
  .wl-stat{display:flex;flex-direction:column;align-items:center;gap:6px;}
  .wl-stat-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
  .wl-stat-lbl{font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);text-align:center;}
  .wl-stat-val{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:0.5px;color:var(--text);}

  /* Driver row */
  .wl-driver-row{display:flex;align-items:center;gap:16px;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px 20px;}
  .wl-dstat{flex:1;text-align:center;display:flex;flex-direction:column;gap:4px;}
  .wl-dstat-lbl{font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);}
  .wl-dstat-val{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--text);}
  .wl-divider{width:1px;height:32px;background:rgba(255,199,44,0.1);}

  /* Links */
  .wl-links{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
  .wl-link-card{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;text-decoration:none;transition:all 0.25s;}
  .wl-link-card:hover{border-color:rgba(255,199,44,0.25);transform:translateY(-2px);}
  .wl-link-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .wl-link-title{display:block;font-size:13px;font-weight:800;color:var(--text);}
  .wl-link-sub{display:block;font-size:11px;color:var(--muted);}

  /* Tx header */
  .wl-tx-header{display:flex;align-items:center;justify-content:space-between;margin-top:12px;}
  .wl-tx-title{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1.5px;color:var(--text);}
  .wl-tx-count{font-size:11px;font-weight:800;color:var(--muted);background:rgba(255,248,231,0.06);padding:3px 10px;border-radius:50px;}

  /* Empty */
  .wl-empty{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:60px 24px;background:var(--card);border:1px solid var(--border);border-radius:18px;}
  .wl-empty p{font-size:15px;font-weight:800;color:var(--text);}
  .wl-empty span{font-size:13px;color:var(--muted);}

  /* Tx list */
  .wl-tx-list{background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden;}
  .wl-tx{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid rgba(255,248,231,0.04);transition:background 0.2s;}
  .wl-tx:last-child{border-bottom:none;}
  .wl-tx:hover{background:rgba(255,248,231,0.02);}
  .wl-tx-icon{width:36px;height:36px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
  .wl-tx-info{flex:1;min-width:0;}
  .wl-tx-lbl{font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .wl-tx-date{font-size:11px;color:var(--muted);margin-top:2px;}
  .wl-tx-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;}
  .wl-tx-amt{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:0.5px;}
  .wl-pos{color:#4ade80;} .wl-neg{color:#f87171;}
  .wl-tx-bal{font-size:10px;color:var(--muted);font-weight:700;}

  .wl-footer-note{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;border-radius:12px;background:rgba(255,248,231,0.02);border:1px solid var(--border);}
  .wl-footer-note p{font-size:11px;color:var(--muted);line-height:1.55;}
  .wl-footer-note strong{color:var(--text);}

  /* Modal */
  .wl-overlay{position:fixed;inset:0;z-index:1000;background:rgba(14,7,0,0.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;}
  .wl-modal{background:var(--card);border:1px solid var(--border);border-radius:24px;width:100%;max-width:440px;box-shadow:0 24px 64px rgba(0,0,0,0.6);animation:wlScale 0.3s cubic-bezier(0.34,1.56,0.64,1);}
  .wl-modal-head{display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0;}
  .wl-modal-title{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:1.5px;color:var(--text);}
  .wl-modal-close{width:32px;height:32px;border-radius:8px;background:rgba(255,248,231,0.05);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:all 0.2s;}
  .wl-modal-close:hover{color:var(--text);}
  .wl-modal-body{padding:24px;display:flex;flex-direction:column;gap:14px;}
  .wl-modal-info{background:rgba(255,248,231,0.03);border:1px solid var(--border);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;}
  .wl-mrow{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--muted);}
  .wl-modal-form{display:flex;flex-direction:column;gap:12px;}
  .wl-amt-wrap{display:flex;align-items:center;gap:10px;background:rgba(255,248,231,0.04);border:1.5px solid var(--border);border-radius:12px;padding:0 16px;transition:border-color 0.2s;}
  .wl-amt-wrap:focus-within{border-color:rgba(255,199,44,0.4);}
  .wl-amt-r{font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--muted);}
  .wl-amt-inp{flex:1;background:none;border:none;outline:none;color:var(--text);font-size:28px;font-weight:900;font-family:'Bebas Neue',sans-serif;padding:12px 0;}
  .wl-amt-inp::placeholder{color:rgba(255,248,231,0.15);}
  .wl-quick-amts{display:flex;gap:8px;flex-wrap:wrap;}
  .wl-quick-btn{background:rgba(255,248,231,0.04);border:1px solid var(--border);border-radius:10px;padding:9px 16px;cursor:pointer;font-size:12px;font-weight:800;color:var(--text);transition:all 0.2s;font-family:'Plus Jakarta Sans',sans-serif;}
  .wl-quick-btn:hover:not(:disabled){background:rgba(255,199,44,0.1);border-color:rgba(255,199,44,0.3);}
  .wl-quick-btn:disabled{opacity:0.4;cursor:not-allowed;}
  .wl-submit-btn{display:flex;align-items:center;justify-content:center;gap:10px;background:var(--red);color:white;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:900;font-size:15px;padding:15px;border-radius:14px;box-shadow:0 6px 20px rgba(218,41,28,0.4);transition:all 0.2s;}
  .wl-submit-btn:hover:not(:disabled){background:var(--red2);transform:scale(1.02);}
  .wl-submit-btn:disabled{opacity:0.55;cursor:not-allowed;}
  .wl-modal-success{padding:40px 24px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;}
  .wl-succ-icon{width:72px;height:72px;border-radius:20px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);display:flex;align-items:center;justify-content:center;}

  @keyframes wlSpin{to{transform:rotate(360deg);}}
  .wl-spin{animation:wlSpin 0.8s linear infinite;}
  @keyframes wlScale{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}

  @media(max-width:640px){
    .wl-body{padding:16px 12px;}
    .wl-amt{font-size:48px;}
    .wl-stats-row{grid-template-columns:1fr;}
    .wl-links{grid-template-columns:1fr;}
    .wl-driver-row{flex-direction:column;gap:12px;}
    .wl-divider{width:100%;height:1px;}
  }
`;
