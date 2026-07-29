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
}
