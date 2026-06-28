// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import { OrderProvider }  from "./context/OrderContext";
import { CartProvider }   from "./context/CartContext";
import { AuthProvider }   from "./context/AuthContext";
import { ToastProvider, KotaToaster } from "./components/Toast";
import RequireAuth        from "./components/RequireAuth";
import ErrorBoundary      from "./components/ErrorBoundary";
import PageLoader         from "./components/PageLoader";
import AiChat             from "./components/AiChat";
import PrivacyPage        from "./components/Privacy";
import TermsPage          from "./components/Terms";
import SupportPage        from "./components/Support";
import { UserStatusProvider } from "./context/UserStatusContext";
import { BillingProvider }    from "./context/BillingContext";
import AccountStatusBanner    from "./components/AccountStatusBanner";
import FeatureGate        from "./components/FeatureGate";

const Home             = lazy(() => import("./pages/Home"));
const Menu             = lazy(() => import("./pages/Menu"));
const Cart             = lazy(() => import("./pages/Cart"));
const Checkout         = lazy(() => import("./pages/Checkout"));
const OrderStatus      = lazy(() => import("./pages/OrderStatus"));
const Success          = lazy(() => import("./pages/Success"));
const ErrorPage        = lazy(() => import("./pages/ErrorPage"));
const Login            = lazy(() => import("./pages/Login"));
const Register         = lazy(() => import("./pages/Register"));
const Info             = lazy(() => import("./components/Info"));
const ForgotPassword   = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword    = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail      = lazy(() => import("./pages/VerifyEmail"));
const DeliveryCoverage = lazy(() => import("./pages/DeliveryCoverage"));
const DeliverSignup    = lazy(() => import("./pages/DeliverSignup"));
const Wallet           = lazy(() => import("./pages/Wallet"));
const DeliverDashboard = lazy(() => import("./pages/DeliverDashboard"));
const ClientWallet     = lazy(() => import("./pages/ClientWallet"));
const Appeal = lazy(() => import("./pages/Appeal"));
const Pricing = lazy(() => import("./pages/Pricing"));

// inside <Routes>

import GitHubCallback  from "./pages/GitHubCallback";
import SpotifyCallback from "./pages/SpotifyCallback";
import FingerprintGate from "./components/FingerprintGate";
import PKM             from "./components/PasskeyManager";

