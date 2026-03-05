import axiosClient from "./axiosClient";

export const getMenu = () => axiosClient.get("/menu");

export const getMenuItem = (id) => axiosClient.get(`/menu/${id}`);
