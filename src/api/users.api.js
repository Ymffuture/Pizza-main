import axiosClient from "./axiosClient";

export const getMyStatus = () =>
  axiosClient.get("/users/me/status");

export const getMe = () =>
  axiosClient.get("/users/me");
