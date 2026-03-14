import { api } from "../apiClient";

export const adminReviewsService = {
  getAll: (status = "pending") => api.get(`/api/admin/reviews?status=${status}`),
  approve: (id) => api.put(`/api/admin/reviews/${id}/approve`),
  reject: (id) => api.put(`/api/admin/reviews/${id}/reject`),
  reply: (id, data) => api.post(`/api/admin/reviews/${id}/reply`, data), // { content }
};