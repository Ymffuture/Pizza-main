import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://foodserver-w4ta.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
