import type { Knex } from "knex";
import { db } from "../database/connection";
import type { ReactionEmoji } from "./ReactionModel";

export type NotificationType =
  | "friend_request"
  | "comment_on_post"
  | "comment_on_photo"
  | "comment_reply"
  | "reaction_on_post"
  | "reaction_on_comment"
  | "reaction_on_photo"
  | "post_shared";

export type ReactionNotificationType =
  | "reaction_on_post"
  | "reaction_on_comment"
  | "reaction_on_photo";

export const ACTIVITY_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "comment_on_post",
  "comment_on_photo",
  "comment_reply",
  "reaction_on_post",
  "reaction_on_comment",
  "reaction_on_photo",
  "post_shared",
];

export type ReactionNotificationTarget = {
  recipientId: string;
  actorId: string;
  type: ReactionNotificationType;
  postId: string;
  commentId?: string | null;
  postImageId?: string | null;
};

export type ReactionNotificationInput = ReactionNotificationTarget & {
  reactionEmoji: ReactionEmoji;
};

export type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  post_image_id: string | null;
  friendship_id: string | null;
  reaction_emoji: ReactionEmoji | null;
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
  }, trx?: Knex.Transaction): Promise<NotificationRow> {
    const conn = trx ?? db;
    const [row] = await conn<NotificationRow>("notifications")
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

  static async upsertReaction(
    input: ReactionNotificationInput,
    trx?: Knex.Transaction
  ): Promise<NotificationRow> {
    const conn = trx ?? db;
    const [row] = await conn<NotificationRow>("notifications")
      .insert({
        recipient_id: input.recipientId,
        actor_id: input.actorId,
        type: input.type,
        post_id: input.postId,
        comment_id: input.commentId ?? null,
        post_image_id: input.postImageId ?? null,
        friendship_id: null,
        reaction_emoji: input.reactionEmoji,
        is_read: false,
      })
      .onConflict(conn.raw(reactionConflictTarget(input.type)))
      .merge({ reaction_emoji: input.reactionEmoji, updated_at: conn.fn.now() })
      .returning("*");
    return row;
  }

  static async deleteReaction(
    input: ReactionNotificationTarget,
    trx?: Knex.Transaction
  ): Promise<number> {
    const conn = trx ?? db;
    const query = conn("notifications").where({
      recipient_id: input.recipientId,
      actor_id: input.actorId,
      type: input.type,
    });

    switch (input.type) {
      case "reaction_on_post":
        return query.andWhere({ post_id: input.postId }).del();
      case "reaction_on_comment":
        return query.andWhere({ comment_id: input.commentId }).del();
      case "reaction_on_photo":
        return query.andWhere({ post_image_id: input.postImageId }).del();
    }
  }

  static async listForRecipient(recipientId: string, limit = 50): Promise<NotificationRow[]> {
    return db<NotificationRow>("notifications")
      .where({ recipient_id: recipientId })
      .orderBy("created_at", "desc")
      .limit(limit);
  }

  static async countUnread(
    recipientId: string,
    types?: readonly NotificationType[]
  ): Promise<number> {
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

function reactionConflictTarget(type: ReactionNotificationType): string {
  switch (type) {
    case "reaction_on_post":
      return "(recipient_id, actor_id, type, post_id) WHERE type = 'reaction_on_post' AND post_id IS NOT NULL";
    case "reaction_on_comment":
      return "(recipient_id, actor_id, type, comment_id) WHERE type = 'reaction_on_comment' AND comment_id IS NOT NULL";
    case "reaction_on_photo":
      return "(recipient_id, actor_id, type, post_image_id) WHERE type = 'reaction_on_photo' AND post_image_id IS NOT NULL";
  }
}
