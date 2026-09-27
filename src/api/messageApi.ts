import type { Conversation, Message } from "../types";
import { api, getErrorMessage } from "./client";

export async function getConversationsApi(): Promise<Conversation[]> {
  try {
    const { data } = await api.get<
      Conversation[] | { success: boolean; conversations: Conversation[]; data?: Conversation[] }
    >("/messages/conversations");
    if (Array.isArray(data)) return data;
    return data?.conversations ?? data?.data ?? [];
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch conversations"));
  }
}

export async function getMessagesApi(userId: string): Promise<Message[]> {
  try {
    const { data } = await api.get<
      Message[] | { success: boolean; messages: Message[]; data?: Message[] }
    >(`/messages/${userId}`);
    if (Array.isArray(data)) return data;
    return data?.messages ?? data?.data ?? [];
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to fetch messages"));
  }
}

export async function sendMessageApi(
  receiverId: string,
  message: string,
): Promise<Message> {
  try {
    const { data } = await api.post<{ success: boolean; message: Message }>(
      "/messages",
      { receiverId, message },
    );
    return data.message;
  } catch (e) {
    throw new Error(getErrorMessage(e, "Failed to send message"));
  }
}
