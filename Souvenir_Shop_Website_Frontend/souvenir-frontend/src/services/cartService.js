import { api } from "./apiClient";

export const cartService = {
  get: () => api.get("/api/cart"),
  addItem: (data) => api.post("/api/cart/items", data), // { variantId, quantity }
  updateItem: (itemId, data) => api.put(`/api/cart/items/${itemId}`, data), // { quantity }
  deleteItem: (itemId) => api.delete(`/api/cart/items/${itemId}`),
};