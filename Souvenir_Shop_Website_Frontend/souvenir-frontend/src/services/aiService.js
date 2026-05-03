import apiClient from "./apiClient";

export const aiService = {
  translate: (text, targetLanguage) =>
    apiClient.post("/api/ai/translate", { text, targetLanguage }),
};