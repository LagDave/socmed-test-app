import { useEffect, useState } from "react";
import { Bell, ChevronRight, MessageSquare, Reply, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";

type NotificationType = "friend_request" | "comment_on_post" | "comment_reply";

type NotificationItem = {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: PublicUser;
  postId: string | null;
  commentId: string | null;
  friendshipId: string | null;
  message: string;
};

const TYPE_META: Record<
  NotificationType,
  { icon: typeof UserPlus; label: string; action: string }
> = {
  friend_request: {
    icon: UserPlus,
    label: "Friend request",
    action: "sent you a friend request",
  },
  comment_on_post: {
    icon: MessageSquare,
    label: "Comment",
    action: "commented on your post",
  },
  comment_reply: {
    icon: Reply,
    label: "Reply",
    action: "replied to your comment",
  },
};

function profilePath(user: PublicUser): string {
  return `/u/${user.username || user.id}`;
}

function NotificationSkeleton() {
  return (
    <li className="flex items-start gap-3 px-4 py-4">
      <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
      </div>
    </li>
  );
}

function NotificationRow({
  item,
  busyFriendshipId,
  onFriendAction,
}: {
  item: NotificationItem;
  busyFriendshipId: string | null;
  onFriendAction: (friendshipId: string, action: "accept" | "decline") => void;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const isFriendRequest = item.type === "friend_request" && item.friendshipId;
  const destination = item.postId ? `/posts/${item.postId}${item.commentId ? "#comments" : ""}` : null;
  const actorHref = profilePath(item.actor);
  const rowLinksToPost = Boolean(destination && !isFriendRequest);

  const content = (
    <>
      <div className="relative shrink-0">
        {rowLinksToPost ? (
          <ProfileAvatar
            displayName={item.actor.displayName}
            avatarUrl={item.actor.avatarUrl}
            size="sm"
          />
        ) : (
          <Link to={actorHref} className="block" aria-label={`${item.actor.displayName}'s profile`}>
            <ProfileAvatar
              displayName={item.actor.displayName}
              avatarUrl={item.actor.avatarUrl}
              size="sm"
            />
          </Link>
        )}
        {!item.isRead && (
          <span
            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-primary"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug">
          {rowLinksToPost ? (
            <span className="font-semibold">{item.actor.displayName}</span>
          ) : (
            <Link
              to={actorHref}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {item.actor.displayName}
            </Link>
          )}{" "}
          <span className="text-foreground/90">{meta.action}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <time
            className="text-xs text-muted-foreground"
            dateTime={item.createdAt}
            title={formatAbsoluteTime(item.createdAt) || undefined}
          >
            {formatRelativeTime(item.createdAt)}
          </time>
          {!item.isRead && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-foreground">
              New
            </span>
          )}
        </div>

        {isFriendRequest && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busyFriendshipId === item.friendshipId}
              onClick={() => onFriendAction(item.friendshipId!, "accept")}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busyFriendshipId === item.friendshipId}
              onClick={() => onFriendAction(item.friendshipId!, "decline")}
            >
              Decline
            </Button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 self-center">
        <span
          className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
          aria-hidden="true"
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        {destination && !isFriendRequest && (
          <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden="true" />
        )}
      </div>
    </>
  );

  const rowClass = cn(
    "flex items-start gap-3 px-4 py-4 transition-colors",
    !item.isRead && "bg-accent/40",
    destination && !isFriendRequest && "hover:bg-accent/60"
  );

  if (destination && !isFriendRequest) {
    return (
      <li className="relative">
        <Link to={destination} className={cn(rowClass, "block")}>
          {content}
        </Link>
      </li>
    );
  }

  return <li className={rowClass}>{content}</li>;
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyFriendshipId, setBusyFriendshipId] = useState<string | null>(null);

  async function load() {
    const data = await api.get<{ notifications: NotificationItem[] }>("/api/notifications");
    setItems(data.notifications);
    await api.post("/api/notifications/read");
  }

  useEffect(() => {
    void load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function onFriendAction(friendshipId: string, action: "accept" | "decline") {
    setBusyFriendshipId(friendshipId);
    setError(null);
    try {
      await api.post(`/api/friends/${friendshipId}/${action}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyFriendshipId(null);
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Friend requests, comments, and replies from your network.
          </p>
        </div>
        {!loading && unreadCount > 0 && (
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            {unreadCount} new
          </span>
        )}
      </div>

      <div className="feed-card overflow-hidden">
        {error && (
          <p className="border-b border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            {error}
          </p>
        )}

        {loading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </ul>
        ) : items.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary">
              <Bell className="size-7 text-muted-foreground/70" aria-hidden="true" strokeWidth={1.25} />
            </span>
            <div className="space-y-1">
              <p className="text-base font-medium">You&apos;re all caught up</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                When someone sends a friend request or interacts with your posts, it will show up here.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <NotificationRow
                key={n.id}
                item={n}
                busyFriendshipId={busyFriendshipId}
                onFriendAction={(friendshipId, action) => void onFriendAction(friendshipId, action)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
