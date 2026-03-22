import { api } from "./auth.api";
import { parseApiError } from "../utils/apiError";

// GET /orders/all — admin: all orders in the system
export const getOrders = () => api.get("/orders/all");

// PATCH /orders/:id/status — admin: update order status
// body: { status: "pending" | "paid" | "preparing" | "ready" | "delivered" | "cancelled" }
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status });

// GET /orders/:id — single order detail
export const getOrderById = (id) => api.get(`/orders/${id}`);

export { parseApiError };
