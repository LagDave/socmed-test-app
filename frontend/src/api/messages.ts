import { api } from "@/api/client";
import type {
  ChatTheme,
  ConversationListItem,
  ConversationSearchResponse,
  ConversationThemeUpdateView,
} from "@/api/types";

export async function openConversationWithUsername(username: string): Promise<string> {
  const data = await api.post<{ conversation: ConversationListItem }>(
    "/api/messages/conversations",
    { username }
  );
  return data.conversation.id;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await api.delete(`/api/messages/conversations/${conversationId}`);
}

export function searchConversationMessages(
  conversationId: string,
  query: string,
  signal?: AbortSignal
): Promise<ConversationSearchResponse> {
  const params = new URLSearchParams({ q: query });
  return api.get(
    `/api/messages/conversations/${conversationId}/search?${params.toString()}`,
    { signal }
  );
}

export async function updateConversationTheme(
  conversationId: string,
  payload: ChatTheme | { reset: true }
): Promise<ConversationThemeUpdateView> {
  return api.put<ConversationThemeUpdateView>(
    `/api/messages/conversations/${conversationId}/theme`,
    payload
  );
}
