import { db } from "../database/connection";

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  unsent_at: Date | null;
  delivered_at: Date | null;
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
    opts: { limit: number; before?: string }
  ): Promise<MessageRow[]> {
    let q = db<MessageRow>("messages")
      .where({ conversation_id: conversationId })
      .orderBy("created_at", "desc")
      .limit(opts.limit);

    if (opts.before) {
      const before = await this.findById(opts.before);
      if (before && before.conversation_id === conversationId) {
        q = q.andWhere("created_at", "<", before.created_at);
      }
    }

    const rows = await q;
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

  static async markDelivered(id: string): Promise<MessageRow | undefined> {
    const [row] = await db<MessageRow>("messages")
      .where({ id })
      .whereNull("delivered_at")
      .whereNull("unsent_at")
      .update({ delivered_at: db.fn.now() })
      .returning("*");
    return row;
  }

  /** Marks peer-sent messages as delivered when the viewer loads the thread. */
  static async markInboundUndeliveredAsDelivered(
    conversationId: string,
    viewerId: string
  ): Promise<MessageRow[]> {
    return db<MessageRow>("messages")
      .where({ conversation_id: conversationId })
      .whereNot({ sender_id: viewerId })
      .whereNull("delivered_at")
      .whereNull("unsent_at")
      .update({ delivered_at: db.fn.now() })
      .returning("*");
  }

  static async countUnreadInConversation(
    conversationId: string,
    viewerId: string,
    lastReadAt: Date | null
  ): Promise<number> {
    let q = db("messages")
      .where({ conversation_id: conversationId })
      .whereNot({ sender_id: viewerId })
      .whereNull("unsent_at");
    if (lastReadAt) {
      q = q.andWhere("created_at", ">", lastReadAt);
    }
    const result = await q.count<{ count: string }>("* as count").first();
    return Number(result?.count ?? 0);
  }
}
