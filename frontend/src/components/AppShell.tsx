import { useEffect, useState, type ReactNode } from "react";
import { Bell, Home, MessageCircle, UserRound, Users } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

function NavIcon({
  to,
  label,
  icon,
  badge,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}) {
  const showBadge = typeof badge === "number" && badge > 0;
  const badgeLabel = showBadge ? (badge > 9 ? "9+" : String(badge)) : null;

  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-foreground"
        )
      }
    >
      {icon}
      {showBadge && badgeLabel && (
        <span
          className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold leading-none text-background"
          aria-hidden="true"
        >
          {badgeLabel}
        </span>
      )}
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);
  const [feedCount, setFeedCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

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
  }, [user, location.pathname]);

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[680px] items-center justify-between gap-3 px-4">
          <Link to="/" className="truncate text-lg font-semibold tracking-tight">
            SocMed application
          </Link>
          <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Main">
            <NavIcon
              to="/"
              label="Feed"
              icon={<Home className="h-4 w-4" aria-hidden="true" />}
              badge={feedCount}
            />
            {user && (
              <>
                <NavIcon
                  to="/friends"
                  label="Friends"
                  icon={<Users className="h-4 w-4" aria-hidden="true" />}
                />
                <NavIcon
                  to="/messages"
                  label="Messages"
                  icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
                  badge={messagesCount}
                />
                <NavIcon
                  to={`/u/${user.username || "me"}`}
                  label="Profile"
                  icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
                />
                <NavIcon
                  to="/notifications"
                  label="Notifications"
                  icon={<Bell className="h-4 w-4" aria-hidden="true" />}
                  badge={notificationCount}
                />
                <ThemeToggle />
                <Button size="sm" variant="outline" className="ml-1" onClick={() => void logout()}>
                  Log out
                </Button>
              </>
            )}
            {!user && (
              <>
                <ThemeToggle />
                <Button asChild variant="outline" size="sm" className="ml-1">
                  <Link to="/login">Sign in</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[680px] px-4 py-6">{children}</main>
    </div>
  );
}
