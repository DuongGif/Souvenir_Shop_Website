import apiClient from "./apiClient";

export const orderService = {
  create: (data) => apiClient.post("/api/orders", data), // { shippingAddressId, fulfillmentType, couponCode? }
  my: () => apiClient.get("/api/orders/my"),
  byCode: (orderCode) => apiClient.get(`/api/orders/by-code/${orderCode}`),
};