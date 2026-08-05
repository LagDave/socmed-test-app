import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  getMessagesSocket,
  NOTIFICATION_NEW,
  type NotificationNewPayload,
} from "@/api/socket";
import { useAuth } from "@/contexts/AuthContext";
import {
  isViewingNotificationsPage,
  playActivityNotificationSound,
} from "@/lib/notificationSounds";

/** Inbound activity sounds: suppress on the open notifications page. */
export function useActivityNotificationSound(): void {
  const { user } = useAuth();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;

    const socket = getMessagesSocket();
    const onNotificationNew = (payload: NotificationNewPayload) => {
      if (isViewingNotificationsPage(pathnameRef.current)) return;
      if (!payload?.notificationId) return;
      playActivityNotificationSound(payload.notificationId);
    };

    socket.on(NOTIFICATION_NEW, onNotificationNew);

    return () => {
      socket.off(NOTIFICATION_NEW, onNotificationNew);
    };
  }, [user]);
}
