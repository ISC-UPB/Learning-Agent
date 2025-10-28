import apiClient from "../api/apiClient";
import type { ChatWithIARequest, ChatWithIAResponse } from "../interfaces/model";

export const getChatResponse = async (question: string): Promise<ChatWithIAResponse> => {

  const response = await apiClient.post("/chat", {
    question
  } as ChatWithIARequest);

  return response.data;
};