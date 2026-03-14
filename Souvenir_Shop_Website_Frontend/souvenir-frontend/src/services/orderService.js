import { api } from "./apiClient";

export const orderService = {
  create: (data) => api.post("/api/orders", data), // { shippingAddressId, fulfillmentType, couponCode? }
  my: () => api.get("/api/orders/my"),
  byCode: (orderCode) => api.get(`/api/orders/by-code/${orderCode}`),
};