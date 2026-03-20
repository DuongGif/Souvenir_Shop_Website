import apiClient from "../apiClient";

export const adminOrdersService = {
  getAll: () => apiClient.get("api/admin/orders"),
  updateStatus: (id, status) =>
    apiClient.put(`api/admin/orders/${id}/status`, { status }),
};