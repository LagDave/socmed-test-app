import { db } from "../database/connection";

export type NotificationType =
  | "friend_request"
  | "comment_on_post"
  | "comment_on_photo"
  | "comment_reply";

export type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  post_image_id: string | null;
  friendship_id: string | null;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
};

export class NotificationModel {
  static async create(input: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    postId?: string | null;
    commentId?: string | null;
    postImageId?: string | null;
    friendshipId?: string | null;
  }): Promise<NotificationRow> {
    const [row] = await db<NotificationRow>("notifications")
      .insert({
        recipient_id: input.recipientId,
        actor_id: input.actorId,
        type: input.type,
        post_id: input.postId ?? null,
        comment_id: input.commentId ?? null,
        post_image_id: input.postImageId ?? null,
        friendship_id: input.friendshipId ?? null,
        is_read: false,
      })
      .returning("*");
    return row;
  }

  static async listForRecipient(recipientId: string, limit = 50): Promise<NotificationRow[]> {
    return db<NotificationRow>("notifications")
      .where({ recipient_id: recipientId })
      .orderBy("created_at", "desc")
      .limit(limit);
  }

  static async countUnread(recipientId: string, types?: NotificationType[]): Promise<number> {
    let q = db("notifications").where({ recipient_id: recipientId, is_read: false });
    if (types && types.length > 0) {
      q = q.whereIn("type", types);
    }
    const row = await q.count<{ count: string }>("id as count").first();
    return Number(row?.count || 0);
  }

  static async countUnreadPendingFriendRequests(recipientId: string): Promise<number> {
    const row = await db("notifications as notification")
      .innerJoin("friendships as friendship", "friendship.id", "notification.friendship_id")
      .where({
        "notification.recipient_id": recipientId,
        "notification.type": "friend_request",
        "notification.is_read": false,
        "friendship.status": "pending",
      })
      .whereNot("friendship.requester_id", recipientId)
      .count<{ count: string }>("notification.id as count")
      .first();
    return Number(row?.count || 0);
  }

  static async markRead(recipientId: string, notificationId: string): Promise<number> {
    return db("notifications")
      .where({ id: notificationId, recipient_id: recipientId, is_read: false })
      .update({ is_read: true });
  }

}
