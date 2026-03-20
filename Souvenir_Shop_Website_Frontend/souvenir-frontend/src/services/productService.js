import apiClient from "./apiClient";

/**
 * GET /api/products?keyword=&categoryIds=1,2,3&minPrice=&maxPrice=&minRating=&inStockOnly=&sort=&page=&pageSize=
 */
export const productService = {
  search: (params) => apiClient.get("/api/products", { params }),
  detail: (id) => apiClient.get(`/api/products/${id}`),
  
};