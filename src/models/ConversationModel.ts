import { db } from "../database/connection";
import { orderedPair } from "./FriendshipModel";

export type ConversationRow = {
  id: string;
  user_a: string;
  user_b: string;
  user_a_last_read_at: Date | null;
  user_b_last_read_at: Date | null;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export class ConversationModel {
  static async findById(id: string): Promise<ConversationRow | undefined> {
    return db<ConversationRow>("conversations").where({ id }).first();
  }

  static async findPair(userId: string, otherId: string): Promise<ConversationRow | undefined> {
    const { userA, userB } = orderedPair(userId, otherId);
    return db<ConversationRow>("conversations").where({ user_a: userA, user_b: userB }).first();
  }

  static async createPair(userId: string, otherId: string): Promise<ConversationRow> {
    const { userA, userB } = orderedPair(userId, otherId);
    const [row] = await db<ConversationRow>("conversations")
      .insert({ user_a: userA, user_b: userB })
      .returning("*");
    return row;
  }

  static async listForUser(userId: string): Promise<ConversationRow[]> {
    return db<ConversationRow>("conversations")
      .where((q) => q.where({ user_a: userId }).orWhere({ user_b: userId }))
      .orderByRaw("last_message_at desc nulls last")
      .orderBy("created_at", "desc");
  }

  static async touchLastMessage(id: string, at: Date): Promise<void> {
    await db("conversations").where({ id }).update({
      last_message_at: at,
      updated_at: db.fn.now(),
    });
  }

  static async markRead(id: string, userId: string, at: Date): Promise<ConversationRow | undefined> {
    const row = await this.findById(id);
    if (!row) return undefined;
    const patch =
      row.user_a === userId
        ? { user_a_last_read_at: at }
        : row.user_b === userId
          ? { user_b_last_read_at: at }
          : null;
    if (!patch) return undefined;
    const [updated] = await db<ConversationRow>("conversations")
      .where({ id })
      .update({ ...patch, updated_at: db.fn.now() })
      .returning("*");
    return updated;
  }
}
