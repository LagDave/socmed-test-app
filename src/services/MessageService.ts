import { z } from "zod";
import {
  ConversationModel,
  type ConversationInboxRow,
  type ConversationRow,
} from "../models/ConversationModel";
import { FriendshipModel } from "../models/FriendshipModel";
import { MessageModel, type MessageRow } from "../models/MessageModel";
import { MessageReactionModel } from "../models/MessageReactionModel";
import { REACTION_EMOJIS, emptyReactionSummary, type ReactionSummary } from "../models/ReactionModel";
import { UserModel } from "../models/UserModel";
import { AppError } from "../utils/AppError";
import { isUniqueViolation } from "../utils/dbErrors";
import { toPublicUser } from "../types/user";
import { MessageRealtime } from "../realtime/MessageRealtime";
import { logger } from "../logger";

async function publishRealtime(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (err) {
    logger.error({ err }, "Message realtime publish failed");
  }
}

const MESSAGE_PAGE_SIZE = 50;
const UPLOAD_PATH_RE = /^\/uploads\/[A-Za-z0-9._-]+$/;

const openConversationSchema = z
  .object({
    username: z.string().min(1).max(64).optional(),
    userId: z.string().uuid().optional(),
  })
  .refine((v) => Boolean(v.username || v.userId), {
    message: "username or userId is required",
  });

const sendMessageSchema = z
  .object({
    body: z.string().max(4000).optional(),
    imageUrl: z.string().max(500).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    const body = v.body?.trim() ?? "";
    const imageUrl = v.imageUrl ?? null;
    if (!body && !imageUrl) {
      ctx.addIssue({ code: "custom", message: "body or imageUrl is required" });
    }
    if (imageUrl && !UPLOAD_PATH_RE.test(imageUrl)) {
      ctx.addIssue({ code: "custom", path: ["imageUrl"], message: "Invalid imageUrl" });
    }
  });

const reactionSchema = z.object({
  emoji: z.enum(REACTION_EMOJIS),
});

export type MessageView = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  imageUrl: string | null;
  isUnsent: boolean;
  createdAt: Date;
  reactionSummary: ReactionSummary;
};

export type ConversationListItem = {
  id: string;
  peer: ReturnType<typeof toPublicUser>;
  lastMessage: {
    id: string;
    body: string | null;
    imageUrl: string | null;
    isUnsent: boolean;
    senderId: string;
    createdAt: Date;
  } | null;
  unreadCount: number;
  lastMessageAt: Date | null;
};

function peerId(row: ConversationRow, viewerId: string): string {
  return row.user_a === viewerId ? row.user_b : row.user_a;
}

function lastReadAt(row: ConversationRow, viewerId: string): Date | null {
  if (row.user_a === viewerId) return row.user_a_last_read_at;
  if (row.user_b === viewerId) return row.user_b_last_read_at;
  return null;
}

function assertParticipant(row: ConversationRow, userId: string): void {
  if (row.user_a !== userId && row.user_b !== userId) {
    throw new AppError("MESSAGE_FORBIDDEN", "Not a participant of this conversation.");
  }
}

function toMessageView(row: MessageRow, reactionSummary: ReactionSummary): MessageView {
  const isUnsent = Boolean(row.unsent_at);
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: isUnsent ? null : row.body,
    imageUrl: isUnsent ? null : row.image_url,
    isUnsent,
    createdAt: row.created_at,
    reactionSummary: isUnsent ? emptyReactionSummary() : reactionSummary,
  };
}

export class MessageService {
  static async openConversation(
    userId: string,
    raw: unknown
  ): Promise<{ conversation: ConversationListItem; created: boolean }> {
    const input = openConversationSchema.parse(raw);
    let other = input.userId ? await UserModel.findById(input.userId) : undefined;
    if (!other && input.username) {
      other = await UserModel.findByUsername(input.username);
    }
    if (!other) throw new AppError("USER_NOT_FOUND", "User not found.");
    if (other.id === userId) {
      throw new AppError("MESSAGE_VALIDATION", "Cannot message yourself.");
    }
    if (!(await FriendshipModel.areFriends(userId, other.id))) {
      throw new AppError("MESSAGE_FORBIDDEN", "You can only message accepted friends.");
    }

    let conversation = await ConversationModel.findPair(userId, other.id);
    let created = false;
    if (!conversation) {
      try {
        conversation = await ConversationModel.createPair(userId, other.id);
        created = true;
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        conversation = await ConversationModel.findPair(userId, other.id);
        if (!conversation) throw new AppError("MESSAGE_CONFLICT", "Could not open conversation.");
      }
    }
    return { conversation: await this.toListItem(conversation, userId), created };
  }

  static async listConversations(userId: string): Promise<ConversationListItem[]> {
    const rows = await ConversationModel.listInboxForUser(userId);
    return rows.map((row) => this.inboxRowToListItem(row));
  }

