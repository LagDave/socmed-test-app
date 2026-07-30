import { ConversationModel } from "../models/ConversationModel";
import type { ConversationRow } from "../models/ConversationModel";
import type { MessageView } from "../services/MessageService";
import { emitToUser } from "./io";

export const MESSAGE_NEW = "message:new";
export const MESSAGE_UNSENT = "message:unsent";
export const MESSAGE_REACTION = "message:reaction";
export const MESSAGES_UNREAD = "messages:unread";
export const CONVERSATION_UPDATED = "conversation:updated";

function participantIds(conversation: ConversationRow): [string, string] {
  return [conversation.user_a, conversation.user_b];
}

async function emitUnreadForUser(userId: string): Promise<void> {
  const unread = await ConversationModel.countUnreadConversations(userId);
  emitToUser(userId, MESSAGES_UNREAD, { unread });
}

async function emitUnreadForParticipants(conversation: ConversationRow): Promise<void> {
  const [a, b] = participantIds(conversation);
  await Promise.all([emitUnreadForUser(a), emitUnreadForUser(b)]);
}

function emitConversationUpdated(conversation: ConversationRow): void {
  const payload = { conversationId: conversation.id };
  for (const userId of participantIds(conversation)) {
    emitToUser(userId, CONVERSATION_UPDATED, payload);
  }
}

export const MessageRealtime = {
  async messageCreated(conversation: ConversationRow, message: MessageView): Promise<void> {
    const payload = { message };
    for (const userId of participantIds(conversation)) {
      emitToUser(userId, MESSAGE_NEW, payload);
    }
    emitConversationUpdated(conversation);
    await emitUnreadForParticipants(conversation);
  },

  async messageUnsent(conversation: ConversationRow, message: MessageView): Promise<void> {
    const payload = { message };
    for (const userId of participantIds(conversation)) {
      emitToUser(userId, MESSAGE_UNSENT, payload);
    }
    emitConversationUpdated(conversation);
    await emitUnreadForParticipants(conversation);
  },

  async messageReaction(
    targets: Array<{ userId: string; message: MessageView }>
  ): Promise<void> {
    for (const { userId, message } of targets) {
      emitToUser(userId, MESSAGE_REACTION, { message });
    }
  },

  async conversationRead(conversation: ConversationRow, readerId: string): Promise<void> {
    emitToUser(readerId, CONVERSATION_UPDATED, { conversationId: conversation.id });
    await emitUnreadForUser(readerId);
  },
};
