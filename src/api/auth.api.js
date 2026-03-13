import axiosClient from "./axiosClient";

// POST /auth/register  — { email, password, full_name, phone }
export const register = (data) => axiosClient.post("/auth/register", data);

// POST /auth/login  — OAuth2 form (username = email)
export const login = ({ email, password }) => {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);
  return axiosClient.post("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};
