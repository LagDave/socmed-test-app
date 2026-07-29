import { db } from "../database/connection";

export type FriendshipStatus = "pending" | "accepted" | "declined";

export type FriendshipRow = {
  id: string;
  user_a: string;
  user_b: string;
  requester_id: string;
  status: FriendshipStatus;
  created_at: Date;
  updated_at: Date;
};

export function orderedPair(userId: string, otherId: string): { userA: string; userB: string } {
  return userId < otherId
    ? { userA: userId, userB: otherId }
    : { userA: otherId, userB: userId };
}

export class FriendshipModel {
  static async findPair(userId: string, otherId: string): Promise<FriendshipRow | undefined> {
    const { userA, userB } = orderedPair(userId, otherId);
    return db<FriendshipRow>("friendships").where({ user_a: userA, user_b: userB }).first();
  }

  static async createPending(requesterId: string, targetId: string): Promise<FriendshipRow> {
    const { userA, userB } = orderedPair(requesterId, targetId);
    const [row] = await db<FriendshipRow>("friendships")
      .insert({
        user_a: userA,
        user_b: userB,
        requester_id: requesterId,
        status: "pending",
      })
      .returning("*");
    return row;
  }

  static async updateStatus(id: string, status: FriendshipStatus): Promise<FriendshipRow | undefined> {
    const [row] = await db<FriendshipRow>("friendships").where({ id }).update({ status }).returning("*");
    return row;
  }

  static async deleteById(id: string): Promise<number> {
    return db("friendships").where({ id }).del();
  }

  static async listIncoming(userId: string): Promise<FriendshipRow[]> {
    return db<FriendshipRow>("friendships")
      .where({ status: "pending" })
      .andWhere((q) => q.where({ user_a: userId }).orWhere({ user_b: userId }))
      .andWhereNot({ requester_id: userId });
  }

  static async listOutgoing(userId: string): Promise<FriendshipRow[]> {
    return db<FriendshipRow>("friendships").where({ status: "pending", requester_id: userId });
  }

  static async listAcceptedMutualIds(userId: string): Promise<string[]> {
    const rows = await db<FriendshipRow>("friendships")
      .where({ status: "accepted" })
      .andWhere((q) => q.where({ user_a: userId }).orWhere({ user_b: userId }));
    return rows.map((r) => (r.user_a === userId ? r.user_b : r.user_a));
  }

  static async areFriends(userId: string, otherId: string): Promise<boolean> {
    if (userId === otherId) return false;
    const row = await this.findPair(userId, otherId);
    return row?.status === "accepted";
  }
}
