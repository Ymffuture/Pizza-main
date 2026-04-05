// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import { OrderProvider }  from "./context/OrderContext";
import { CartProvider }   from "./context/CartContext";
import { AuthProvider }   from "./context/AuthContext";
import { ToastProvider, KotaToaster } from "./components/Toast";   // ← added KotaToaster
import RequireAuth        from "./components/RequireAuth";
import ErrorBoundary      from "./components/ErrorBoundary";
import PageLoader         from "./components/PageLoader";
import AiChat             from "./components/AiChat";

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

import GitHubCallback  from "./pages/GitHubCallback";
import SpotifyCallback from "./pages/SpotifyCallback";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OrderProvider>
          <CartProvider>
            <ToastProvider>
              {/* Sonner Toaster — renders outside the tree so it's always on top */}
              <KotaToaster />

              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"                 element={<Home />} />
                    <Route path="/menu"             element={<Menu />} />
                    <Route path="/cart"             element={<Cart />} />
                    <Route path="/login"            element={<Login />} />
                    <Route path="/register"         element={<Register />} />
                    <Route path="/coverage"         element={<DeliveryCoverage />} />
                    <Route path="/deliver"          element={<DeliverSignup />} />
                    <Route path="/info"             element={<Info />} />
                    <Route path="/forgot-password"  element={<ForgotPassword />} />
                    <Route path="/reset-password"   element={<ResetPassword />} />
                    <Route path="/verify-email"     element={<VerifyEmail />} />
                    <Route path="/auth/github/callback"  element={<GitHubCallback />} />
                    <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />

                    <Route path="/wallet" element={
                      <RequireAuth><Wallet /></RequireAuth>
                    } />
                    <Route path="/rewards" element={
                      <RequireAuth><ClientWallet /></RequireAuth>
                    } />
                    <Route path="/driver-dashboard" element={
                      <RequireAuth><DeliverDashboard /></RequireAuth>
                    } />
                    <Route path="/checkout" element={
                      <RequireAuth><Checkout /></RequireAuth>
                    } />
                    <Route path="/order/:id" element={
                      <RequireAuth><OrderStatus /></RequireAuth>
                    } />
                    <Route path="/success"  element={<Success />} />
                    <Route path="*"         element={<ErrorPage />} />
                  </Routes>
                </Suspense>

                <AiChat />
              </BrowserRouter>
            </ToastProvider>
          </CartProvider>
        </OrderProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