  static async listMessages(
    userId: string,
    conversationId: string,
    before?: string
  ): Promise<{
    conversationId: string;
    peer: ReturnType<typeof toPublicUser>;
    messages: MessageView[];
    hasMore: boolean;
  }> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);

    const peerUser = await UserModel.findById(peerId(conversation, userId));
    if (!peerUser) throw new AppError("USER_NOT_FOUND", "Peer missing.");

    const rows = await MessageModel.listByConversation(conversationId, {
      limit: MESSAGE_PAGE_SIZE,
      before,
    });
    const summaries = await MessageReactionModel.summariesForMessages(
      rows.filter((r) => !r.unsent_at).map((r) => r.id),
      userId
    );

    return {
      conversationId,
      peer: toPublicUser(peerUser),
      messages: rows.map((r) =>
        toMessageView(r, summaries.get(r.id) ?? emptyReactionSummary())
      ),
      hasMore: rows.length >= MESSAGE_PAGE_SIZE,
    };
  }

  static async send(
    userId: string,
    conversationId: string,
    raw: unknown
  ): Promise<MessageView> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);

    const otherId = peerId(conversation, userId);
    if (!(await FriendshipModel.areFriends(userId, otherId))) {
      throw new AppError("MESSAGE_FORBIDDEN", "You can only message accepted friends.");
    }

    const input = sendMessageSchema.parse(raw);
    const body = input.body?.trim() || null;
    const imageUrl = input.imageUrl ?? null;

    const row = await MessageModel.create({
      conversationId,
      senderId: userId,
      body,
      imageUrl,
    });
    await ConversationModel.touchLastMessage(conversationId, row.created_at);
    const view = toMessageView(row, emptyReactionSummary());
    await publishRealtime(() => MessageRealtime.messageCreated(conversation, view));
    return view;
  }

  static async unsend(userId: string, messageId: string): Promise<MessageView> {
    const existing = await MessageModel.findById(messageId);
    if (!existing) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");

    const conversation = await ConversationModel.findById(existing.conversation_id);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);

    if (existing.sender_id !== userId) {
      throw new AppError("MESSAGE_FORBIDDEN", "You can only unsend your own messages.");
    }
    if (existing.unsent_at) {
      return toMessageView(existing, emptyReactionSummary());
    }

    const row = await MessageModel.markUnsent(messageId, userId);
    if (!row) throw new AppError("MESSAGE_NOT_FOUND", "Message not found or already unsent.");
    const view = toMessageView(row, emptyReactionSummary());
    await publishRealtime(() => MessageRealtime.messageUnsent(conversation, view));
    return view;
  }

  static async setReaction(
    userId: string,
    messageId: string,
    raw: unknown
  ): Promise<MessageView> {
    const { message, conversation } = await this.requireMessageAccess(userId, messageId);
    if (message.unsent_at) {
      throw new AppError("MESSAGE_VALIDATION", "Cannot react to an unsent message.");
    }
    const input = reactionSchema.parse(raw);
    await MessageReactionModel.upsert(userId, messageId, input.emoji);
    const targets = await this.reactionViewsForParticipants(conversation, message);
    const viewerView =
      targets.find((t) => t.userId === userId)?.message ??
      toMessageView(message, emptyReactionSummary());
    await publishRealtime(() => MessageRealtime.messageReaction(targets));
    return viewerView;
  }

  static async clearReaction(userId: string, messageId: string): Promise<MessageView> {
    const { message, conversation } = await this.requireMessageAccess(userId, messageId);
    if (message.unsent_at) {
      throw new AppError("MESSAGE_VALIDATION", "Cannot react to an unsent message.");
    }
    await MessageReactionModel.delete(userId, messageId);
    const targets = await this.reactionViewsForParticipants(conversation, message);
    const viewerView =
      targets.find((t) => t.userId === userId)?.message ??
      toMessageView(message, emptyReactionSummary());
    await publishRealtime(() => MessageRealtime.messageReaction(targets));
    return viewerView;
  }

  static async markRead(userId: string, conversationId: string): Promise<{ ok: true }> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);
    await ConversationModel.markRead(conversationId, userId, new Date());
    await publishRealtime(() => MessageRealtime.conversationRead(conversation, userId));
    return { ok: true };
  }

  static async unreadCount(userId: string): Promise<{ unread: number }> {
    const unread = await ConversationModel.countUnreadConversations(userId);
    return { unread };
  }

  private static async requireMessageAccess(userId: string, messageId: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");
    const conversation = await ConversationModel.findById(message.conversation_id);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);
    return { message, conversation };
  }

  private static async reactionViewsForParticipants(
    conversation: ConversationRow,
    message: MessageRow
  ): Promise<Array<{ userId: string; message: MessageView }>> {
    const userIds = [conversation.user_a, conversation.user_b];
    return Promise.all(
      userIds.map(async (uid) => {
        const summaries = await MessageReactionModel.summariesForMessages([message.id], uid);
        return {
          userId: uid,
          message: toMessageView(message, summaries.get(message.id) ?? emptyReactionSummary()),
        };
      })
    );
  }

  private static inboxRowToListItem(row: ConversationInboxRow): ConversationListItem {
    const latest = row.lastMessage;
    return {
      id: row.id,
      peer: toPublicUser(row.peer),
      lastMessage: latest
        ? {
            id: latest.id,
            body: latest.unsent_at ? null : latest.body,
            imageUrl: latest.unsent_at ? null : latest.image_url,
            isUnsent: Boolean(latest.unsent_at),
            senderId: latest.sender_id,
            createdAt: latest.created_at,
          }
        : null,
      unreadCount: row.unreadCount,
      lastMessageAt: row.last_message_at,
    };
  }

  private static async toListItem(
    row: ConversationRow,
    viewerId: string
  ): Promise<ConversationListItem> {
    const peerUser = await UserModel.findById(peerId(row, viewerId));
    if (!peerUser) throw new AppError("USER_NOT_FOUND", "Peer missing.");
    const latest = await MessageModel.latestForConversation(row.id);
    const unreadCount = await MessageModel.countUnreadInConversation(
      row.id,
      viewerId,
      lastReadAt(row, viewerId)
    );

    return {
      id: row.id,
      peer: toPublicUser(peerUser),
      lastMessage: latest
        ? {
            id: latest.id,
            body: latest.unsent_at ? null : latest.body,
            imageUrl: latest.unsent_at ? null : latest.image_url,
            isUnsent: Boolean(latest.unsent_at),
            senderId: latest.sender_id,
            createdAt: latest.created_at,
          }
        : null,
      unreadCount,
      lastMessageAt: row.last_message_at,
    };
  }
}
