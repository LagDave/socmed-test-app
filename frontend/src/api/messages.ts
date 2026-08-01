import { api } from "@/api/client";
import type { ConversationListItem } from "@/api/types";

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
