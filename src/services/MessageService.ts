import { z } from "zod";
import { db } from "../database/connection";
import {
  ConversationModel,
  type ConversationInboxRow,
  type ConversationRow,
} from "../models/ConversationModel";
import { FriendshipModel } from "../models/FriendshipModel";
import {
  MessageModel,
  type MessageReplyContext,
  type MessageRow,
  type MessageRowWithReply,
} from "../models/MessageModel";
import {
  MessageReactionModel,
  type ConversationLatestReaction,
} from "../models/MessageReactionModel";
import { MessageUserDeletionModel } from "../models/MessageUserDeletionModel";
import { MessagePinService, type MessagePinActivityView, type PinnedMessageView } from "./MessagePinService";
import type {
  ConversationListItem,
  ConversationListLastPinActivity,
  ConversationListLastReaction,
  ConversationListLastSystemLog,
} from "./MessageInboxTypes";
import { REACTION_EMOJIS, emptyReactionSummary, type ReactionSummary } from "../models/ReactionModel";
import { UserModel } from "../models/UserModel";
import { AppError } from "../utils/AppError";
import { isUniqueViolation } from "../utils/dbErrors";
import { toPublicUser } from "../types/user";
import { MessageRealtime } from "../realtime/MessageRealtime";
import { logger } from "../logger";
import { ChatThemeService, type ConversationThemeView } from "./ChatThemeService";
import type { ThemeLogEntry } from "../types/themeLog";
import { parseThemeLog } from "../types/themeLog";
import { peerPresenceForUser, type PeerPresence } from "../realtime/PresenceRealtime";

async function publishRealtime(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (err) {
    logger.error({ err }, "Message realtime publish failed");
  }
}

const MESSAGE_PAGE_SIZE = 50;
const MESSAGE_SEARCH_RESULT_LIMIT = 50;
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
    replyToMessageId: z.string().uuid().optional(),
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

const editMessageSchema = z.object({
  body: z.string().max(4000),
});

const searchMessagesSchema = z.string().trim().min(1).max(200);

export type MessageReplyToView = {
  id: string;
  senderId: string;
  senderDisplayName: string;
  body: string | null;
  imageUrl: string | null;
  isUnsent: boolean;
};

export type MessageView = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  imageUrl: string | null;
  isUnsent: boolean;
  createdAt: Date;
  editedAt: Date | null;
  deliveredAt: Date | null;
  reactionSummary: ReactionSummary;
  replyTo: MessageReplyToView | null;
};

function peerId(row: ConversationRow, viewerId: string): string {
  return row.user_a === viewerId ? row.user_b : row.user_a;
}

function lastReadAt(row: ConversationRow, viewerId: string): Date | null {
  if (row.user_a === viewerId) return row.user_a_last_read_at;
  if (row.user_b === viewerId) return row.user_b_last_read_at;
  return null;
}

function hasUnreadPeerReaction(
  reaction: ConversationListLastReaction | null,
  viewerId: string,
  peerUserId: string,
  viewerLastReadAt: Date | null
): boolean {
  if (!reaction) return false;
  if (reaction.reactorId !== peerUserId) return false;
  if (reaction.messageSenderId !== viewerId) return false;
  if (!viewerLastReadAt) return true;
  return reaction.reactedAt > viewerLastReadAt;
}

function toListLastSystemLog(entry: ThemeLogEntry | null): ConversationListLastSystemLog | null {
  if (!entry) return null;
  return {
    id: entry.id,
    text: entry.text,
    createdAt: new Date(entry.createdAt),
    updatedBy: entry.updatedBy,
  };
}

function latestThemeLogFromRow(row: ConversationRow): ThemeLogEntry | null {
  const logs = parseThemeLog(row.theme_log);
  return logs.length > 0 ? logs[logs.length - 1]! : null;
}

function latestActivityAt(
  messageAt: Date | null,
  reactionAt: Date | null,
  systemLogAt: Date | null,
  pinActivityAt: Date | null,
  fallback: Date | null
): Date | null {
  const candidates = [messageAt, reactionAt, systemLogAt, pinActivityAt].filter(
    (value): value is Date => value instanceof Date
  );
  if (candidates.length === 0) return fallback;
  return candidates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest
  );
}

function toListLastPinActivity(
  activity: ConversationInboxRow["latestPinActivity"]
): ConversationListLastPinActivity | null {
  if (!activity) return null;
  return {
    actorDisplayName: activity.actor_display_name,
    action: activity.action,
    createdAt: activity.created_at,
  };
}

