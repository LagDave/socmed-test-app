import { Link } from "react-router-dom";
import { ChevronRight, ImageIcon } from "lucide-react";
import type { ConversationListItem } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";

function snippet(item: ConversationListItem): { text: string; isMedia: boolean } {
  const last = item.lastMessage;
  if (!last) return { text: "No messages yet", isMedia: false };
  if (last.isUnsent) return { text: "Unsent a message", isMedia: false };
  if (last.imageUrl && !last.body) return { text: "Photo", isMedia: true };
  if (last.imageUrl && last.body) return { text: last.body, isMedia: true };
  return { text: last.body || "", isMedia: false };
}

export function ConversationListRow({ item }: { item: ConversationListItem }) {
  const unread = item.unreadCount > 0;
  const peer = item.peer;
  const profilePath = peer.username ? `/u/${peer.username}` : `/u/${peer.id}`;
  const preview = snippet(item);

  return (
    <li className={cn("transition-colors", unread && "bg-accent/30")}>
      <div
        className={cn(
          "group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/50",
          unread && "hover:bg-accent/40"
        )}
      >
        <Link
          to={profilePath}
          className="relative shrink-0"
          aria-label={`${peer.displayName}'s profile`}
        >
          <ProfileAvatar
            displayName={peer.displayName}
            avatarUrl={peer.avatarUrl}
            size="sm"
            className={cn(unread && "ring-2 ring-primary/30 ring-offset-2 ring-offset-card")}
          />
          {unread && (
            <span
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-primary"
              aria-hidden="true"
            />
          )}
        </Link>

        <Link to={`/messages/${item.id}`} className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className={cn("truncate", unread ? "font-semibold" : "font-medium")}>
                {peer.displayName}
              </span>
              {item.lastMessageAt && (
                <time
                  className={cn(
                    "shrink-0 text-xs",
                    unread ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                  dateTime={item.lastMessageAt}
                  title={formatAbsoluteTime(item.lastMessageAt) || undefined}
                >
                  {formatRelativeTime(item.lastMessageAt)}
                </time>
              )}
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "flex min-w-0 items-center gap-1 truncate text-sm",
                  unread ? "font-medium text-foreground/90" : "text-muted-foreground"
                )}
              >
                {preview.isMedia && (
                  <ImageIcon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
                )}
                <span className="truncate">{preview.text}</span>
              </span>
              {unread && (
                <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                  {item.unreadCount > 9 ? "9+" : item.unreadCount}
                </span>
              )}
            </span>
          </span>

          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
            aria-hidden="true"
          />
        </Link>
      </div>
    </li>
  );
}
