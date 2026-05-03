import apiClient from "./apiClient";

export const aiService = {
  translate: (text, targetLanguage) =>
    apiClient.post("/api/ai/translate", { text, targetLanguage }),
  chatRecommend: (message, maxProducts = 5) =>
    apiClient.post("/api/ai/chat-recommend", {
      message,
      maxProducts,
    }),
};