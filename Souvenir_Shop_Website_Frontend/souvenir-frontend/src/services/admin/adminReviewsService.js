import  apiClient from "../apiClient";

export const adminReviewsService = {
  getAll: (status = "pending") => apiClient.get(`/api/admin/reviews?status=${status}`),
  approve: (id) => apiClient.put(`/api/admin/reviews/${id}/approve`),
  reject: (id) => apiClient.put(`/api/admin/reviews/${id}/reject`),
  reply: (id, data) => apiClient.post(`/api/admin/reviews/${id}/reply`, data), // { content }
};