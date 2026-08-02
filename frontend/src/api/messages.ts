import { api } from "@/api/client";
import type { ChatTheme, ConversationListItem, ConversationThemeView } from "@/api/types";

export async function openConversationWithUsername(username: string): Promise<string> {
  const data = await api.post<{ conversation: ConversationListItem }>(
    "/api/messages/conversations",
    { username }
  );
  return data.conversation.id;
}

export async function updateConversationTheme(
  conversationId: string,
  payload: ChatTheme | { reset: true }
): Promise<ConversationThemeView> {
  return api.put<ConversationThemeView>(
    `/api/messages/conversations/${conversationId}/theme`,
    payload
  );
}
