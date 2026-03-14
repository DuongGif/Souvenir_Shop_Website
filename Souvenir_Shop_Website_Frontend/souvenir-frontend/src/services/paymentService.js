import { api } from "./apiClient";

export const paymentService = {
  create: (data) => api.post("/api/payments", data), // { orderCode, paymentMethod }
  confirm: (data) => api.post("/api/payments/confirm", data), // { orderCode }
  byOrderCode: (orderCode) => api.get(`/api/payments/by-order-code/${orderCode}`),
};