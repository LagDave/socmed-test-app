import { ConversationModel } from "../models/ConversationModel";
import type { ConversationRow } from "../models/ConversationModel";
import type { MessageView } from "../services/MessageService";
import type { ConversationThemeView } from "../services/ChatThemeService";
import { emitToUser } from "./io";

export const MESSAGE_NEW = "message:new";
export const MESSAGE_UNSENT = "message:unsent";
export const MESSAGE_EDITED = "message:edited";
export const MESSAGE_REACTION = "message:reaction";
export const MESSAGE_DELIVERED = "message:delivered";
export const CONVERSATION_PEER_READ = "conversation:peer-read";
export const MESSAGE_ACK = "message:ack";
export const MESSAGES_UNREAD = "messages:unread";
export const CONVERSATION_UPDATED = "conversation:updated";
export const CONVERSATION_THEME = "conversation:theme";

export type MessageDeliveredPayload = {
  messageId: string;
  conversationId: string;
  deliveredAt: Date;
};

export type ConversationPeerReadPayload = {
  conversationId: string;
  readerId: string;
  peerLastReadAt: Date;
};

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

  async messageEdited(conversation: ConversationRow, message: MessageView): Promise<void> {
    const payload = { message };
    for (const userId of participantIds(conversation)) {
      emitToUser(userId, MESSAGE_EDITED, payload);
    }
    emitConversationUpdated(conversation);
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

  async conversationHidden(conversation: ConversationRow, userId: string): Promise<void> {
    emitToUser(userId, CONVERSATION_UPDATED, { conversationId: conversation.id });
    await emitUnreadForUser(userId);
  },

  async conversationTheme(
    conversation: ConversationRow,
    theme: ConversationThemeView
  ): Promise<void> {
    const payload = {
      conversationId: conversation.id,
      theme: theme.theme,
      updatedAt: theme.updatedAt?.toISOString() ?? null,
      updatedBy: theme.updatedBy,
    };
    for (const userId of participantIds(conversation)) {
      emitToUser(userId, CONVERSATION_THEME, payload);
    }
  },

  messageDelivered(senderId: string, payload: MessageDeliveredPayload): void {
    emitToUser(senderId, MESSAGE_DELIVERED, payload);
  },

  conversationPeerRead(recipientId: string, payload: ConversationPeerReadPayload): void {
    emitToUser(recipientId, CONVERSATION_PEER_READ, payload);
  },
};
