import apiClient from "./apiClient";

export const accountService = {
  getMe: () => apiClient.get("api/account/me"),
  updateMe: (payload) => apiClient.put("api/account/me", payload),
  getAddresses: () => apiClient.get("api/account/addresses"),
  createAddress: (payload) => apiClient.post("api/account/addresses", payload),
  updateAddress: (id, payload) =>
    apiClient.put(`api/account/addresses/${id}`, payload),
  setDefaultAddress: (id) =>
    apiClient.put(`api/account/addresses/${id}/default`),  
  deleteAddress: (id) =>
    apiClient.delete(`api/account/addresses/${id}`),
};