function peerLastReadAt(row: ConversationRow, viewerId: string): Date | null {
  return lastReadAt(row, peerId(row, viewerId));
}

function assertParticipant(row: ConversationRow, userId: string): void {
  if (row.user_a !== userId && row.user_b !== userId) {
    throw new AppError("MESSAGE_FORBIDDEN", "Not a participant of this conversation.");
  }
}

function toReplyToView(context: MessageReplyContext): MessageReplyToView {
  const isUnsent = Boolean(context.unsent_at);
  return {
    id: context.id,
    senderId: context.sender_id,
    senderDisplayName: context.sender_display_name,
    body: isUnsent ? null : context.body,
    imageUrl: isUnsent ? null : context.image_url,
    isUnsent,
  };
}

function toMessageView(
  row: MessageRow | MessageRowWithReply,
  reactionSummary: ReactionSummary,
  replyContext?: MessageReplyContext | null
): MessageView {
  const isUnsent = Boolean(row.unsent_at);
  const context =
    replyContext ??
    ("replyContext" in row ? row.replyContext : null);

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: isUnsent ? null : row.body,
    imageUrl: isUnsent ? null : row.image_url,
    isUnsent,
    createdAt: row.created_at,
    editedAt: isUnsent ? null : row.edited_at,
    deliveredAt: row.delivered_at ?? null,
    reactionSummary: isUnsent ? emptyReactionSummary() : reactionSummary,
    replyTo: context ? toReplyToView(context) : null,
  };
}

async function rowsToViews(
  rows: MessageRowWithReply[],
  viewerId: string
): Promise<MessageView[]> {
  const summaries = await MessageReactionModel.summariesForMessages(
    rows.filter((r) => !r.unsent_at).map((r) => r.id),
    viewerId
  );
  return rows.map((r) =>
    toMessageView(r, summaries.get(r.id) ?? emptyReactionSummary())
  );
}

async function rowToView(row: MessageRowWithReply, viewerId: string): Promise<MessageView> {
  const [view] = await rowsToViews([row], viewerId);
  return view;
}

function toListLastReaction(
  reaction: ConversationLatestReaction | null
): ConversationListLastReaction | null {
  if (!reaction) return null;
  return {
    emoji: reaction.emoji,
    reactorId: reaction.reactorId,
    messageId: reaction.messageId,
    messageSenderId: reaction.messageSenderId,
    messageBody: reaction.messageBody,
    messageImageUrl: reaction.messageImageUrl,
    reactedAt: reaction.reactedAt,
  };
}

