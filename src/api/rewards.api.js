// src/api/rewards.api.js
import axiosClient from "./axiosClient"; // ← reuse the same client as every other api file
                                          //   axiosClient already attaches the Bearer token
                                          //   from sessionStorage("kb_token") automatically

/** GET /rewards/wallet — full wallet state */
export const getWallet = () =>
  axiosClient.get("/rewards/wallet");

/** POST /rewards/claim — exchange points for a code */
export const claimReward = (points) =>
  axiosClient.post("/rewards/claim", { points });

/** POST /rewards/validate — check a code before applying at checkout */
export const validateRewardCode = (code) =>
  axiosClient.post("/rewards/validate", { code });

/** POST /rewards/use — mark a code as used after order is created */
export const useRewardCode = (code, order_id) =>
  axiosClient.post("/rewards/use", { code, order_id });
