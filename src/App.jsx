// src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import { OrderProvider } from "./context/OrderContext";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import { ToastProvider } from "./components/Toast";
import RequireAuth from "./components/RequireAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";

import AiChat from "./components/AiChat";


// Lazy loaded pages
const Home = lazy(() => import("./pages/Home"));
const Menu = lazy(() => import("./pages/Menu"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const Success = lazy(() => import("./pages/Success"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Info = lazy(() => import("./components/Info"));


export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OrderProvider>
          <CartProvider>
            <ToastProvider>
              <BrowserRouter>

                {/* Suspense Loader */}
                <Suspense fallback={<PageLoader />}>

                  <Routes>
                    <Route path="/" element={<Home />} />

                    <Route path="/menu" element={<Menu />} />

                    <Route path="/cart" element={<Cart />} />

                    <Route path="/login" element={<Login />} />

                    <Route path="/register" element={<Register />} />

                    <Route path="/info" element={<Info />} />

                    <Route
                      path="/checkout"
                      element={
                        <RequireAuth>
                          <Checkout />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/order/:id"
                      element={
                        <RequireAuth>
                          <OrderStatus />
                        </RequireAuth>
                      }
                    />

                    <Route path="/success" element={<Success />} />

                    <Route path="*" element={<ErrorPage />} />

                  </Routes>

                </Suspense>

                {/* KotaBot AI Chat (always mounted) */}
                <AiChat />

              </BrowserRouter>
            </ToastProvider>
          </CartProvider>
        </OrderProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
