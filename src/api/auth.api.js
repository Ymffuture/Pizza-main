import axiosClient from "./axiosClient";

export const register = (data) => axiosClient.post("/auth/register", data);

export const login = ({ email, password }) => {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);
  return axiosClient.post("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const googleAuth        = (access_token) => axiosClient.post("/auth/google", { access_token });
export const forgotPassword    = (email)        => axiosClient.post("/auth/forgot-password", { email });
export const resetPassword     = (token, new_password) => axiosClient.post("/auth/reset-password", { token, new_password });
export const sendVerification  = ()             => axiosClient.post("/auth/send-verification");
export const verifyEmail       = (token)        => axiosClient.post("/auth/verify-email", { token });
