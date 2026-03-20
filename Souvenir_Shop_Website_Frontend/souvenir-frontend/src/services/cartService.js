import apiClient from "./apiClient";

export const cartService = {
  get: () => apiClient.get("/api/cart"),
  addItem: (data) => apiClient.post("/api/cart/items", data), // { variantId, quantity }
  updateItem: (itemId, data) => apiClient.put(`/api/cart/items/${itemId}`, data), // { quantity }
  deleteItem: (itemId) => apiClient.delete(`/api/cart/items/${itemId}`),
};