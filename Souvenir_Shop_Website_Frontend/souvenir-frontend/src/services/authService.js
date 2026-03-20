import apiClient from "./apiClient";

export const authService = {
  login: (email, password) =>
    apiClient.post("api/auth/login", { email, password }),

  register: (payload) =>
    apiClient.post("/auth/register", payload),
};