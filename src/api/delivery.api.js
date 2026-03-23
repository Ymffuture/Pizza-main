// src/api/delivery.api.js
import axiosClient from "./axiosClient";

// ── Driver Signup ──────────────────────────────────────────────────────────
export const driverSignup = (formData) =>
  axiosClient.post("/delivery/signup", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Driver Profile ─────────────────────────────────────────────────────────
export const getDriverProfile = () =>
  axiosClient.get("/delivery/profile");

export const updateDriverProfile = (data) =>
  axiosClient.patch("/delivery/profile", data);

// ── Wallet ─────────────────────────────────────────────────────────────────
export const getWalletBalance = () =>
  axiosClient.get("/delivery/wallet/balance");

export const getWalletTransactions = (limit = 50) =>
  axiosClient.get("/delivery/wallet/transactions", { params: { limit } });

export const withdrawFunds = (data) =>
  axiosClient.post("/delivery/wallet/withdraw", data);

// ── Availability & Orders ──────────────────────────────────────────────────
export const toggleAvailability = (isAvailable) =>
  axiosClient.post("/delivery/toggle-availability", { is_available: isAvailable });

export const getAvailableOrders = () =>
  axiosClient.get("/delivery/available-orders");

export const acceptOrder = (orderId) =>
  axiosClient.post("/delivery/accept-order", { order_id: orderId });

export const updateDeliveryStatus = (assignmentId, status, notes = null) =>
  axiosClient.patch("/delivery/update-delivery-status", {
    assignment_id: assignmentId,
    status,
    ...(notes && { notes }),
  });

export const getActiveDelivery = () =>
  axiosClient.get("/delivery/active-delivery");

// FIX: was /delivery/assignment-by-order/${orderId} — backend route is /delivery/assignment/order/{order_id}
export const getAssignmentByOrder = (orderId) =>
  axiosClient.get(`/delivery/assignment/order/${orderId}`);

// ── Admin ──────────────────────────────────────────────────────────────────
export const getPendingDrivers = () =>
  axiosClient.get("/delivery/admin/pending");

export const approveDriver = (driverId, approved, reason = null) => {
  const body = { driver_id: driverId, approved };
  if (reason && reason.trim()) body.reason = reason.trim();
  return axiosClient.post("/delivery/admin/approve", body);
};

export const getAllDrivers = (status = null) =>
  axiosClient.get("/delivery/admin/all-drivers", {
    params: status ? { status } : {},
  });

export const adjustWallet = (driverId, amount, type, description) =>
  axiosClient.post("/delivery/admin/wallet/adjust", {
    driver_id: driverId,
    amount,
    type,
    description,
  });
