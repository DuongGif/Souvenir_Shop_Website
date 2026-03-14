import axios from "axios";

// ✅ Nếu CRA: http://localhost:3000, backend thường https://localhost:7020
// ✅ Nếu Vite: http://localhost:5173
// Chỉnh đúng URL backend của bạn:
const BASE_URL = "https://localhost:7020";

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Optional: handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Token hết hạn / sai
      // localStorage.removeItem("token"); // tùy bạn
    }
    return Promise.reject(err);
  }
);