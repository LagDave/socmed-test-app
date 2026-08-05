import type { Knex } from "knex";
import { db } from "../database/connection";

type MessagePinRow = {
  id: string;
  message_id: string;
  conversation_id: string;
  pinned_by: string;
  pinned_at: Date;
};

export type PinnedMessageRow = {
  message_id: string;
  body: string | null;
  image_url: string | null;
  sender_id: string;
  sender_display_name: string;
  sender_avatar_url: string | null;
  created_at: Date;
  pinned_by: string;
  pinned_at: Date;
};

export class MessagePinModel {
  static async create(
    input: { messageId: string; conversationId: string; pinnedBy: string },
    trx: Knex = db
  ): Promise<boolean> {
    const rows = await trx<MessagePinRow>("message_pins")
      .insert({
        message_id: input.messageId,
        conversation_id: input.conversationId,
        pinned_by: input.pinnedBy,
      })
      .onConflict("message_id")
      .ignore()
      .returning("id");
    return rows.length > 0;
  }

  static async deleteForMessage(messageId: string, trx: Knex = db): Promise<boolean> {
    const deleted = await trx<MessagePinRow>("message_pins").where({ message_id: messageId }).delete();
    return deleted > 0;
  }

  static async listForConversation(
    conversationId: string,
    viewerId: string
  ): Promise<PinnedMessageRow[]> {
    return db("message_pins as p")
      .select<PinnedMessageRow[]>(
        "m.id as message_id",
        "m.body",
        "m.image_url",
        "m.sender_id",
        "sender.display_name as sender_display_name",
        "sender.avatar_url as sender_avatar_url",
        "m.created_at",
        "p.pinned_by",
        "p.pinned_at"
      )
      .innerJoin("messages as m", "m.id", "p.message_id")
      .innerJoin("users as sender", "sender.id", "m.sender_id")
      .where("p.conversation_id", conversationId)
      .whereNull("m.unsent_at")
      .whereNotExists(function () {
        this.select(1)
          .from("message_user_deletions as d")
          .whereRaw("d.message_id = m.id")
          .andWhere("d.user_id", viewerId);
      })
      .orderBy("p.pinned_at", "desc")
      .orderBy("p.id", "desc");
  }
}
