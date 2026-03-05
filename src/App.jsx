import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import OrderStatus from "./pages/OrderStatus";
import Success from "./pages/Success";
import { OrderProvider } from "./context/OrderContext";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <OrderProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderStatus />} />
            <Route path="/success" element={<Success />} />
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </ErrorBoundary>
  );
}
