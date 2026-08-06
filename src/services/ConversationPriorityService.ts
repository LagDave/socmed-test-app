import { db } from "../database/connection";
import { ConversationModel, type ConversationRow } from "../models/ConversationModel";
import { ConversationPinModel } from "../models/ConversationPinModel";
import { MessageRealtime } from "../realtime/MessageRealtime";
import { AppError } from "../utils/AppError";

export type ConversationPriorityView = { conversationId: string; isPinned: boolean };

function assertParticipant(conversation: ConversationRow, userId: string): void {
  if (conversation.user_a !== userId && conversation.user_b !== userId) {
    throw new AppError("MESSAGE_FORBIDDEN", "Not a participant of this conversation.");
  }
}

export class ConversationPriorityService {
  static async pin(userId: string, conversationId: string): Promise<ConversationPriorityView> {
    const conversation = await this.requireAccess(userId, conversationId);
    const created = await db.transaction((trx) => ConversationPinModel.create(conversation.id, userId, trx));
    if (created) MessageRealtime.conversationPriorityUpdated(userId, conversation.id);
    return { conversationId: conversation.id, isPinned: true };
  }
  static async unpin(userId: string, conversationId: string): Promise<ConversationPriorityView> {
    const conversation = await this.requireAccess(userId, conversationId);
    const removed = await db.transaction((trx) => ConversationPinModel.deleteForUser(conversation.id, userId, trx));
    if (removed) MessageRealtime.conversationPriorityUpdated(userId, conversation.id);
    return { conversationId: conversation.id, isPinned: false };
  }
  private static async requireAccess(userId: string, conversationId: string): Promise<ConversationRow> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);
    return conversation;
  }
}
