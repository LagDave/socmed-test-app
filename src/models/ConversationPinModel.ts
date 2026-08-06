import type { Knex } from "knex";
import { db } from "../database/connection";

type ConversationPinRow = { id: string; conversation_id: string; user_id: string; pinned_at: Date };

export class ConversationPinModel {
  static async create(conversationId: string, userId: string, trx: Knex = db): Promise<boolean> {
    const rows = await trx<ConversationPinRow>("conversation_pins").insert({
      conversation_id: conversationId, user_id: userId,
    }).onConflict(["conversation_id", "user_id"]).ignore().returning("id");
    return rows.length > 0;
  }
  static async deleteForUser(conversationId: string, userId: string, trx: Knex = db): Promise<boolean> {
    return (await trx<ConversationPinRow>("conversation_pins").where({
      conversation_id: conversationId, user_id: userId,
    }).delete()) > 0;
  }
  static async isPinnedForUser(conversationId: string, userId: string): Promise<boolean> {
    return Boolean(await db<ConversationPinRow>("conversation_pins").where({
      conversation_id: conversationId, user_id: userId,
    }).first("id"));
  }
}
