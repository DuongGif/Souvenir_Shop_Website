import { api } from "../apiClient";

export const adminUsersService = {
  getAll: () => api.get("/api/admin/users"),
  lock: (id) => api.put(`/api/admin/users/${id}/lock`),
  unlock: (id) => api.put(`/api/admin/users/${id}/unlock`),
};