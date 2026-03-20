import apiClient from "../apiClient";

export const adminProductsService = {
  getAll: () => apiClient.get("api/admin/products"),
  create: (data) => apiClient.post("api/admin/products", data),
  update: (id, data) => apiClient.put(`api/admin/products/${id}`, data),
  remove: (id) => apiClient.delete(`api/admin/products/${id}`),

  getImages: (productId) => apiClient.get(`api/admin/products/${productId}/images`),
  addImages: (productId, imageUrls) =>
    apiClient.post(`api/admin/products/${productId}/images`, imageUrls),

  replaceImages: (productId, imageUrls) =>
  apiClient.put(`api/admin/products/${productId}/images`, imageUrls),
  
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post("api/admin/products/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};