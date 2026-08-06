export const NOTIFICATIONS_PATH = "/notifications";

export const NOTIFICATION_RETURN_STATE = { returnToNotifications: true } as const;

export function isNotificationReturnState(state: unknown): boolean {
  if (typeof state !== "object" || state === null) return false;
  return (state as Record<string, unknown>).returnToNotifications === true;
}
