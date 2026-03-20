import apiClient from "../apiClient";

export const adminVariantsService = {
  getAll: (productId) => apiClient.get(`/api/admin/products/${productId}/variants`),

  getById: (productId, id) =>
    apiClient.get(`/api/admin/products/${productId}/variants/${id}`),

  create: (productId, data) =>
    apiClient.post(`/api/admin/products/${productId}/variants`, data),

  update: (productId, id, data) =>
    apiClient.put(`/api/admin/products/${productId}/variants/${id}`, data),

  remove: (productId, id) =>
    apiClient.delete(`/api/admin/products/${productId}/variants/${id}`),
};