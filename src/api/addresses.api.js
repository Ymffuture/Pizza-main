import axiosClient from "./axiosClient";

export const getMyAddresses  = () => axiosClient.get("/addresses/me");
export const createAddress   = (data) => axiosClient.post("/addresses/", data);
export const updateAddress   = (id, data) => axiosClient.patch(`/addresses/${id}`, data);
export const deleteAddress   = (id) => axiosClient.delete(`/addresses/${id}`);
