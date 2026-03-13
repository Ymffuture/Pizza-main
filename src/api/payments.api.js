import axiosClient from "./axiosClient";

// ✅ FIX: Backend route is POST /payments/initialize with order_id as a QUERY PARAM
// (FastAPI reads bare `order_id: str` args without a path template as query params)
// Old code sent: POST /payments/initialize/ORDER_ID  ← 404 / wrong endpoint
// Fixed sends:   POST /payments/initialize?order_id=ORDER_ID
export const initializePayment = (orderId) =>
  axiosClient.post(`/payments/initialize`, null, {
    params: { order_id: orderId },
  });

export const verifyPayment = (reference) =>
  axiosClient.get(`/payments/verify/${reference}`);
