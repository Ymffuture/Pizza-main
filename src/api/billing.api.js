// src/api/billing.api.js
import axiosClient from "./axiosClient";

export const getPlans = () => axiosClient.get("/billing/plans");

export const getMyBilling = () => axiosClient.get("/billing/me");

export const subscribe = (billingCycle) =>
  axiosClient.post("/billing/subscribe", { billing_cycle: billingCycle });

export const verifySubscription = (reference) =>
  axiosClient.get(`/billing/verify/${reference}`);

export const cancelSubscription = () => axiosClient.post("/billing/cancel");
