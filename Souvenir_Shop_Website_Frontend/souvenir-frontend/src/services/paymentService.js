import apiClient from "./apiClient";

export const paymentService = {
  create: (data) => apiClient.post("/api/payments", data), // { orderCode, paymentMethod }
  confirm: (data) => apiClient.post("/api/payments/confirm", data), // { orderCode }
  byOrderCode: (orderCode) => apiClient.get(`/api/payments/by-order-code/${orderCode}`),
};