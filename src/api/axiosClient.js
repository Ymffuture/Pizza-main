import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://kotabites.onrender.com",
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // Render free-tier cold start
});

// Attach Bearer token from session on every request
axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("kb_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
