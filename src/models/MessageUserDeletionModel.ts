import type { Knex } from "knex";
import { db } from "../database/connection";

export class MessageUserDeletionModel {
  static async isDeletedForUser(messageId: string, userId: string): Promise<boolean> {
    const row = await db("message_user_deletions")
      .where({ message_id: messageId, user_id: userId })
      .first();
    return Boolean(row);
  }

  /** Mark every message in a conversation deleted for one participant. */
  static async markAllInConversationForUser(
    conversationId: string,
    userId: string,
    trx: Knex = db
  ): Promise<void> {
    await trx.raw(
      `
      INSERT INTO message_user_deletions (message_id, user_id)
      SELECT m.id, ?
      FROM messages m
      WHERE m.conversation_id = ?
      ON CONFLICT (message_id, user_id) DO NOTHING
      `,
      [userId, conversationId]
    );
  }
}
