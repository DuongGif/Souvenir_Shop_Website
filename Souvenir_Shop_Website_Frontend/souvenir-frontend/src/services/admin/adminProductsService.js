import { api } from "../apiClient";

// Nếu bạn có admin products controller: /api/admin/products ...
export const adminProductsService = {
  getAll: () => api.get("/api/admin/products"),
  create: (data) => api.post("/api/admin/products", data),
  update: (id, data) => api.put(`/api/admin/products/${id}`, data),
  remove: (id) => api.delete(`/api/admin/products/${id}`),
};