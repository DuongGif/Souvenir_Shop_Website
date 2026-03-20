import  apiClient from "../apiClient";

export const adminCouponsService = {
  getAll: () => apiClient.get("/api/admin/coupons"),
  getByCode: (code) => apiClient.get(`/api/admin/coupons/${code}`),
  create: (data) => apiClient.post("/api/admin/coupons", data),
  update: (code, data) => apiClient.put(`/api/admin/coupons/${code}`, data),
  remove: (code) => apiClient.delete(`/api/admin/coupons/${code}`),
};