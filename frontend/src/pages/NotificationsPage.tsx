import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Camera,
  ChevronRight,
  Forward,
  MessageSquare,
  Reply,
  Settings,
  ThumbsUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { getMessagesSocket, NOTIFICATIONS_COUNT } from "@/api/socket";
import type { PublicUser, ReactionEmoji } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionIcon } from "@/components/ReactionIcon";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { NOTIFICATION_RETURN_STATE } from "@/lib/notificationNavigation";
import { reactionOption } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

type NotificationType =
  | "friend_request"
  | "comment_on_post"
  | "comment_on_photo"
  | "comment_reply"
  | "reaction_on_post"
  | "reaction_on_comment"
  | "reaction_on_photo"
  | "post_shared";

type NotificationItem = {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actor: PublicUser;
  postId: string | null;
  commentId: string | null;
  postImageId: string | null;
  friendshipId: string | null;
  reactionEmoji: ReactionEmoji | null;
  message: string;
};

const TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; label: string; action: string }
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
  comment_on_photo: {
    icon: Camera,
    label: "Photo comment",
    action: "commented on your photo",
  },
  comment_reply: {
    icon: Reply,
    label: "Reply",
    action: "replied to your comment",
  },
  reaction_on_post: {
    icon: ThumbsUp,
    label: "Reaction",
    action: "reacted to your post",
  },
  reaction_on_comment: {
    icon: ThumbsUp,
    label: "Reaction",
    action: "reacted to your comment",
  },
  reaction_on_photo: {
    icon: ThumbsUp,
    label: "Reaction",
    action: "reacted to your photo",
  },
  post_shared: {
    icon: Forward,
    label: "Share",
    action: "shared your post",
  },
};

const UNKNOWN_NOTIFICATION_META: { icon: LucideIcon; label: string; action: string } = {
  icon: Bell,
  label: "Notification",
  action: "sent you a notification",
};

function isNotificationType(type: string): type is NotificationType {
  return Object.prototype.hasOwnProperty.call(TYPE_META, type);
}

function notificationMeta(type: string): { icon: LucideIcon; label: string; action: string } {
  return isNotificationType(type) ? TYPE_META[type] : UNKNOWN_NOTIFICATION_META;
}

function isReactionNotification(item: NotificationItem): boolean {
  return (
    item.type === "reaction_on_post" ||
    item.type === "reaction_on_comment" ||
    item.type === "reaction_on_photo"
  );
}

function reactionTarget(type: string): "post" | "comment" | "photo" {
  switch (type) {
    case "reaction_on_comment":
      return "comment";
    case "reaction_on_photo":
      return "photo";
    default:
      return "post";
  }
}

function NotificationAction({ item }: { item: NotificationItem }) {
  if (!isReactionNotification(item) || !item.reactionEmoji) {
    return <span className="text-foreground/85">{notificationMeta(item.type).action}</span>;
  }

  const target = reactionTarget(item.type);
  const reaction = reactionOption(item.reactionEmoji);
  return (
    <span className="text-foreground/85">
      reacted <strong className="mx-0.5 inline-block align-text-bottom text-lg leading-none saturate-150 contrast-125 drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
        <ReactionIcon emoji={item.reactionEmoji} />
        <span className="sr-only">{reaction.label} reaction</span>
      </strong>{" "}
      to your {target}
    </span>
  );
}

function NotificationTypeIcon({ item, Icon }: { item: NotificationItem; Icon: LucideIcon }) {
  if (isReactionNotification(item) && item.reactionEmoji) {
    const reaction = reactionOption(item.reactionEmoji);
    return (
      <span
        className="notifications-type-icon flex size-9 items-center justify-center rounded-full bg-secondary text-2xl"
        role="img"
        aria-label={`${reaction.label} reaction`}
      >
        <ReactionIcon emoji={item.reactionEmoji} />
      </span>
    );
  }

  return (
    <span
      className="notifications-type-icon flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
      aria-hidden="true"
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  );
}

function profilePath(user: PublicUser): string {
  return `/u/${user.username || user.id}`;
}

function NotificationSkeleton() {
  return (
    <li className="notifications-row px-4 py-4" aria-hidden="true">
      <div className="feed-skeleton size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <div className="feed-skeleton h-4 w-4/5 rounded-md" />
        <div className="feed-skeleton h-3 w-1/3 rounded-md" />
      </div>
      <div className="notifications-row-trailing">
        <div className="feed-skeleton size-9 shrink-0 rounded-full" />
      </div>
    </li>
  );
}

