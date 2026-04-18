import apiClient from "./apiClient";

export const chatService = {
  // Khách hàng
  openOrGetMyConversation: () => apiClient.post("/api/chat/open"),
  getMyMessages: (conversationId) =>
    apiClient.get(`/api/chat/conversations/${conversationId}/messages`),
  sendMyMessage: (conversationId, payload) =>
    apiClient.post(`/api/chat/conversations/${conversationId}/messages`, payload),

  // Admin
  getAdminConversations: (keyword = "") =>
    apiClient.get("/api/admin/chat/conversations", {
      params: { keyword },
    }),

  getAdminMessages: (conversationId) =>
    apiClient.get(`/api/admin/chat/conversations/${conversationId}/messages`),

  sendAdminMessage: (conversationId, payload) =>
    apiClient.post(
      `/api/admin/chat/conversations/${conversationId}/messages`,
      payload
    ),

  markAdminRead: (conversationId) =>
    apiClient.put(`/api/admin/chat/conversations/${conversationId}/read`),
};