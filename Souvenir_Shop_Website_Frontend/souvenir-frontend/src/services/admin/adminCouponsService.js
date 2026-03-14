import { api } from "../apiClient";

export const adminCouponsService = {
  getAll: () => api.get("/api/admin/coupons"),
  getByCode: (code) => api.get(`/api/admin/coupons/${code}`),
  create: (data) => api.post("/api/admin/coupons", data),
  update: (code, data) => api.put(`/api/admin/coupons/${code}`, data),
  remove: (code) => api.delete(`/api/admin/coupons/${code}`),
};