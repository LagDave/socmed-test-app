import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/api/client";
import { getMessagesSocket, MESSAGES_UNREAD, NOTIFICATIONS_COUNT, type UnreadPayload, type NotificationsCountPayload } from "@/api/socket";
import { AppNavbar } from "@/components/nav/AppNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useActivityNotificationSound } from "@/hooks/useActivityNotificationSound";
import { useMessageNotificationSound } from "@/hooks/useMessageNotificationSound";
import { useMessagesSocketConnection } from "@/hooks/useMessagesSocket";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const socketConnected = useMessagesSocketConnection();
  useMessageNotificationSound();
  useActivityNotificationSound();
  const [notificationCount, setNotificationCount] = useState(0);
  const [feedCount, setFeedCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  const profilePath = user ? `/u/${user.username || "me"}` : "/login";
  const isProfileActive = Boolean(
    user &&
      (location.pathname === profilePath ||
        location.pathname.startsWith(`${profilePath}/`))
  );

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      setFeedCount(0);
      setMessagesCount(0);
      return;
    }
    let cancelled = false;
    void api
      .get<{ notifications: number; feed: number }>("/api/notifications/counts")
      .then((counts) => {
        if (!cancelled) {
          setNotificationCount(counts.notifications);
          setFeedCount(counts.feed);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotificationCount(0);
          setFeedCount(0);
        }
      });
    void api
      .get<{ unread: number }>("/api/messages/unread-count")
      .then((data) => {
        if (!cancelled) setMessagesCount(data.unread);
      })
      .catch(() => {
        if (!cancelled) setMessagesCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user) return;
    const socket = getMessagesSocket();
    const onUnread = (payload: UnreadPayload) => {
      if (typeof payload.unread === "number") setMessagesCount(payload.unread);
    };
    const onNotificationsCount = (payload: NotificationsCountPayload) => {
      if (typeof payload.notifications === "number") setNotificationCount(payload.notifications);
    };
    socket.on(MESSAGES_UNREAD, onUnread);
    socket.on(NOTIFICATIONS_COUNT, onNotificationsCount);
    return () => {
      socket.off(MESSAGES_UNREAD, onUnread);
      socket.off(NOTIFICATIONS_COUNT, onNotificationsCount);
    };
  }, [user]);

  useEffect(() => {
    if (!user || socketConnected) return;
    const onMessages = location.pathname.startsWith("/messages");
    if (!onMessages) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      void api
        .get<{ unread: number }>("/api/messages/unread-count")
        .then((data) => setMessagesCount(data.unread))
        .catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(id);
  }, [user, location.pathname, socketConnected]);

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <AppNavbar
        user={user}
        profilePath={profilePath}
        isProfileActive={isProfileActive}
        feedCount={feedCount}
        messagesCount={messagesCount}
        notificationCount={notificationCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      />
      <main className="mx-auto w-full max-w-[680px] px-5 py-6 sm:px-6">{children}</main>
    </div>
  );
}
