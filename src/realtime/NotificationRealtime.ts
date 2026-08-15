import {
  ACTIVITY_NOTIFICATION_TYPES,
  NotificationModel,
} from "../models/NotificationModel";
import { emitToUser } from "./io";

export const NOTIFICATION_NEW = "notification:new";
export const NOTIFICATIONS_COUNT = "notifications:count";

export type NotificationNewPayload = { notificationId: string };
export type NotificationsCountPayload = { notifications: number };

async function unreadNotificationCount(userId: string): Promise<number> {
  const unreadActivity = await NotificationModel.countUnread(userId, ACTIVITY_NOTIFICATION_TYPES);
  const unreadFriendRequests = await NotificationModel.countUnreadPendingFriendRequests(userId);
  return unreadActivity + unreadFriendRequests;
}

export const NotificationRealtime = {
  async notificationCreated(recipientId: string, notificationId: string): Promise<void> {
    emitToUser(recipientId, NOTIFICATION_NEW, { notificationId } satisfies NotificationNewPayload);
    await this.countUpdated(recipientId);
  },

  async countUpdated(userId: string): Promise<void> {
    const notifications = await unreadNotificationCount(userId);
    emitToUser(userId, NOTIFICATIONS_COUNT, { notifications } satisfies NotificationsCountPayload);
  },
};