// ── Shared fallback style — dark card matching KotaBites theme ─────────────
const Blocked = ({ icon, title, message }) => (
  <div style={{
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#0e0700",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  }}>
    <div style={{
      maxWidth: 400,
      width: "100%",
      background: "rgba(218,41,28,0.07)",
      border: "1px solid rgba(218,41,28,0.2)",
      borderRadius: 20,
      padding: "36px 28px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <p style={{
        margin: 0,
        fontSize: 16,
        fontWeight: 800,
        color: "#fff8e7",
        letterSpacing: "0.02em",
      }}>{title}</p>
      <p style={{
        margin: 0,
        fontSize: 13,
        color: "rgba(255,248,231,0.45)",
        lineHeight: 1.65,
      }}>{message}</p>
      <a
        href="/info"
        style={{
          marginTop: 8,
          display: "inline-block",
          padding: "10px 24px",
          borderRadius: 50,
          background: "rgba(255,199,44,0.1)",
          border: "1px solid rgba(255,199,44,0.25)",
          color: "#FFC72C",
          fontSize: 12,
          fontWeight: 800,
          textDecoration: "none",
          letterSpacing: "0.06em",
        }}
      >
        View Policies
      </a>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserStatusProvider>
        <BillingProvider>
          <OrderProvider>
            <CartProvider>
              <ToastProvider>
                <KotaToaster />

                <BrowserRouter>
                  {/* ✅ Inside BrowserRouter — Link components work correctly */}
                  
<div className="app-layout">

    <main className="main-area">

    <AccountStatusBanner layout="smart" />

   </main>
  </div>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>

                      {/* ── Public routes — no gating needed ───────────────── */}
                      <Route path="/"                      element={<Home />} />
                      <Route path="/menu"                  element={<Menu />} />
                      <Route path="/login"                 element={<Login />} />
                      <Route path="/register"              element={<Register />} />
                      <Route path="/coverage"              element={<DeliveryCoverage />} />
                      <Route path="/deliver"               element={<DeliverSignup />} />
                      <Route path="/info"                  element={<Info />} />
                      <Route path="/forgot-password"       element={<ForgotPassword />} />
                      <Route path="/reset-password"        element={<ResetPassword />} />
                      <Route path="/verify-email"          element={<VerifyEmail />} />
                      <Route path="/auth/github/callback"  element={<GitHubCallback />} />
                      <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
                      <Route path="/pkm"                   element={<PKM />} />
                      <Route path="/privacy"               element={<PrivacyPage />} />
                      <Route path="/terms"                 element={<TermsPage />} />
                      <Route path="/support"               element={<SupportPage />} />
                      <Route path="/success"               element={<Success />} />
                      <Route path="/pricing"               element={<Pricing />} />
                      
<Route path="/appeal" element={<RequireAuth><Appeal /></RequireAuth>} />

                      {/* ── Cart — gated: canAddToCart ──────────────────────── */}
                      <Route path="/cart" element={
                        <FeatureGate
                          feature="canAddToCart"
                          fallback={
                            <Blocked
                              icon="🛒"
                              title="Cart Unavailable"
                              message="Your account cannot add items to cart at this time. Contact support to resolve your account status."
                            />
                          }
                        >
                          <Cart />
                        </FeatureGate>
                      } />

                      {/* ── Checkout — gated: canCheckout ───────────────────── */}
                      <Route path="/checkout" element={
                        <RequireAuth>
                          <FeatureGate
                            feature="canCheckout"
                            fallback={
                              <Blocked
                                icon="🔒"
                                title="Checkout Unavailable"
                                message="Your account cannot place orders at this time. Contact support or submit an appeal to restore access."
                              />
                            }
                          >
                            <Checkout />
                          </FeatureGate>
                        </RequireAuth>
                      } />

                      {/* ── Order status — gated: canViewOrders ─────────────── */}
                      <Route path="/order/:id" element={
                        <RequireAuth>
                          <FeatureGate
                            feature="canViewOrders"
                            fallback={
                              <Blocked
                                icon="📋"
                                title="Order History Unavailable"
                                message="Your account cannot access order history. Contact support for assistance."
                              />
                            }
                          >
                            <OrderStatus />
                          </FeatureGate>
                        </RequireAuth>
                      } />

                      {/* ── Wallet (driver) — gated: canUseWallet ───────────── */}
                      <Route path="/wallet" element={
                        <RequireAuth>
                          <FeatureGate
                            feature="canUseWallet"
                            fallback={
                              <Blocked
                                icon="💳"
                                title="Wallet Unavailable"
                                message="Your account cannot access the wallet at this time. Contact support to restore access."
                              />
                            }
                          >
                            <FingerprintGate pageKey="wallet">
                              <Wallet />
                            </FingerprintGate>
                          </FeatureGate>
                        </RequireAuth>
                      } />

                      {/* ── Rewards — gated: canUseRewards ──────────────────── */}
                      <Route path="/rewards" element={
                        <RequireAuth>
                          <FeatureGate
                            feature="canUseRewards"
                            fallback={
                              <Blocked
                                icon="⭐"
                                title="Rewards Unavailable"
                                message="Your account cannot access KotaPoints or rewards at this time. Contact support for assistance."
                              />
                            }
                          >
                            <ClientWallet />
                          </FeatureGate>
                        </RequireAuth>
                      } />

                      {/* ── Driver dashboard — no feature gate (drivers have own status system) */}
                      <Route path="/driver-dashboard" element={
                        <RequireAuth><DeliverDashboard /></RequireAuth>
                      } />

                      <Route path="*" element={<ErrorPage />} />

                    </Routes>
                  </Suspense>

                  {/* ── AiChat — gated: canChat (null fallback = widget hidden) ─ */}
                  <FeatureGate feature="canChat" fallback={null}>
                    <AiChat />
                  </FeatureGate>

                </BrowserRouter>
              </ToastProvider>
            </CartProvider>
          </OrderProvider>
        </BillingProvider>
        </UserStatusProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
