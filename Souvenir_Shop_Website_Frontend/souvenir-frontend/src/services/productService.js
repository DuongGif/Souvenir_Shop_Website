import { api } from "./apiClient";

/**
 * GET /api/products?keyword=&categoryIds=1,2,3&minPrice=&maxPrice=&minRating=&inStockOnly=&sort=&page=&pageSize=
 */
export const productService = {
  search: (params) => api.get("/api/products", { params }),
  detail: (id) => api.get(`/api/products/${id}`),
};