import apiClient from "./apiClient";

export const couponService = {
  validate: (data) => apiClient.post("/api/coupons/validate", data), // { code, subtotal }
};