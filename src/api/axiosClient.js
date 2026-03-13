import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://kotabites.onrender.com",
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // Render free-tier cold start can take up to 60s
  withCredentials: false, // Must be false when backend uses allow_origins=["*"]
});

// Attach Bearer token from sessionStorage on every request
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
    if (error.code === "ERR_NETWORK") {
      console.error("Network error — server may be sleeping (Render cold start)");
    } else {
      console.error("API Error:", error?.response?.status, error?.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
