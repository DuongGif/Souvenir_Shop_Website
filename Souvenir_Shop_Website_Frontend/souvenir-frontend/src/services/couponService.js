import { api } from "./apiClient";

export const couponService = {
  validate: (data) => api.post("/api/coupons/validate", data), // { code, subtotal }
};