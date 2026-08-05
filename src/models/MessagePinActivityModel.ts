import type { Knex } from "knex";
import { db } from "../database/connection";

export type MessagePinActivityAction = "pinned" | "unpinned";

export type MessagePinActivityRow = {
  id: string;
  conversation_id: string;
  message_id: string;
  actor_id: string;
  action: MessagePinActivityAction;
  created_at: Date;
};

export type MessagePinActivityWithActorRow = MessagePinActivityRow & {
  actor_display_name: string;
};

export class MessagePinActivityModel {
  static async create(
    input: {
      conversationId: string;
      messageId: string;
      actorId: string;
      action: MessagePinActivityAction;
    },
    trx: Knex = db
  ): Promise<MessagePinActivityRow> {
    const [row] = await trx<MessagePinActivityRow>("message_pin_activities")
      .insert({
        conversation_id: input.conversationId,
        message_id: input.messageId,
        actor_id: input.actorId,
        action: input.action,
      })
      .returning("*");
    return row;
  }

  static async listForConversation(
    conversationId: string,
    viewerId: string,
    limit: number
  ): Promise<MessagePinActivityWithActorRow[]> {
    const rows = await db("message_pin_activities as a")
      .select<MessagePinActivityWithActorRow[]>("a.*", "actor.display_name as actor_display_name")
      .innerJoin("messages as m", "m.id", "a.message_id")
      .innerJoin("users as actor", "actor.id", "a.actor_id")
      .where("a.conversation_id", conversationId)
      .whereNull("m.unsent_at")
      .whereNotExists(function () {
        this.select(1)
          .from("message_user_deletions as d")
          .whereRaw("d.message_id = a.message_id")
          .andWhere("d.user_id", viewerId);
      })
      .orderBy("a.created_at", "desc")
      .limit(limit);
    return rows.reverse();
  }
}