function lastMessageListShape(row: MessageRow): ConversationListItem["lastMessage"] {
  return {
    id: row.id,
    body: row.unsent_at ? null : row.body,
    imageUrl: row.unsent_at ? null : row.image_url,
    isUnsent: Boolean(row.unsent_at),
    senderId: row.sender_id,
    createdAt: row.created_at,
    replyToMessageId: row.reply_to_message_id,
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
    await ConversationModel.clearHidden(conversation.id, userId);
    return { conversation: await this.toListItem(conversation, userId), created };
  }

  static async listConversations(userId: string): Promise<ConversationListItem[]> {
    const rows = await ConversationModel.listInboxForUser(userId);
    const mutualFriendIds = new Set(await FriendshipModel.listAcceptedMutualIds(userId));
    const latestReactions = await MessageReactionModel.latestByConversations(
      rows.map((row) => row.id),
      userId
    );
    return rows
      .map((row) =>
        this.inboxRowToListItem(
          row,
          toListLastReaction(latestReactions.get(row.id) ?? null),
          userId,
          mutualFriendIds
        )
      )
      .sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() ?? 0;
        const bTime = b.lastMessageAt?.getTime() ?? 0;
        return bTime - aTime;
      });
  }

  static async listMessages(
    userId: string,
    conversationId: string,
    before?: string,
    after?: string,
    options?: { restoreIfHidden?: boolean; includeThemeLogs?: boolean }
  ): Promise<{
    conversationId: string;
    peer: ReturnType<typeof toPublicUser>;
    peerPresence: PeerPresence | null;
    peerLastReadAt: Date | null;
    messages: MessageView[];
    hasMore: boolean;
    theme: ConversationThemeView;
    themeLogs?: ThemeLogEntry[];
    pinnedMessages: PinnedMessageView[];
    pinActivities: MessagePinActivityView[];
  }> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);
    if (options?.restoreIfHidden) {
      await ConversationModel.clearHidden(conversationId, userId);
    }

    const peerUser = await UserModel.findById(peerId(conversation, userId));
    if (!peerUser) throw new AppError("USER_NOT_FOUND", "Peer missing.");

    const otherId = peerId(conversation, userId);
    const areFriends = await FriendshipModel.areFriends(userId, otherId);
    const freshlyDelivered = areFriends
      ? await MessageModel.markInboundUndeliveredAsDelivered(conversationId, userId)
      : [];
    for (const row of freshlyDelivered) {
      if (!row.delivered_at) continue;
      await publishRealtime(async () => {
        MessageRealtime.messageDelivered(row.sender_id, {
          messageId: row.id,
          conversationId: row.conversation_id,
          deliveredAt: row.delivered_at!,
        });
      });
    }
    const deliveredAtById = new Map(
      freshlyDelivered.map((r) => [r.id, r.delivered_at] as const)
    );

    const rows = await MessageModel.listByConversation(conversationId, {
      limit: MESSAGE_PAGE_SIZE,
      before,
      after,
      viewerId: userId,
    });
    const mergedRows = rows.map((r) => {
      const delivered = deliveredAtById.get(r.id);
      return delivered ? { ...r, delivered_at: delivered } : r;
    });

    const pinState = await MessagePinService.listThreadPinState(conversationId, userId);

    return {
      conversationId,
      peer: toPublicUser(peerUser),
      peerPresence: areFriends
        ? peerPresenceForUser(peerUser.id, peerUser.last_active_at ?? null)
        : null,
      peerLastReadAt: peerLastReadAt(conversation, userId),
      messages: await rowsToViews(mergedRows, userId),
      hasMore: mergedRows.length >= MESSAGE_PAGE_SIZE,
      theme: ChatThemeService.themeFromRow(conversation),
      ...(options?.includeThemeLogs
        ? { themeLogs: ChatThemeService.themeLogsFromRow(conversation) }
        : {}),
      ...pinState,
    };
  }

  static async searchMessages(
    userId: string,
    conversationId: string,
    rawQuery: unknown
  ): Promise<{ messages: MessageView[]; hasMore: boolean }> {
    const query = searchMessagesSchema.parse(rawQuery);
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);

    const rows = await MessageModel.searchByConversation(
      conversationId,
      userId,
      query,
      MESSAGE_SEARCH_RESULT_LIMIT + 1
    );
    const hasMore = rows.length > MESSAGE_SEARCH_RESULT_LIMIT;
    const resultRows = hasMore ? rows.slice(0, MESSAGE_SEARCH_RESULT_LIMIT) : rows;

    return {
      messages: await rowsToViews(resultRows, userId),
      hasMore,
    };
  }

  static async ackMessageDelivery(userId: string, messageId: string): Promise<void> {
    const message = await MessageModel.findById(messageId);
    if (!message || message.unsent_at || message.sender_id === userId) return;

    const conversation = await ConversationModel.findById(message.conversation_id);
    if (!conversation) return;
    assertParticipant(conversation, userId);

    const otherId = peerId(conversation, userId);
    if (!(await FriendshipModel.areFriends(userId, otherId))) return;

    const row = await MessageModel.markDelivered(messageId);
    if (!row?.delivered_at) return;

    await publishRealtime(async () => {
      MessageRealtime.messageDelivered(row.sender_id, {
        messageId: row.id,
        conversationId: row.conversation_id,
        deliveredAt: row.delivered_at!,
      });
    });
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

    if (input.replyToMessageId) {
      const target = await MessageModel.findById(input.replyToMessageId);
      if (!target || target.conversation_id !== conversationId) {
        throw new AppError("MESSAGE_VALIDATION", "Invalid reply target.");
      }
      if (target.unsent_at) {
        throw new AppError("MESSAGE_VALIDATION", "Cannot reply to an unsent message.");
      }
    }

    const row = await MessageModel.create({
      conversationId,
      senderId: userId,
      body,
      imageUrl,
      replyToMessageId: input.replyToMessageId ?? null,
    });
    await ConversationModel.touchLastMessage(conversationId, row.created_at);
    // Restore inbox for recipient when they previously deleted the chat (old messages stay deleted).
    await ConversationModel.clearHidden(conversationId, otherId);

    const withReply = await MessageModel.findByIdWithReply(row.id);
    if (!withReply) throw new AppError("MESSAGE_NOT_FOUND", "Message not found after send.");
    const view = await rowToView(withReply, userId);
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
      const withReply = await MessageModel.findByIdWithReply(messageId);
      if (!withReply) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");
      return rowToView(withReply, userId);
    }

    const { row, removedPin } = await db.transaction(async (trx) => {
      const updated = await MessageModel.markUnsent(messageId, userId, trx);
      if (!updated) return { row: undefined, removedPin: false };
      return {
        row: updated,
        removedPin: await MessagePinService.deletePinForUnsentMessage(messageId, trx),
      };
    });
    if (!row) throw new AppError("MESSAGE_NOT_FOUND", "Message not found or already unsent.");
    const withReply = await MessageModel.findByIdWithReply(row.id);
    if (!withReply) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");
    const view = await rowToView(withReply, userId);
    await publishRealtime(async () => {
      await MessageRealtime.messageUnsent(conversation, view);
      if (removedPin) {
        const targets = await MessagePinService.listPinnedMessagesForParticipants(conversation);
        await MessageRealtime.messagePinsUpdated(conversation, targets);
      }
    });
    return view;
  }

  static async edit(userId: string, messageId: string, raw: unknown): Promise<MessageView> {
    const existing = await MessageModel.findById(messageId);
    if (!existing) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");

    const conversation = await ConversationModel.findById(existing.conversation_id);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);

    if (existing.sender_id !== userId) {
      throw new AppError("MESSAGE_FORBIDDEN", "You can only edit your own messages.");
    }
    if (existing.unsent_at) {
      throw new AppError("MESSAGE_VALIDATION", "Cannot edit an unsent message.");
    }
    if (!existing.body?.trim()) {
      throw new AppError("MESSAGE_VALIDATION", "This message has no text to edit.");
    }

    const input = editMessageSchema.parse(raw);
    const trimmed = input.body.trim();
    if (!existing.image_url && !trimmed) {
      throw new AppError("MESSAGE_VALIDATION", "Message body cannot be empty.");
    }

    const newBody = trimmed || null;
    const summaries = await MessageReactionModel.summariesForMessages([messageId], userId);
    const currentSummary = summaries.get(messageId) ?? emptyReactionSummary();

    if ((existing.body ?? "") === (newBody ?? "")) {
      return toMessageView(existing, currentSummary);
    }

    const row = await MessageModel.updateBody(messageId, userId, newBody);
    if (!row) throw new AppError("MESSAGE_NOT_FOUND", "Message not found or already unsent.");
    const view = toMessageView(row, currentSummary);
    await publishRealtime(() => MessageRealtime.messageEdited(conversation, view));
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
    const targets = await this.reactionViewsForParticipants(conversation, message.id);
    const viewerView =
      targets.find((t) => t.userId === userId)?.message ??
      (await this.viewForMessage(message.id, userId));
    await publishRealtime(async () => {
      await MessageRealtime.messageReaction(conversation, targets, userId);
      if (message.sender_id !== userId) {
        await MessageRealtime.unreadCountForUser(message.sender_id);
      }
    });
    return viewerView;
  }

  static async clearReaction(userId: string, messageId: string): Promise<MessageView> {
    const { message, conversation } = await this.requireMessageAccess(userId, messageId);
    if (message.unsent_at) {
      throw new AppError("MESSAGE_VALIDATION", "Cannot react to an unsent message.");
    }
    await MessageReactionModel.delete(userId, messageId);
    const targets = await this.reactionViewsForParticipants(conversation, message.id);
    const viewerView =
      targets.find((t) => t.userId === userId)?.message ??
      (await this.viewForMessage(message.id, userId));
    await publishRealtime(async () => {
      await MessageRealtime.messageReaction(conversation, targets, userId);
      if (message.sender_id !== userId) {
        await MessageRealtime.unreadCountForUser(message.sender_id);
      }
    });
    return viewerView;
  }

  static async markRead(userId: string, conversationId: string): Promise<{ ok: true }> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);
    const updated = await ConversationModel.markRead(conversationId, userId, new Date());
    if (!updated) return { ok: true };

    const readerLastReadAt = lastReadAt(updated, userId);
    const notifyId = peerId(updated, userId);

    await publishRealtime(async () => {
      await MessageRealtime.conversationRead(updated, userId);
      if (readerLastReadAt) {
        MessageRealtime.conversationPeerRead(notifyId, {
          conversationId: updated.id,
          readerId: userId,
          peerLastReadAt: readerLastReadAt,
        });
      }
    });
    return { ok: true };
  }

  static async unreadCount(userId: string): Promise<{ unread: number }> {
    const unread = await ConversationModel.countUnreadConversations(userId);
    return { unread };
  }

  static async deleteConversationForUser(
    userId: string,
    conversationId: string
  ): Promise<{ ok: true }> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);

    const updated = await db.transaction(async (trx) => {
      await MessageUserDeletionModel.markAllInConversationForUser(conversationId, userId, trx);
      return ConversationModel.setHidden(conversationId, userId, new Date(), trx);
    });

    if (!updated) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    await publishRealtime(() => MessageRealtime.conversationHidden(updated, userId));
    return { ok: true };
  }

  private static async requireMessageAccess(userId: string, messageId: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");
    const conversation = await ConversationModel.findById(message.conversation_id);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);
    return { message, conversation };
  }

  private static async viewForMessage(messageId: string, viewerId: string): Promise<MessageView> {
    const withReply = await MessageModel.findByIdWithReply(messageId);
    if (!withReply) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");
    return rowToView(withReply, viewerId);
  }

  private static async reactionViewsForParticipants(
    conversation: ConversationRow,
    messageId: string
  ): Promise<Array<{ userId: string; message: MessageView }>> {
    const withReply = await MessageModel.findByIdWithReply(messageId);
    if (!withReply) throw new AppError("MESSAGE_NOT_FOUND", "Message not found.");
    const userIds = [conversation.user_a, conversation.user_b];
    return Promise.all(
      userIds.map(async (uid) => ({
        userId: uid,
        message: await rowToView(withReply, uid),
      }))
    );
  }

  private static inboxRowToListItem(
    row: ConversationInboxRow,
    lastReaction: ConversationListLastReaction | null,
    viewerId: string,
    mutualFriendIds: ReadonlySet<string>
  ): ConversationListItem {
    const latest = row.lastMessage;
    const messageAt = latest?.created_at ?? null;
    const reactionAt = lastReaction?.reactedAt ?? null;
    const lastSystemLog = toListLastSystemLog(latestThemeLogFromRow(row));
    const systemLogAt = lastSystemLog?.createdAt ?? null;
    const lastPinActivity = toListLastPinActivity(row.latestPinActivity);
    const pinActivityAt = lastPinActivity?.createdAt ?? null;
    const lastActivityAt = latestActivityAt(
      messageAt,
      reactionAt,
      systemLogAt,
      pinActivityAt,
      row.last_message_at
    );
    const peerUserId = peerId(row, viewerId);

    return {
      id: row.id,
      peer: toPublicUser(row.peer),
      peerPresence: mutualFriendIds.has(row.peer.id)
        ? peerPresenceForUser(row.peer.id, row.peer.last_active_at ?? null)
        : null,
      lastMessage: latest ? lastMessageListShape(latest) : null,
      lastReaction,
      lastSystemLog,
      lastPinActivity,
      hasUnreadReaction: hasUnreadPeerReaction(
        lastReaction,
        viewerId,
        peerUserId,
        lastReadAt(row, viewerId)
      ),
      unreadCount: row.unreadCount,
      lastMessageAt: lastActivityAt,
    };
  }

  private static async toListItem(
    row: ConversationRow,
    viewerId: string
  ): Promise<ConversationListItem> {
    const peerUser = await UserModel.findById(peerId(row, viewerId));
    if (!peerUser) throw new AppError("USER_NOT_FOUND", "Peer missing.");
    const latest = await MessageModel.latestForConversation(row.id);
    const latestReactions = await MessageReactionModel.latestByConversations([row.id], viewerId);
    const lastReaction = toListLastReaction(latestReactions.get(row.id) ?? null);
    const unreadCount = await MessageModel.countUnreadInConversation(
      row.id,
      viewerId,
      lastReadAt(row, viewerId)
    );

    const lastSystemLog = toListLastSystemLog(latestThemeLogFromRow(row));

    return {
      id: row.id,
      peer: toPublicUser(peerUser),
      peerPresence: peerPresenceForUser(peerUser.id, peerUser.last_active_at ?? null),
      lastMessage: latest ? lastMessageListShape(latest) : null,
      lastReaction,
      lastSystemLog,
      lastPinActivity: null,
      hasUnreadReaction: hasUnreadPeerReaction(
        lastReaction,
        viewerId,
        peerId(row, viewerId),
        lastReadAt(row, viewerId)
      ),
      unreadCount,
      lastMessageAt: latestActivityAt(
        latest?.created_at ?? null,
        lastReaction?.reactedAt ?? null,
        lastSystemLog?.createdAt ?? null,
        null,
        row.last_message_at
      ),
    };
  }
}
