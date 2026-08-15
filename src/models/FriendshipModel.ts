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

export type SuggestedFriendRow = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  mutual_friend_count: number;
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

  static async listSuggestedFriends(userId: string, limit: number): Promise<SuggestedFriendRow[]> {
    const result = await db.raw<{ rows: SuggestedFriendRow[] }>(
      `
        WITH my_friends AS (
          SELECT CASE WHEN user_a = ? THEN user_b ELSE user_a END AS friend_id
          FROM friendships
          WHERE status = 'accepted'
            AND (? = user_a OR ? = user_b)
        ),
        candidates AS (
          SELECT CASE
            WHEN candidate_friendship.user_a = my_friends.friend_id THEN candidate_friendship.user_b
            ELSE candidate_friendship.user_a
          END AS candidate_id
          FROM friendships AS candidate_friendship
          INNER JOIN my_friends
            ON candidate_friendship.user_a = my_friends.friend_id
            OR candidate_friendship.user_b = my_friends.friend_id
          WHERE candidate_friendship.status = 'accepted'
            AND candidate_friendship.user_a <> ?
            AND candidate_friendship.user_b <> ?
        )
        SELECT
          users.id,
          users.display_name,
          users.username,
          users.avatar_url,
          COUNT(*)::int AS mutual_friend_count
        FROM candidates
        INNER JOIN users ON users.id = candidates.candidate_id
        WHERE users.username IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM friendships AS existing_friendship
            WHERE existing_friendship.status IN ('accepted', 'pending')
              AND (
                (existing_friendship.user_a = ? AND existing_friendship.user_b = candidates.candidate_id)
                OR (existing_friendship.user_b = ? AND existing_friendship.user_a = candidates.candidate_id)
              )
          )
        GROUP BY users.id, users.display_name, users.username, users.avatar_url
        ORDER BY mutual_friend_count DESC, lower(users.display_name) ASC, users.id ASC
        LIMIT ?
      `,
      [userId, userId, userId, userId, userId, userId, userId, limit]
    );
    return result.rows;
  }

  static async areFriends(userId: string, otherId: string): Promise<boolean> {
    if (userId === otherId) return false;
    const row = await this.findPair(userId, otherId);
    return row?.status === "accepted";
  }
}
