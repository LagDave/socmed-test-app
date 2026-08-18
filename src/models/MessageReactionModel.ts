import { db } from "../database/connection";
import {
  REACTION_EMOJIS,
  emptyReactionSummary,
  type ReactionEmoji,
  type ReactionSummary,
} from "./ReactionModel";

export type MessageReactionRow = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: Date;
  updated_at: Date;
};

type AggregateRow = {
  message_id: string;
  emoji: ReactionEmoji;
  count: string | number;
};

export type ConversationLatestReaction = {
  conversationId: string;
  emoji: ReactionEmoji;
  reactorId: string;
  reactedAt: Date;
  messageId: string;
  messageSenderId: string;
  messageBody: string | null;
  messageImageUrl: string | null;
};

type LatestReactionRow = {
  conversation_id: string;
  emoji: ReactionEmoji;
  reactor_id: string;
  reacted_at: Date;
  message_id: string;
  message_sender_id: string;
  message_body: string | null;
  message_image_url: string | null;
};

export class MessageReactionModel {
  static async upsert(
    userId: string,
    messageId: string,
    emoji: ReactionEmoji
  ): Promise<MessageReactionRow> {
    const [row] = await db<MessageReactionRow>("message_reactions")
      .insert({ message_id: messageId, user_id: userId, emoji })
      .onConflict(["message_id", "user_id"])
      .merge({ emoji, updated_at: db.fn.now() })
      .returning("*");
    return row;
  }

  static async delete(userId: string, messageId: string): Promise<number> {
    return db("message_reactions").where({ user_id: userId, message_id: messageId }).del();
  }

  static async summariesForMessages(
    messageIds: string[],
    viewerId: string
  ): Promise<Map<string, ReactionSummary>> {
    const map = new Map<string, ReactionSummary>();
    for (const id of messageIds) map.set(id, emptyReactionSummary());
    if (messageIds.length === 0) return map;

    const aggregates = await db("message_reactions")
      .whereIn("message_id", messageIds)
      .select("message_id", "emoji")
      .count("* as count")
      .groupBy("message_id", "emoji");

    for (const row of aggregates as AggregateRow[]) {
      const summary = map.get(row.message_id) ?? emptyReactionSummary();
      if ((REACTION_EMOJIS as readonly string[]).includes(row.emoji)) {
        summary.counts[row.emoji] = Number(row.count);
      }
      map.set(row.message_id, summary);
    }

    const viewerRows = await db<MessageReactionRow>("message_reactions")
      .whereIn("message_id", messageIds)
      .andWhere({ user_id: viewerId })
      .select("message_id", "emoji");

    for (const row of viewerRows) {
      const summary = map.get(row.message_id) ?? emptyReactionSummary();
      summary.viewerEmoji = row.emoji;
      map.set(row.message_id, summary);
    }

    return map;
  }

  /** Latest reaction per conversation (for inbox preview), respecting viewer message visibility. */
  static async latestByConversations(
    conversationIds: string[],
    viewerId: string
  ): Promise<Map<string, ConversationLatestReaction>> {
    const map = new Map<string, ConversationLatestReaction>();
    if (conversationIds.length === 0) return map;

    const result = await db.raw<{ rows: LatestReactionRow[] }>(
      `
      SELECT DISTINCT ON (m.conversation_id)
        m.conversation_id,
        mr.emoji,
        mr.user_id AS reactor_id,
        mr.updated_at AS reacted_at,
        m.id AS message_id,
        m.sender_id AS message_sender_id,
        m.body AS message_body,
        m.image_url AS message_image_url
      FROM message_reactions mr
      INNER JOIN messages m ON m.id = mr.message_id
      WHERE m.conversation_id = ANY(?::uuid[])
        AND m.unsent_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM message_user_deletions d
          WHERE d.message_id = m.id AND d.user_id = ?
        )
      ORDER BY m.conversation_id, mr.updated_at DESC
      `,
      [conversationIds, viewerId]
    );

    for (const row of result.rows) {
      if (!(REACTION_EMOJIS as readonly string[]).includes(row.emoji)) continue;
      map.set(row.conversation_id, {
        conversationId: row.conversation_id,
        emoji: row.emoji,
        reactorId: row.reactor_id,
        reactedAt: row.reacted_at,
        messageId: row.message_id,
        messageSenderId: row.message_sender_id,
        messageBody: row.message_body,
        messageImageUrl: row.message_image_url,
      });
    }

    return map;
  }
}
