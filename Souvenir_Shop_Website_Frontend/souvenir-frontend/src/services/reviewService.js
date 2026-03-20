import apiClient from "./apiClient";

export const reviewService = {
  create: (data) => apiClient.post("/api/reviews", data), // { productId, rating, title, content }
  byProduct: (productId) => apiClient.get(`/api/reviews/product/${productId}`),
};