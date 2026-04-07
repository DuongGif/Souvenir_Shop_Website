import apiClient from "./apiClient";

export const authService = {
  // ✅ giữ nguyên cách login cũ
  login: (email, password) =>
    apiClient.post("/api/auth/login", { email, password }),

  // ✅ giữ register cũ nếu bạn đang dùng
  register: (payload) =>
    apiClient.post("/api/auth/register", payload),

  // ✅ thêm OTP (mới)
  sendRegisterOtp: (data) =>
    apiClient.post("/api/auth/register/send-otp", data),

  verifyRegisterOtp: (data) =>
    apiClient.post("/api/auth/register/verify-otp", data),

  sendForgotPasswordOtp: (data) =>
    apiClient.post("/api/auth/forgot-password/send-otp", data),

  resetPasswordWithOtp: (data) =>
    apiClient.post("/api/auth/forgot-password/reset", data),
};