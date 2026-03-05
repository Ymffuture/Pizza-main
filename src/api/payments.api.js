import axiosClient from "./axiosClient";

export const initializePayment = (orderId) =>
  axiosClient.post(`/payments/initialize/${orderId}`);

export const verifyPayment = (reference) =>
  axiosClient.get(`/payments/verify/${reference}`);
