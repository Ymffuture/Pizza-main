import axiosClient from "./axiosClient";

// ── Customer endpoints ────────────────────────────────────────────────────

// POST /orders — create a new order
export const createOrder = (payload) =>
  axiosClient.post("/orders", payload);

// GET /orders/me — customer's own orders
export const getMyOrders = () =>
  axiosClient.get("/orders/me");

// GET /orders/:id — get a single order (customer)
export const getOrderById = (id) =>
  axiosClient.get(`/orders/${id}`);

// POST /ai/cancel-order — cancel one of your own orders. ProBite can cancel
// a SCHEDULED order immediately; free plan must wait until it activates to
// PENDING (enforced server-side in routes/ai.py:_execute_cancel).
export const cancelOrder = (orderId, reason) =>
  axiosClient.post("/ai/cancel-order", { order_id: orderId, reason });

// ── Admin endpoints ───────────────────────────────────────────────────────

// GET /orders/all — all orders in the system (admin only)
export const getOrders = () =>
  axiosClient.get("/orders/all");

// PATCH /orders/:id/status — update order status (admin only)
export const updateOrderStatus = (id, status) =>
  axiosClient.patch(`/orders/${id}/status`, { status });
