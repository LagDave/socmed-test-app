import { FriendshipModel } from "../models/FriendshipModel";
import { NotificationModel, type NotificationType } from "../models/NotificationModel";
import { emitToUser } from "./io";

export const NOTIFICATION_NEW = "notification:new";
export const NOTIFICATIONS_COUNT = "notifications:count";

export type NotificationNewPayload = { notificationId: string };
export type NotificationsCountPayload = { notifications: number };

const ACTIVITY_TYPES: NotificationType[] = ["comment_on_post", "comment_on_photo", "comment_reply"];

async function unreadNotificationCount(userId: string): Promise<number> {
  const unreadActivity = await NotificationModel.countUnread(userId, ACTIVITY_TYPES);
  const pendingFriends = (await FriendshipModel.listIncoming(userId)).length;
  return unreadActivity + pendingFriends;
}

export const NotificationRealtime = {
  async notificationCreated(recipientId: string, notificationId: string): Promise<void> {
    emitToUser(recipientId, NOTIFICATION_NEW, { notificationId } satisfies NotificationNewPayload);
    const notifications = await unreadNotificationCount(recipientId);
    emitToUser(recipientId, NOTIFICATIONS_COUNT, { notifications } satisfies NotificationsCountPayload);
  },
};
