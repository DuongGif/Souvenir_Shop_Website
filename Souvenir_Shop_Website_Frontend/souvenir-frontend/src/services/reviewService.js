import { api } from "./apiClient";

export const reviewService = {
  create: (data) => api.post("/api/reviews", data), // { productId, rating, title, content }
  byProduct: (productId) => api.get(`/api/reviews/product/${productId}`),
};