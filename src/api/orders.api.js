import axiosClient from "./axiosClient";

export const createOrder = (payload) =>
  axiosClient.post("/orders", payload);

export const getOrderById = (id) =>
  axiosClient.get(`/orders/${id}`);
