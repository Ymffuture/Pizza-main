// src/api/delivery.api.js
import axiosClient from "./axiosClient";

// ────────────────────────────────────────────────────────────
// DRIVER SIGNUP
// ────────────────────────────────────────────────────────────
export const driverSignup = (formData) =>
  axiosClient.post("/delivery/signup", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ────────────────────────────────────────────────────────────
// DRIVER PROFILE
// ────────────────────────────────────────────────────────────
export const getDriverProfile = () =>
  axiosClient.get("/delivery/profile");

export const updateDriverProfile = (data) =>
  axiosClient.patch("/delivery/profile", data);

// ────────────────────────────────────────────────────────────
// WALLET
// ────────────────────────────────────────────────────────────
export const getWalletBalance = () =>
  axiosClient.get("/delivery/wallet/balance");

export const getWalletTransactions = (limit = 50) =>
  axiosClient.get("/delivery/wallet/transactions", {
    params: { limit },
  });

export const withdrawFunds = (data) =>
  axiosClient.post("/delivery/wallet/withdraw", data);

// ────────────────────────────────────────────────────────────
// AVAILABILITY & ORDERS
// ────────────────────────────────────────────────────────────
export const toggleAvailability = () =>
  axiosClient.post("/delivery/toggle-availability");

export const getAvailableOrders = () =>
  axiosClient.get("/delivery/available-orders");

export const acceptOrder = (orderId) =>
  axiosClient.post("/delivery/accept-order", { order_id: orderId });

export const updateDeliveryStatus = (deliveryId, status) =>
  axiosClient.patch("/delivery/update-delivery-status", {
    delivery_id: deliveryId,
    status,
  });

export const getActiveDelivery = () =>
  axiosClient.get("/delivery/active-delivery");

// ────────────────────────────────────────────────────────────
// ADMIN (for future use)
// ────────────────────────────────────────────────────────────
export const getPendingDrivers = () =>
  axiosClient.get("/delivery/admin/pending");

export const approveDriver = (driverId, approved, reason = null) =>
  axiosClient.post("/delivery/admin/approve", {
    driver_id: driverId,
    approved,
    reason,
  });

export const getAllDrivers = (status = null) =>
  axiosClient.get("/delivery/admin/all-drivers", {
    params: status ? { status } : {},
  });

export const adjustWallet = (driverId, amount, transactionType, description) =>
  axiosClient.post("/delivery/admin/wallet/adjust", {
    driver_id: driverId,
    amount,
    transaction_type: transactionType,
    description,
  });
