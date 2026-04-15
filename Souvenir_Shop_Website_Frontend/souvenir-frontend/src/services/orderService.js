import apiClient from "./apiClient";

export const orderService = {
  create: (data) => apiClient.post("/api/orders", data), // { shippingAddressId, fulfillmentType, couponCode? }
  my: () => apiClient.get("/api/orders/my"),
  byCode: (orderCode) => apiClient.get(`/api/orders/by-code/${orderCode}`),
  cancelByCode: (orderCode) => apiClient.put(`/api/orders/${orderCode}/cancel`),
  requestCancel: (orderCode) => apiClient.put(`/api/orders/${orderCode}/cancel-request`),
  requestReturn: (orderCode) => apiClient.put(`/api/orders/${orderCode}/return-request`),
};