import { NotificationModel, type NotificationType } from "../models/NotificationModel";
import { UserModel } from "../models/UserModel";
import { FriendshipModel } from "../models/FriendshipModel";
import { PostModel } from "../models/PostModel";
import { NotificationRealtime } from "../realtime/NotificationRealtime";
import { toPublicUser } from "../types/user";
import { AppError } from "../utils/AppError";
import { logger } from "../logger";

async function publishNotificationRealtime(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (err) {
    logger.error({ err }, "Notification realtime publish failed");
  }
}

export type NotificationView = {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  actor: ReturnType<typeof toPublicUser>;
  postId: string | null;
  commentId: string | null;
  postImageId: string | null;
  friendshipId: string | null;
  message: string;
};

const ACTIVITY_TYPES: NotificationType[] = ["comment_on_post", "comment_on_photo", "comment_reply"];

function messageFor(type: NotificationType, actorName: string): string {
  switch (type) {
    case "friend_request":
      return `${actorName} sent you a friend request`;
    case "comment_on_post":
      return `${actorName} commented on your post`;
    case "comment_on_photo":
      return `${actorName} commented on your photo`;
    case "comment_reply":
      return `${actorName} replied to your comment`;
    default:
      return `${actorName} sent a notification`;
  }
}

export class NotificationService {
  static async notify(input: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    postId?: string | null;
    commentId?: string | null;
    postImageId?: string | null;
    friendshipId?: string | null;
  }): Promise<void> {
    if (input.recipientId === input.actorId) return;
    const row = await NotificationModel.create(input);
    await publishNotificationRealtime(() =>
      NotificationRealtime.notificationCreated(input.recipientId, row.id)
    );
  }

  static async list(userId: string): Promise<NotificationView[]> {
    const pendingFriendshipIds = new Set(
      (await FriendshipModel.listIncoming(userId)).map((friendship) => friendship.id)
    );
    const rows = await NotificationModel.listForRecipient(userId);
    const visibleRows = rows.filter(
      (row) => row.type !== "friend_request" || pendingFriendshipIds.has(row.friendship_id ?? "")
    );
    const actors = await Promise.all(visibleRows.map((row) => UserModel.findById(row.actor_id)));
    const items = visibleRows.map((row, index) => {
      const actor = actors[index];
      if (!actor) throw new AppError("USER_NOT_FOUND", "Actor missing.");
      const publicActor = toPublicUser(actor);
      return {
        id: row.id,
        type: row.type,
        isRead: row.is_read,
        createdAt: row.created_at,
        actor: publicActor,
        postId: row.post_id,
        commentId: row.comment_id,
        postImageId: row.post_image_id ?? null,
        friendshipId: row.friendship_id,
        message: messageFor(row.type, publicActor.displayName),
      };
    });
    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async markRead(userId: string, notificationId: string): Promise<void> {
    const updated = await NotificationModel.markRead(userId, notificationId);
    if (updated > 0) {
      await this.publishCountUpdated(userId);
    }
  }

  static async publishCountUpdated(userId: string): Promise<void> {
    await publishNotificationRealtime(() => NotificationRealtime.countUpdated(userId));
  }

  static async counts(userId: string): Promise<{ notifications: number; feed: number }> {
    const unreadActivity = await NotificationModel.countUnread(userId, ACTIVITY_TYPES);
    const unreadFriendRequests = await NotificationModel.countUnreadPendingFriendRequests(userId);
    const feed = await this.unreadFriendPostCount(userId);
    return { notifications: unreadActivity + unreadFriendRequests, feed };
  }

  static async unreadFriendPostCount(userId: string): Promise<number> {
    const user = await UserModel.findById(userId);
    if (!user) return 0;
    const mutualIds = await FriendshipModel.listAcceptedMutualIds(userId);
    if (mutualIds.length === 0) return 0;
    const seenAt = user.feed_seen_at ?? new Date(0);
    return PostModel.countByAuthorsSince(mutualIds, seenAt);
  }

  static async markFeedSeen(userId: string): Promise<void> {
    await UserModel.updateFeedSeenAt(userId, new Date());
  }
}
