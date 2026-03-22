// src/pages/Wallet.jsx - Driver Earnings Wallet
import { useState, useEffect } from "react";
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
  ArrowUpRight, ArrowDownRight, Gift, Zap, ShoppingBag,
  Loader, X, Info, ChevronRight
} from "lucide-react";

export default function WalletPage() {
  const navigate = useNavigate();
  const { isAuth, user, token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  
  // Withdrawal modal state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    if (isAuth && token) {
      fetchWalletData();
    }
  }, [isAuth, token]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [balanceRes, txRes, profileRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(50),
        getDriverProfile(),
      ]);
      
      setBalance(balanceRes.data);
      setTransactions(txRes.data);
      setProfile(profileRes.data);
      
    } catch (err) {
      if (err?.response?.status === 404) {
        setError("Driver profile not found. Please complete driver signup first.");
      } else {
        setError(err?.response?.data?.detail || err.message || "Failed to load wallet data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 50) {
      setWithdrawError("Minimum withdrawal is R50");
      return;
    }
    
    if (amount > balance?.balance) {
      setWithdrawError("Insufficient balance");
      return;
    }
    
    setWithdrawing(true);
    setWithdrawError(null);
    
    try {
      await withdrawFunds({
        amount,
        bank_name: profile?.bank_name,
        account_number: profile?.account_number,
        account_holder: profile?.account_holder,
      });
      
      setWithdrawSuccess(true);
      setTimeout(() => {
        setShowWithdraw(false);
        setWithdrawSuccess(false);
        setWithdrawAmount("");
        fetchWalletData(); // Refresh data
      }, 2000);
      
    } catch (err) {
      setWithdrawError(err?.response?.data?.detail || err.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'delivery_payment': return <ShoppingBag className="w-4 h-4" />;
      case 'withdrawal': return <ArrowDownRight className="w-4 h-4" />;
      case 'bonus': return <Gift className="w-4 h-4" />;
      case 'penalty': return <AlertCircle className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'delivery_payment': return { bg: 'rgba(74,222,128,0.1)', color: '#4ade80' };
      case 'bonus': return { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa' };
      case 'withdrawal': return { bg: 'rgba(248,113,113,0.1)', color: '#f87171' };
      case 'penalty': return { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' };
      default: return { bg: 'rgba(255,248,231,0.05)', color: 'var(--muted)' };
    }
  };

  if (!isAuth) {
    return (
      <div className="wl-root">
        <style>{styles}</style>
        <div className="wl-auth-gate">
          <div className="wl-auth-icon"><WalletIcon className="w-10 h-10" style={{ color: "#FFC72C" }} /></div>
          <h2 className="wl-auth-title">Driver Wallet</h2>
          <p className="wl-auth-sub">Sign in to view your earnings, track transactions, and withdraw funds.</p>
          <Link to="/login?redirect=/wallet" className="wl-auth-btn">Sign In to Continue</Link>
          <Link to="/deliver" className="wl-auth-link">Not a driver yet? Apply now →</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wl-root">
        <style>{styles}</style>
        <div className="wl-loading">
          <Loader className="w-8 h-8 wl-spin" style={{ color: "var(--gold)" }} />
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wl-root">
        <style>{styles}</style>
        <div className="wl-error">
          <AlertCircle className="w-10 h-10" style={{ color: "#f87171" }} />
          <h3>Unable to Load Wallet</h3>
          <p>{error}</p>
          {error.includes("Driver profile not found") && (
            <Link to="/deliver" className="wl-auth-btn">Complete Driver Signup</Link>
          )}
          <button onClick={fetchWalletData} className="wl-retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-root">
      <style>{styles}</style>

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
              {profile?.status === 'approved' ? '✅' : '⏳'} {profile?.status || 'Driver'}
            </span>
          </div>
        </div>
      </header>

      <div className="wl-body">

        {/* ── Balance Card ── */}
        <div className="wl-balance-card">
          <div className="wl-balance-header">
            <div className="wl-balance-label">
              <WalletIcon className="w-4 h-4" />
              <span>Available Balance</span>
            </div>
            {profile?.status === 'approved' && balance?.balance >= 50 && (
              <button onClick={() => setShowWithdraw(true)} className="wl-withdraw-btn">
                <Download className="w-4 h-4" />
                Withdraw
              </button>
            )}
          </div>

          <div className="wl-balance-amount">
            <span className="wl-currency">R</span>
            <span className="wl-amount">{balance?.balance?.toFixed(2) || '0.00'}</span>
          </div>

          {profile?.status !== 'approved' && (
            <div className="wl-status-banner">
              <Info className="w-4 h-4" />
              <span>Your account is pending approval. You'll be able to withdraw once approved.</span>
            </div>
          )}

          <div className="wl-balance-stats">
            <div className="wl-balance-stat">
              <div className="wl-stat-icon" style={{ background: 'rgba(74,222,128,0.1)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#4ade80' }} />
              </div>
              <div className="wl-stat-info">
                <span className="wl-stat-label">Total Earned</span>
                <span className="wl-stat-value">R{balance?.total_earned?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="wl-balance-stat">
              <div className="wl-stat-icon" style={{ background: 'rgba(248,113,113,0.1)' }}>
                <ArrowDownRight className="w-4 h-4" style={{ color: '#f87171' }} />
              </div>
              <div className="wl-stat-info">
                <span className="wl-stat-label">Total Withdrawn</span>
                <span className="wl-stat-value">R{balance?.total_withdrawn?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="wl-balance-stat">
              <div className="wl-stat-icon" style={{ background: 'rgba(255,199,44,0.1)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <div className="wl-stat-info">
                <span className="wl-stat-label">Pending</span>
                <span className="wl-stat-value">R{balance?.pending_amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Driver Stats ── */}
        {profile && (
          <div className="wl-driver-stats">
            <div className="wl-driver-stat">
              <span className="wl-driver-stat-label">Total Deliveries</span>
              <span className="wl-driver-stat-value">{profile.total_deliveries || 0}</span>
            </div>
            <div className="wl-driver-stat-divider" />
            <div className="wl-driver-stat">
              <span className="wl-driver-stat-label">Rating</span>
              <span className="wl-driver-stat-value">⭐ {profile.rating?.toFixed(1) || '5.0'}</span>
            </div>
            <div className="wl-driver-stat-divider" />
            <div className="wl-driver-stat">
              <span className="wl-driver-stat-label">Status</span>
              <span className="wl-driver-stat-value" style={{ 
                color: profile.is_available ? '#4ade80' : 'var(--muted)' 
              }}>
                {profile.is_available ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="wl-actions-grid">
          <Link to="/driver-dashboard" className="wl-action-card">
            <div className="wl-action-icon" style={{ background: 'rgba(74,222,128,0.1)' }}>
              <ShoppingBag className="w-5 h-5" style={{ color: '#4ade80' }} />
            </div>
            <div className="wl-action-info">
              <span className="wl-action-title">Active Deliveries</span>
              <span className="wl-action-sub">View current orders</span>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--muted)' }} />
          </Link>

          <Link to="/driver-dashboard?tab=history" className="wl-action-card">
            <div className="wl-action-icon" style={{ background: 'rgba(96,165,250,0.1)' }}>
              <Clock className="w-5 h-5" style={{ color: '#60a5fa' }} />
            </div>
            <div className="wl-action-info">
              <span className="wl-action-title">Delivery History</span>
              <span className="wl-action-sub">Past deliveries</span>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--muted)' }} />
          </Link>
        </div>

        {/* ── Transaction History ── */}
        <div className="wl-section-header">
          <h2 className="wl-section-title">Transaction History</h2>
          <span className="wl-section-count">{transactions.length} transactions</span>
        </div>

        {transactions.length === 0 ? (
          <div className="wl-empty-state">
            <Clock className="w-10 h-10" style={{ color: 'var(--muted)' }} />
            <p>No transactions yet</p>
            <span>Start delivering to see your earnings here</span>
          </div>
        ) : (
          <div className="wl-transactions">
            {transactions.map((tx) => {
              const colors = getTransactionColor(tx.type);
              const isPositive = tx.amount > 0;
              
              return (
                <div key={tx.id} className="wl-tx-row">
                  <div className="wl-tx-icon" style={{ background: colors.bg, color: colors.color }}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="wl-tx-info">
                    <p className="wl-tx-label">{tx.description}</p>
                    <p className="wl-tx-date">
                      {new Date(tx.created_at).toLocaleDateString('en-ZA', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {tx.order_id && <span className="wl-tx-ref"> · #{tx.reference || tx.order_id.slice(-8)}</span>}
                    </p>
                  </div>
                  <div className="wl-tx-amount-wrap">
                    <span className={`wl-tx-amount ${isPositive ? 'wl-tx-positive' : 'wl-tx-negative'}`}>
                      {isPositive ? '+' : ''}R{Math.abs(tx.amount).toFixed(2)}
                    </span>
                    <span className="wl-tx-balance">Bal: R{tx.balance_after?.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Info Footer ── */}
        <div className="wl-info-footer">
          <Info className="w-4 h-4" style={{ color: 'var(--muted)' }} />
          <p>
            Earnings are credited after successful delivery. 
            Minimum withdrawal is <strong>R50</strong>. 
            Funds are transferred within 24-48 hours.
          </p>
        </div>
      </div>

      {/* ── Withdrawal Modal ── */}
      {showWithdraw && (
        <div className="wl-modal-overlay" onClick={() => !withdrawing && setShowWithdraw(false)}>
          <div className="wl-modal" onClick={(e) => e.stopPropagation()}>
            {withdrawSuccess ? (
              <div className="wl-modal-success">
                <div className="wl-success-icon">
                  <CheckCircle2 className="w-10 h-10" style={{ color: '#4ade80' }} />
                </div>
                <h3>Withdrawal Submitted!</h3>
                <p>Funds will be transferred to your bank account within 24-48 hours.</p>
              </div>
            ) : (
              <>
                <div className="wl-modal-header">
                  <h3>Withdraw Funds</h3>
                  <button onClick={() => setShowWithdraw(false)} className="wl-modal-close">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="wl-modal-body">
                  <div className="wl-withdraw-info">
                    <div className="wl-withdraw-row">
                      <span>Available Balance</span>
                      <span className="wl-withdraw-balance">R{balance?.balance?.toFixed(2)}</span>
                    </div>
                    <div className="wl-withdraw-row">
                      <span>Bank Account</span>
                      <span>{profile?.bank_name} - ****{profile?.account_number?.slice(-4)}</span>
                    </div>
                  </div>

                  {withdrawError && (
                    <div className="wl-error-banner">
                      <AlertCircle className="w-4 h-4" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  <form onSubmit={handleWithdraw} className="wl-withdraw-form">
                    <div className="wl-field">
                      <label className="wl-label">Withdrawal Amount</label>
                      <div className="wl-amount-input-wrap">
                        <span className="wl-amount-currency">R</span>
                        <input
                          type="number"
                          step="0.01"
                          min="50"
                          max={balance?.balance}
                          value={withdrawAmount}
                          onChange={(e) => {
                            setWithdrawAmount(e.target.value);
                            setWithdrawError(null);
                          }}
                          placeholder="0.00"
                          className="wl-amount-input"
                          disabled={withdrawing}
                        />
                      </div>
                      <p className="wl-field-hint">Minimum withdrawal: R50</p>
                    </div>

                    <div className="wl-quick-amounts">
                      {[50, 100, 200, balance?.balance].filter(amt => amt && amt >= 50 && amt <= balance?.balance).map((amt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setWithdrawAmount(amt.toFixed(2))}
                          className="wl-quick-amt-btn"
                          disabled={withdrawing}
                        >
                          {i === 3 ? 'All' : `R${amt}`}
                        </button>
                      ))}
                    </div>

                    <button type="submit" disabled={withdrawing} className="wl-submit-btn">
                      {withdrawing ? (
                        <><Loader className="w-5 h-5 wl-spin" /> Processing...</>
                      ) : (
                        <><Download className="w-5 h-5" /> Withdraw Funds</>
                      )}
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

  .wl-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 35% at 50% 0%, rgba(218,41,28,0.12) 0%, transparent 65%),
      var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    overflow-x: hidden;
    padding-bottom: 60px;
  }

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
    font-size: 11px; font-weight: 800; color: var(--gold); text-transform: capitalize;
  }

  .wl-body {
    max-width: 680px; margin: 0 auto;
    padding: 24px 16px;
    display: flex; flex-direction: column; gap: 20px;
  }

  .wl-loading, .wl-error, .wl-auth-gate {
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; text-align: center; padding: 80px 24px;
  }
  .wl-loading p { font-size: 14px; color: var(--muted); }
  
  .wl-error h3 { font-size: 20px; font-weight: 800; color: var(--text); }
  .wl-error p { font-size: 14px; color: var(--muted); max-width: 400px; }
  .wl-retry-btn {
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px;
    padding: 12px 28px; border-radius: 50px;
    transition: all 0.2s; margin-top: 8px;
  }
  .wl-retry-btn:hover { background: var(--red2); }

  .wl-auth-icon {
    width: 80px; height: 80px; border-radius: 22px;
    background: rgba(255,199,44,0.1); border: 1px solid rgba(255,199,44,0.2);
    display: flex; align-items: center; justify-content: center;
  }
  .wl-auth-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 2px; }
  .wl-auth-sub { font-size: 14px; color: var(--muted); line-height: 1.65; max-width: 340px; }
  .wl-auth-btn {
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 15px;
    padding: 14px 32px; border-radius: 50px; text-decoration: none;
    box-shadow: 0 6px 20px rgba(218,41,28,0.4); transition: all 0.2s; margin-top: 4px;
  }
  .wl-auth-btn:hover { background: var(--red2); transform: scale(1.03); }
  .wl-auth-link { font-size: 13px; color: var(--gold); font-weight: 700; text-decoration: none; }

  .wl-balance-card {
    background: linear-gradient(135deg, var(--card) 0%, rgba(26,14,0,0.95) 100%);
    border: 1px solid var(--border);
    border-radius: 24px; padding: 28px 24px;
    box-shadow: 0 0 0 1px rgba(255,199,44,0.06) inset;
    animation: wlFadeUp 0.5s ease both;
  }
  .wl-balance-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .wl-balance-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
  }
  .wl-withdraw-btn {
    display: flex; align-items: center; gap: 6px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 12px;
    padding: 8px 16px; border-radius: 50px;
    transition: all 0.2s;
  }
  .wl-withdraw-btn:hover { background: var(--red2); }

  .wl-balance-amount {
    display: flex; align-items: baseline; gap: 4px;
    margin-bottom: 24px;
  }
  .wl-currency {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px; color: var(--muted);
  }
  .wl-amount {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 64px; letter-spacing: -1px; color: var(--text); line-height: 1;
  }

  .wl-status-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 12px;
    background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.25);
    color: #60a5fa; font-size: 12px; font-weight: 700;
    margin-bottom: 20px;
  }

  .wl-balance-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; padding-top: 20px;
    border-top: 1px solid rgba(255,199,44,0.08);
  }
  .wl-balance-stat {
    display: flex; align-items: center; gap: 10px;
  }
  .wl-stat-icon {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .wl-stat-info {
    display: flex; flex-direction: column; gap: 2px; min-width: 0;
  }
  .wl-stat-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
  }
  .wl-stat-value {
    font-size: 16px; font-weight: 900; color: var(--text);
    font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.5px;
  }

  .wl-driver-stats {
    display: flex; align-items: center; gap: 16px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; padding: 16px 20px;
    animation: wlFadeUp 0.5s ease 0.1s both;
  }
  .wl-driver-stat {
    flex: 1; text-align: center;
    display: flex; flex-direction: column; gap: 4px;
  }
  .wl-driver-stat-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
  }
  .wl-driver-stat-value {
    font-size: 18px; font-weight: 900; color: var(--text);
    font-family: 'Bebas Neue', sans-serif;
  }
  .wl-driver-stat-divider {
    width: 1px; height: 32px; background: rgba(255,199,44,0.1);
  }

  .wl-actions-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    animation: wlFadeUp 0.5s ease 0.15s both;
  }
  .wl-action-card {
    display: flex; align-items: center; gap: 12px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; padding: 16px;
    text-decoration: none; transition: all 0.25s;
  }
  .wl-action-card:hover {
    border-color: rgba(255,199,44,0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .wl-action-icon {
    width: 42px; height: 42px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .wl-action-info {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 2px;
  }
  .wl-action-title {
    font-size: 13px; font-weight: 800; color: var(--text);
  }
  .wl-action-sub {
    font-size: 11px; color: var(--muted);
  }

  .wl-section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 12px;
  }
  .wl-section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 1.5px; color: var(--text);
  }
  .wl-section-count {
    font-size: 11px; font-weight: 800; color: var(--muted);
  }

  .wl-empty-state {
    display: flex; flex-direction: column; align-items: center;
    gap: 10px; text-align: center; padding: 60px 24px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 18px;
  }
  .wl-empty-state p {
    font-size: 15px; font-weight: 800; color: var(--text);
  }
  .wl-empty-state span {
    font-size: 13px; color: var(--muted);
  }

  .wl-transactions {
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
  .wl-tx-info { flex: 1; min-width: 0; }
  .wl-tx-label {
    font-size: 13px; font-weight: 700; color: var(--text);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .wl-tx-date {
    font-size: 11px; color: var(--muted); margin-top: 2px;
  }
  .wl-tx-ref {
    opacity: 0.7;
  }
  .wl-tx-amount-wrap {
    display: flex; flex-direction: column; align-items: flex-end;
    gap: 2px; flex-shrink: 0;
  }
  .wl-tx-amount {
    font-size: 15px; font-weight: 900;
    font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.5px;
  }
  .wl-tx-positive { color: #4ade80; }
  .wl-tx-negative { color: #f87171; }
  .wl-tx-balance {
    font-size: 10px; color: var(--muted); font-weight: 700;
  }

  .wl-info-footer {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 14px 16px; border-radius: 12px;
    background: rgba(255,248,231,0.02); border: 1px solid var(--border);
  }
  .wl-info-footer p {
    font-size: 11px; color: var(--muted); line-height: 1.55;
  }
  .wl-info-footer strong {
    color: var(--text);
  }

  /* Modal */
  .wl-modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(14,7,0,0.9);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: wlFadeIn 0.25s ease;
  }
  .wl-modal {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 24px; width: 100%; max-width: 440px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    animation: wlScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .wl-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 24px 0;
  }
  .wl-modal-header h3 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px; letter-spacing: 1.5px; color: var(--text);
  }
  .wl-modal-close {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(255,248,231,0.05); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); cursor: pointer; transition: all 0.2s;
  }
  .wl-modal-close:hover {
    color: var(--text); border-color: rgba(255,199,44,0.3);
  }
  .wl-modal-body {
    padding: 24px;
  }

  .wl-modal-success {
    padding: 40px 24px;
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; text-align: center;
  }
  .wl-success-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.25);
    display: flex; align-items: center; justify-content: center;
  }
  .wl-modal-success h3 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px; letter-spacing: 2px; color: var(--text);
  }
  .wl-modal-success p {
    font-size: 13px; color: var(--muted); line-height: 1.6;
  }

  .wl-withdraw-info {
    background: rgba(255,248,231,0.03); border: 1px solid var(--border);
    border-radius: 14px; padding: 16px;
    display: flex; flex-direction: column; gap: 10px;
    margin-bottom: 20px;
  }
  .wl-withdraw-row {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; color: var(--muted);
  }
  .wl-withdraw-balance {
    font-size: 16px; font-weight: 900; color: var(--text);
    font-family: 'Bebas Neue', sans-serif;
  }

  .wl-error-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 12px;
    background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3);
    color: #f87171; font-size: 12px; font-weight: 700;
    margin-bottom: 16px;
  }

  .wl-withdraw-form {
    display: flex; flex-direction: column; gap: 16px;
  }
  .wl-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .wl-label {
    font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
  }
  .wl-amount-input-wrap {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,248,231,0.04);
    border: 1.5px solid var(--border); border-radius: 12px;
    padding: 0 16px; transition: border-color 0.2s;
  }
  .wl-amount-input-wrap:focus-within {
    border-color: rgba(255,199,44,0.4);
  }
  .wl-amount-currency {
    font-size: 18px; font-weight: 900; color: var(--muted);
    font-family: 'Bebas Neue', sans-serif;
  }
  .wl-amount-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: 24px; font-weight: 900;
    font-family: 'Bebas Neue', sans-serif;
    padding: 12px 0; letter-spacing: 0.5px;
  }
  .wl-amount-input::placeholder {
    color: rgba(255,248,231,0.15);
  }
  .wl-field-hint {
    font-size: 11px; color: var(--muted);
  }

  .wl-quick-amounts {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .wl-quick-amt-btn {
    background: rgba(255,248,231,0.04); border: 1px solid var(--border);
    border-radius: 10px; padding: 10px; cursor: pointer;
    font-size: 12px; font-weight: 800; color: var(--text);
    transition: all 0.2s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .wl-quick-amt-btn:hover:not(:disabled) {
    background: rgba(255,199,44,0.1);
    border-color: rgba(255,199,44,0.3);
  }
  .wl-quick-amt-btn:disabled {
    opacity: 0.4; cursor: not-allowed;
  }

  .wl-submit-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 15px;
    padding: 15px; border-radius: 14px;
    box-shadow: 0 6px 20px rgba(218,41,28,0.4); transition: all 0.2s;
  }
  .wl-submit-btn:hover:not(:disabled) {
    background: var(--red2); transform: scale(1.02);
  }
  .wl-submit-btn:disabled {
    opacity: 0.55; cursor: not-allowed;
  }

  @keyframes wlSpin { to { transform: rotate(360deg); } }
  .wl-spin { animation: wlSpin 0.8s linear infinite; }

  @keyframes wlFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: none; }
  }

  @keyframes wlFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes wlScaleUp {
    from { opacity: 0; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 640px) {
    .wl-body { padding: 16px 12px; }
    .wl-balance-card { padding: 20px 16px; }
    .wl-amount { font-size: 48px; }
    .wl-balance-stats { grid-template-columns: 1fr; }
    .wl-actions-grid { grid-template-columns: 1fr; }
    .wl-driver-stats { flex-direction: column; gap: 12px; }
    .wl-driver-stat-divider { width: 100%; height: 1px; }
  }
`;
