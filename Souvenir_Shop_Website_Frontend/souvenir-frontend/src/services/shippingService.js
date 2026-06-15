import apiClient from "./apiClient";

export const shippingService = {
  getFee: (province, district) =>
    apiClient.get("/api/shipping/fee", {
      params: {
        province,
        district,
      },
    }),
};