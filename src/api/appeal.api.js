// src/api/appeal.api.js
import axiosClient from "./axiosClient";

export const submitAppeal  = (data) => axiosClient.post("/appeals/", data);
export const getMyAppeal   = ()     => axiosClient.get("/appeals/my");
