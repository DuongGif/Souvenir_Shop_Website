import apiClient from "../apiClient";

export const adminCategoriesService = {
  getAll: () => apiClient.get("/api/AdminCategories"),
  getById: (id) =>apiClient.get(`/api/AdminCategories/${id}`),
  create: (data) =>apiClient.post("/api/AdminCategories", data),
  update: (id, data) =>apiClient.put(`/api/AdminCategories/${id}`, data),
  remove: (id) =>apiClient.delete(`/api/AdminCategories/${id}`),
};