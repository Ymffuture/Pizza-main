import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://kotabites.onrender.com",
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
  // ✅ FIX: Must be false — auth is via Authorization: Bearer header,
  // NOT cookies. withCredentials:true triggers CORS preflight failures
  // unless the server echoes back the exact origin every time.
  withCredentials: false,
});

// Attach Bearer token from sessionStorage on every request
axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("kb_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
      console.warn("⚠️  Network error — server may be cold-starting (Render ~60s)");
    } else {
      console.error("API Error", error?.response?.status, error?.response?.data ?? error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
