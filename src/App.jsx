// src/App.jsx  (updated — add AiChat)
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home        from "./pages/Home";
import Menu        from "./pages/Menu";
import Cart        from "./pages/Cart";
import Checkout    from "./pages/Checkout";
import OrderStatus from "./pages/OrderStatus";
import Success     from "./pages/Success";
import ErrorPage   from "./pages/ErrorPage";
import Login       from "./pages/Login";
import Register    from "./pages/Register";

import { OrderProvider } from "./context/OrderContext";
import { CartProvider }  from "./context/CartContext";
import { AuthProvider }  from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import RequireAuth       from "./components/RequireAuth";
import ErrorBoundary     from "./components/ErrorBoundary";
import AiChat            from "./components/AiChat";   // ← NEW
import Info              from "./components/Info";


export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OrderProvider>
          <CartProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/"         element={<Home />} />
                  <Route path="/menu"     element={<Menu />} />
                  <Route path="/cart"     element={<Cart />} />
                  <Route path="/login"    element={<Login />} />
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

                  <Route path="/success"  element={<Success />} />
                  <Route path="*"         element={<ErrorPage />} />
                </Routes>

                {/* ✅ KotaBot floating chat — renders on every page */}
                <AiChat />
              </BrowserRouter>
            </ToastProvider>
          </CartProvider>
        </OrderProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
