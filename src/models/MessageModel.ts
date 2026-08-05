import type { Knex } from "knex";
import { db } from "../database/connection";

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  unsent_at: Date | null;
  edited_at: Date | null;
  reply_to_message_id: string | null;
  delivered_at: Date | null;
  created_at: Date;
};

export type MessageReplyContext = {
  id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  unsent_at: Date | null;
  sender_display_name: string;
};

export type MessageRowWithReply = MessageRow & {
  replyContext: MessageReplyContext | null;
};

type MessageListQueryRow = MessageRow & {
  reply_id: string | null;
  reply_sender_id: string | null;
  reply_body: string | null;
  reply_image_url: string | null;
  reply_unsent_at: Date | null;
  reply_sender_display_name: string | null;
};

function mapListRow(row: MessageListQueryRow): MessageRowWithReply {
  const replyContext =
    row.reply_to_message_id && row.reply_id && row.reply_sender_id && row.reply_sender_display_name
      ? {
          id: row.reply_id,
          sender_id: row.reply_sender_id,
          body: row.reply_body,
          image_url: row.reply_image_url,
          unsent_at: row.reply_unsent_at,
          sender_display_name: row.reply_sender_display_name,
        }
      : null;

  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    body: row.body,
    image_url: row.image_url,
    unsent_at: row.unsent_at,
    edited_at: row.edited_at,
    reply_to_message_id: row.reply_to_message_id,
    delivered_at: row.delivered_at,
    created_at: row.created_at,
    replyContext,
  };
}

function escapeLikePattern(query: string): string {
  return query.replace(/[\\%_]/g, "\\$&");
}

export class MessageModel {
  static async findById(id: string): Promise<MessageRow | undefined> {
    return db<MessageRow>("messages").where({ id }).first();
  }

  static async findByIdWithReply(id: string): Promise<MessageRowWithReply | undefined> {
    const rows = await this.listWithReplyContext("", { limit: 1, ids: [id] });
    return rows[0];
  }

  static async create(input: {
    conversationId: string;
    senderId: string;
    body: string | null;
    imageUrl: string | null;
    replyToMessageId?: string | null;
  }): Promise<MessageRow> {
    const [row] = await db<MessageRow>("messages")
      .insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        body: input.body,
        image_url: input.imageUrl,
        reply_to_message_id: input.replyToMessageId ?? null,
      })
      .returning("*");
    return row;
  }

  static async listByConversation(
    conversationId: string,
    opts: { limit: number; before?: string; viewerId?: string }
  ): Promise<MessageRowWithReply[]> {
    return this.listWithReplyContext(conversationId, opts);
  }

  static async searchByConversation(
    conversationId: string,
    viewerId: string,
    query: string,
    limit: number
  ): Promise<MessageRowWithReply[]> {
    const pattern = `%${escapeLikePattern(query)}%`;
    const rows = await db<MessageListQueryRow>("messages as m")
      .select(
        "m.*",
        "parent.id as reply_id",
        "parent.sender_id as reply_sender_id",
        "parent.body as reply_body",
        "parent.image_url as reply_image_url",
        "parent.unsent_at as reply_unsent_at",
        "parent_user.display_name as reply_sender_display_name"
      )
      .leftJoin("messages as parent", "parent.id", "m.reply_to_message_id")
      .leftJoin("users as parent_user", "parent_user.id", "parent.sender_id")
      .where("m.conversation_id", conversationId)
      .whereNull("m.unsent_at")
      .whereNotNull("m.body")
      .whereILike("m.body", pattern)
      .whereNotExists(function () {
        this.select(1)
          .from("message_user_deletions as d")
          .whereRaw("d.message_id = m.id")
          .andWhere("d.user_id", viewerId);
      })
      .orderBy("m.created_at", "desc")
      .limit(limit);

    return rows.map(mapListRow);
  }

  private static async listWithReplyContext(
    conversationId: string,
    opts: { limit: number; before?: string; ids?: string[]; viewerId?: string }
  ): Promise<MessageRowWithReply[]> {
    let q = db<MessageListQueryRow>("messages as m")
      .select(
        "m.*",
        "parent.id as reply_id",
        "parent.sender_id as reply_sender_id",
        "parent.body as reply_body",
        "parent.image_url as reply_image_url",
        "parent.unsent_at as reply_unsent_at",
        "parent_user.display_name as reply_sender_display_name"
      )
      .leftJoin("messages as parent", "parent.id", "m.reply_to_message_id")
      .leftJoin("users as parent_user", "parent_user.id", "parent.sender_id")
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

    if (opts.ids?.length) {
      q = q.whereIn("m.id", opts.ids);
    } else {
      q = q.where("m.conversation_id", conversationId);
    }

    if (opts.before && !opts.ids?.length) {
      const before = await this.findById(opts.before);
      if (before && before.conversation_id === conversationId) {
        q = q.andWhere("m.created_at", "<", before.created_at);
      }
    }

    const rows = await q;
    return rows.reverse().map(mapListRow);
  }

  static async markUnsent(
    id: string,
    senderId: string,
    trx: Knex = db
  ): Promise<MessageRow | undefined> {
    const [row] = await trx<MessageRow>("messages")
      .where({ id, sender_id: senderId })
      .whereNull("unsent_at")
      .update({
        unsent_at: trx.fn.now(),
        body: null,
        image_url: null,
      })
      .returning("*");
    return row;
  }

  static async updateBody(
    id: string,
    senderId: string,
    body: string | null
  ): Promise<MessageRow | undefined> {
    const [row] = await db<MessageRow>("messages")
      .where({ id, sender_id: senderId })
      .whereNull("unsent_at")
      .update({
        body,
        edited_at: db.fn.now(),
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
