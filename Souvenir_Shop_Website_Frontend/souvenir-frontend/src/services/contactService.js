import apiClient from "./apiClient";

export const contactService = {
  send: (data) => apiClient.post("/api/contact", data),
};