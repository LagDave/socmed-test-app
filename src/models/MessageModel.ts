import { db } from "../database/connection";

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  unsent_at: Date | null;
  created_at: Date;
};

export class MessageModel {
  static async findById(id: string): Promise<MessageRow | undefined> {
    return db<MessageRow>("messages").where({ id }).first();
  }

  static async create(input: {
    conversationId: string;
    senderId: string;
    body: string | null;
    imageUrl: string | null;
  }): Promise<MessageRow> {
    const [row] = await db<MessageRow>("messages")
      .insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        body: input.body,
        image_url: input.imageUrl,
      })
      .returning("*");
    return row;
  }

  static async listByConversation(
    conversationId: string,
    opts: { limit: number; before?: string; viewerId?: string }
  ): Promise<MessageRow[]> {
    let q = db("messages as m")
      .where("m.conversation_id", conversationId)
      .orderBy("m.created_at", "desc")
      .limit(opts.limit);

    if (opts.viewerId) {
      q = q.whereNotExists(function () {
        this.select(1)
          .from("message_user_deletions as d")
          .whereRaw("d.message_id = m.id")
          .andWhere("d.user_id", opts.viewerId!);
      });
    }

    if (opts.before) {
      const before = await this.findById(opts.before);
      if (before && before.conversation_id === conversationId) {
        q = q.andWhere("m.created_at", "<", before.created_at);
      }
    }

    const rows = (await q.select(
      "m.id",
      "m.conversation_id",
      "m.sender_id",
      "m.body",
      "m.image_url",
      "m.unsent_at",
      "m.created_at"
    )) as MessageRow[];
    return rows.reverse();
  }

  static async markUnsent(id: string, senderId: string): Promise<MessageRow | undefined> {
    const [row] = await db<MessageRow>("messages")
      .where({ id, sender_id: senderId })
      .whereNull("unsent_at")
      .update({
        unsent_at: db.fn.now(),
        body: null,
        image_url: null,
      })
      .returning("*");
    return row;
  }

  static async latestForConversation(conversationId: string): Promise<MessageRow | undefined> {
    return db<MessageRow>("messages")
      .where({ conversation_id: conversationId })
      .orderBy("created_at", "desc")
      .first();
  }

  static async countUnreadInConversation(
    conversationId: string,
    viewerId: string,
    lastReadAt: Date | null
  ): Promise<number> {
    let q = db("messages as m")
      .where({ "m.conversation_id": conversationId })
      .whereNot({ "m.sender_id": viewerId })
      .whereNull("m.unsent_at")
      .whereNotExists(function () {
        this.select(1)
          .from("message_user_deletions as d")
          .whereRaw("d.message_id = m.id")
          .andWhere("d.user_id", viewerId);
      });
    if (lastReadAt) {
      q = q.andWhere("m.created_at", ">", lastReadAt);
    }
    const result = await q.count<{ count: string }>("* as count").first();
    return Number(result?.count ?? 0);
  }
}
