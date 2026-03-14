import { api } from "../apiClient";

// Nếu bạn có admin orders controller: /api/admin/orders ...
export const adminOrdersService = {
  getAll: () => api.get("/api/admin/orders"),
  // update status tùy backend bạn: ví dụ PUT /api/admin/orders/{id}/status
  updateStatus: (id, data) => api.put(`/api/admin/orders/${id}/status`, data),
};