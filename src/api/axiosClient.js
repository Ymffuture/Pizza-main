import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://kotabites.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Render free tier cold starts can take 30-60s — raised from 15s
  timeout: 60000,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
