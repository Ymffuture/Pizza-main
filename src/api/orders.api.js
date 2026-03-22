import axiosClient from "./axiosClient";

// ── Customer endpoints ────────────────────────────────────────────────────

// POST /orders — create a new order
export const createOrder = (payload) =>
  axiosClient.post("/orders", payload);

// GET /orders/:id — get a single order (customer)
export const getOrderById = (id) =>
  axiosClient.get(`/orders/${id}`);

// ── Admin endpoints ───────────────────────────────────────────────────────

// GET /orders/all — all orders in the system
export const getOrders = () =>
  axiosClient.get("/orders/all");

// PATCH /orders/:id/status — update order status
export const updateOrderStatus = (id, status) =>
  axiosClient.patch(`/orders/${id}/status`, { status });
