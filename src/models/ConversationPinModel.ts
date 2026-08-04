import type { Knex } from "knex";
import { db } from "../database/connection";

type ConversationPinRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  pinned_at: Date;
};

export class ConversationPinModel {
  static async create(conversationId: string, userId: string): Promise<void> {
    await db<ConversationPinRow>("conversation_pins")
      .insert({ conversation_id: conversationId, user_id: userId })
      .onConflict(["conversation_id", "user_id"])
      .ignore();
  }

  static async isPinned(conversationId: string, userId: string): Promise<boolean> {
    const row = await db<ConversationPinRow>("conversation_pins")
      .where({ conversation_id: conversationId, user_id: userId })
      .first();
    return Boolean(row);
  }

  static async deleteForUser(
    conversationId: string,
    userId: string,
    trx: Knex = db
  ): Promise<void> {
    await trx<ConversationPinRow>("conversation_pins")
      .where({ conversation_id: conversationId, user_id: userId })
      .delete();
  }
}
