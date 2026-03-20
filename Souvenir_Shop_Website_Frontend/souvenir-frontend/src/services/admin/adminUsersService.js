import  apiClient from "../apiClient";

export const adminUsersService = {
  getAll: () => apiClient.get("/api/admin/users"),
  lock: (id) => apiClient.put(`/api/admin/users/${id}/lock`),
  unlock: (id) => apiClient.put(`/api/admin/users/${id}/unlock`),
};