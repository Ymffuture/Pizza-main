// src/api/rewards.api.js
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://kotabites.onrender.com";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

/** GET /rewards/wallet — full wallet state */
export const getWallet = () =>
  axios.get(`${API}/rewards/wallet`, authHeader());

/** POST /rewards/claim — exchange points for a code */
export const claimReward = (points) =>
  axios.post(`${API}/rewards/claim`, { points }, authHeader());

/** POST /rewards/validate — check a code before applying at checkout (no auth needed) */
export const validateRewardCode = (code) =>
  axios.post(`${API}/rewards/validate`, { code });

/** POST /rewards/use — mark a code as used after order is created */
export const useRewardCode = (code, order_id) =>
  axios.post(`${API}/rewards/use`, { code, order_id }, authHeader());
