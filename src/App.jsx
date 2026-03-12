import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import OrderStatus from "./pages/OrderStatus";
import Success from "./pages/Success";
import ErrorPage from "./pages/ErrorPage";
import { OrderProvider } from "./context/OrderContext";
import ErrorBoundary from "./components/ErrorBoundary";

// BUG FIX: /cart route was missing — Menu.jsx has a FAB that navigates to /cart
// Added a placeholder Cart page; replace Cart import with your real Cart component
import Cart from "./pages/Cart";

export default function App() {
  return (
    <ErrorBoundary>
      <OrderProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order/:id" element={<OrderStatus />} />
            <Route path="/success" element={<Success />} />
            {/* BUG FIX: ErrorPage was imported but never added as a route */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </ErrorBoundary>
  );
}