function NotificationRow({
  item,
  busyFriendshipId,
  readNotificationId,
  onFriendAction,
  onNotificationRead,
}: {
  item: NotificationItem;
  busyFriendshipId: string | null;
  readNotificationId: string | null;
  onFriendAction: (friendshipId: string, action: "accept" | "decline") => void;
  onNotificationRead: (notificationId: string) => void;
}) {
  const meta = isNotificationType(item.type) ? TYPE_META[item.type] : UNKNOWN_NOTIFICATION_META;
  const Icon = meta.icon;
  const isFriendRequest = item.type === "friend_request" && item.friendshipId;
  const destination = item.postId
    ? item.postImageId
      ? `/posts/${item.postId}/photos/${item.postImageId}`
      : `/posts/${item.postId}${item.commentId ? "#comments" : ""}`
    : null;
  const actorHref = profilePath(item.actor);
  const rowLinksToPost = Boolean(destination && !isFriendRequest);
  const isMarkingRead = readNotificationId === item.id;

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
          <NotificationAction item={item} />
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="notifications-type-pill">{meta.label}</span>
          <time
            className="text-xs text-muted-foreground"
            dateTime={item.createdAt}
            title={formatAbsoluteTime(item.createdAt) || undefined}
          >
            {formatRelativeTime(item.createdAt)}
          </time>
          {!item.isRead && (
            <span className="notifications-new-badge">
              <span className="notifications-new-badge-dot" aria-hidden="true" />
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
            {!item.isRead && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isMarkingRead}
                onClick={() => onNotificationRead(item.id)}
              >
                {isMarkingRead ? "Marking…" : "Mark as read"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="notifications-row-trailing">
        <NotificationTypeIcon item={item} Icon={Icon} />
        {destination && !isFriendRequest && (
          <ChevronRight
            className="notifications-row-chevron size-4 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );

  const rowClass = cn(
    "notifications-row px-4 py-4",
    !item.isRead && "notifications-row--unread",
    destination && !isFriendRequest && "notifications-row--interactive"
  );

  if (destination && !isFriendRequest) {
    return (
      <li>
        <Link
          to={destination}
          state={NOTIFICATION_RETURN_STATE}
          className={cn(rowClass, "w-full no-underline")}
          onClick={() => onNotificationRead(item.id)}
        >
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
  const [readNotificationId, setReadNotificationId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api.get<{ notifications: NotificationItem[] }>("/api/notifications");
    setItems(data.notifications);
  }, []);

  useEffect(() => {
    void load()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const socket = getMessagesSocket();
    const refreshNotifications = () => {
      void load().catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to refresh notifications");
      });
    };
    socket.on(NOTIFICATIONS_COUNT, refreshNotifications);
    return () => {
      socket.off(NOTIFICATIONS_COUNT, refreshNotifications);
    };
  }, [load]);

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

  async function markNotificationRead(notificationId: string) {
    const notification = items.find((item) => item.id === notificationId);
    if (!notification || notification.isRead) return;

    setReadNotificationId(notificationId);
    setError(null);
    try {
      await api.post(`/api/notifications/${notificationId}/read`);
      setItems((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark notification as read");
    } finally {
      setReadNotificationId(null);
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;
  const showListHeading = !loading && items.length > 0 && !error;

  return (
    <section className="space-y-4">
      <header className="feed-card p-6 text-card-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
              <Bell className="size-5 text-foreground/80" aria-hidden="true" strokeWidth={1.5} />
            </span>
            <div>
              <p className="profile-section-label mb-1">Activity</p>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Friend requests, comments, reactions, and shares from your network.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && unreadCount > 0 && (
              <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                {unreadCount} new
              </span>
            )}
            <Button asChild variant="ghost" size="icon">
              <Link to="/notifications/settings" aria-label="Notification settings">
                <Settings className="size-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="notifications-list-card rounded-xl bg-card text-card-foreground">
        {error && (
          <p className="border-b border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            {error}
          </p>
        )}

        {showListHeading && (
          <p className="notifications-list-heading">
            Recent
            <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/80">
              ({items.length})
            </span>
          </p>
        )}

        {loading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </ul>
        ) : items.length === 0 && !error ? (
          <div className="notifications-empty-state flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <span className="notifications-empty-icon flex size-16 items-center justify-center rounded-full border border-border">
              <Bell className="size-7 text-muted-foreground/80" aria-hidden="true" strokeWidth={1.25} />
            </span>
            <div className="space-y-2">
              <p className="text-lg font-semibold tracking-tight">You&apos;re all caught up</p>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
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
                readNotificationId={readNotificationId}
                onFriendAction={(friendshipId, action) => void onFriendAction(friendshipId, action)}
                onNotificationRead={(notificationId) => void markNotificationRead(notificationId)}
              />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
