import type { Knex } from "knex";
import { db } from "../database/connection";
import { ConversationModel, type ConversationRow } from "../models/ConversationModel";
import { MessageModel, type MessageRow } from "../models/MessageModel";
import {
  MessagePinActivityModel,
  type MessagePinActivityRow,
  type MessagePinActivityWithActorRow,
} from "../models/MessagePinActivityModel";
import { MessagePinModel, type PinnedMessageRow } from "../models/MessagePinModel";
import { MessageUserDeletionModel } from "../models/MessageUserDeletionModel";
import { UserModel } from "../models/UserModel";
import { logger } from "../logger";
import { MessageRealtime } from "../realtime/MessageRealtime";
import { AppError } from "../utils/AppError";

const PIN_ACTIVITY_PAGE_SIZE = 100;

export type PinnedMessageView = {
  messageId: string;
  body: string | null;
  imageUrl: string | null;
  senderId: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  createdAt: Date;
  pinnedById: string;
  pinnedAt: Date;
};

export type MessagePinActivityView = {
  id: string;
  messageId: string;
  actorId: string;
  actorDisplayName: string;
  action: "pinned" | "unpinned";
  createdAt: Date;
};

export type PinnedMessagesResponse = {
  conversationId: string;
  pinnedMessages: PinnedMessageView[];
  pinActivity: MessagePinActivityView | null;
};

function assertParticipant(conversation: ConversationRow, userId: string): void {
  if (conversation.user_a !== userId && conversation.user_b !== userId) {
    throw new AppError("MESSAGE_FORBIDDEN", "Not a participant of this conversation.");
  }
}

function toPinnedMessageView(row: PinnedMessageRow): PinnedMessageView {
  return {
    messageId: row.message_id,
    body: row.body,
    imageUrl: row.image_url,
    senderId: row.sender_id,
    senderDisplayName: row.sender_display_name,
    senderAvatarUrl: row.sender_avatar_url,
    createdAt: row.created_at,
    pinnedById: row.pinned_by,
    pinnedAt: row.pinned_at,
  };
}

function toMessagePinActivityView(
  row: MessagePinActivityWithActorRow
): MessagePinActivityView {
  return {
    id: row.id,
    messageId: row.message_id,
    actorId: row.actor_id,
    actorDisplayName: row.actor_display_name,
    action: row.action,
    createdAt: row.created_at,
  };
}

async function publishRealtime(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (err) {
    logger.error({ err }, "Message pin realtime publish failed");
  }
}

export class MessagePinService {
  static async listThreadPinState(
    conversationId: string,
    userId: string
  ): Promise<{ pinnedMessages: PinnedMessageView[]; pinActivities: MessagePinActivityView[] }> {
    const [pinnedMessages, pinActivities] = await Promise.all([
      this.pinnedMessagesForUser(conversationId, userId),
      this.pinActivitiesForUser(conversationId, userId),
    ]);
    return { pinnedMessages, pinActivities };
  }

  static async pinMessage(userId: string, messageId: string): Promise<PinnedMessagesResponse> {
    const { message, conversation } = await this.requireMessageAccess(userId, messageId);
    this.assertMessageCanBePinned(message);

    const activityRow = await db.transaction(async (trx) => {
      const created = await MessagePinModel.create(
        { messageId, conversationId: conversation.id, pinnedBy: userId },
        trx
      );
      return created
        ? MessagePinActivityModel.create(
            { conversationId: conversation.id, messageId, actorId: userId, action: "pinned" },
            trx
          )
        : null;
    });
    return this.publishPinnedMessages(conversation, userId, activityRow);
  }

  static async unpinMessage(userId: string, messageId: string): Promise<PinnedMessagesResponse> {
    const { message, conversation } = await this.requireMessageAccess(userId, messageId);
    this.assertMessageCanBePinned(message);

    const activityRow = await db.transaction(async (trx) => {
      const removed = await MessagePinModel.deleteForMessage(messageId, trx);
      return removed
        ? MessagePinActivityModel.create(
            { conversationId: conversation.id, messageId, actorId: userId, action: "unpinned" },
            trx
          )
        : null;
    });
    return this.publishPinnedMessages(conversation, userId, activityRow);
  }

  static async deletePinForUnsentMessage(messageId: string, trx: Knex): Promise<boolean> {
    return MessagePinModel.deleteForMessage(messageId, trx);
  }

  static async listPinnedMessagesForParticipants(
    conversation: ConversationRow
  ): Promise<Array<{ userId: string; pinnedMessages: PinnedMessageView[] }>> {
    return Promise.all(
      [conversation.user_a, conversation.user_b].map(async (userId) => ({
        userId,
        pinnedMessages: await this.pinnedMessagesForUser(conversation.id, userId),
      }))
    );
  }

  private static async publishPinnedMessages(
    conversation: ConversationRow,
    userId: string,
    activityRow: MessagePinActivityRow | null
  ): Promise<PinnedMessagesResponse> {
    const targets = await this.listPinnedMessagesForParticipants(conversation);
    const pinActivity = activityRow ? await this.pinActivityView(activityRow) : null;
    await publishRealtime(() =>
      MessageRealtime.messagePinsUpdated(conversation, targets, pinActivity)
    );
    return {
      conversationId: conversation.id,
      pinnedMessages: targets.find((target) => target.userId === userId)?.pinnedMessages ?? [],
      pinActivity,
    };
  }

  private static assertMessageCanBePinned(message: MessageRow): void {
    if (message.unsent_at) {
      throw new AppError("MESSAGE_VALIDATION", "Cannot pin an unsent message.");
    }
  }

  private static async requireConversationAccess(
    userId: string,
    conversationId: string
  ): Promise<ConversationRow> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);
    return conversation;
  }

  private static async requireMessageAccess(
    userId: string,
    messageId: string
  ): Promise<{ message: MessageRow; conversation: ConversationRow }> {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");
    const conversation = await this.requireConversationAccess(userId, message.conversation_id);
    if (await MessageUserDeletionModel.isDeletedForUser(messageId, userId)) {
      throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");
    }
    return { message, conversation };
  }

  private static async pinnedMessagesForUser(
    conversationId: string,
    userId: string
  ): Promise<PinnedMessageView[]> {
    const rows = await MessagePinModel.listForConversation(conversationId, userId);
    return rows.map(toPinnedMessageView);
  }

  private static async pinActivitiesForUser(
    conversationId: string,
    userId: string
  ): Promise<MessagePinActivityView[]> {
    const rows = await MessagePinActivityModel.listForConversation(
      conversationId,
      userId,
      PIN_ACTIVITY_PAGE_SIZE
    );
    return rows.map(toMessagePinActivityView);
  }

  private static async pinActivityView(
    row: MessagePinActivityRow
  ): Promise<MessagePinActivityView> {
    const actor = await UserModel.findById(row.actor_id);
    if (!actor) throw new AppError("USER_NOT_FOUND", "Pin activity actor missing.");
    return {
      id: row.id,
      messageId: row.message_id,
      actorId: row.actor_id,
      actorDisplayName: actor.display_name,
      action: row.action,
      createdAt: row.created_at,
    };
  }
}
