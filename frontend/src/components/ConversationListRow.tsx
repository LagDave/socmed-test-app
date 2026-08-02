import { Link } from "react-router-dom";
import { MoreVertical, Trash2 } from "lucide-react";
import type { ConversationListItem } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TypingIndicator } from "@/components/TypingIndicator";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";

function snippet(item: ConversationListItem): string {
  const last = item.lastMessage;
  if (!last) return "No messages yet";
  if (last.isUnsent) return "Unsent a message";
  let text: string;
  if (last.imageUrl && last.body) text = last.body;
  else if (last.imageUrl) text = "Sent a photo";
  else text = last.body || "";
  if (last.replyToMessageId && text) return `↩ ${text}`;
  if (last.replyToMessageId) return "↩ Reply";
  return text;
}

export function ConversationListRow({
  item,
  onDelete,
  isPeerTyping = false,
  className,
}: {
  item: ConversationListItem;
  onDelete: (id: string, peerName: string) => void;
  isPeerTyping?: boolean;
  className?: string;
}) {
  const unread = item.unreadCount > 0;
  const peer = item.peer;
  const profilePath = peer.username ? `/u/${peer.username}` : `/u/${peer.id}`;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border py-3 transition-colors last:border-b-0 hover:bg-accent/30",
        unread && "-mx-1 rounded-md bg-accent/25 px-1",
        className
      )}
    >
      <Link
        to={profilePath}
        className="shrink-0"
        aria-label={`${peer.displayName}'s profile`}
      >
        <ProfileAvatar
          displayName={peer.displayName}
          avatarUrl={peer.avatarUrl}
          size="sm"
        />
      </Link>
      <Link to={`/messages/${item.id}`} className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("truncate", unread ? "font-semibold" : "font-medium")}>
            {peer.displayName}
            {peer.username && (
              <span className="font-normal text-muted-foreground"> @{peer.username}</span>
            )}
          </p>
          {item.lastMessageAt && (
            <time
              className="shrink-0 text-xs text-muted-foreground"
              dateTime={item.lastMessageAt}
              title={formatAbsoluteTime(item.lastMessageAt) || undefined}
            >
              {formatRelativeTime(item.lastMessageAt)}
            </time>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          {isPeerTyping ? (
            <TypingIndicator displayName={peer.displayName} compact className="min-w-0 flex-1" />
          ) : (
            <p
              className={cn(
                "truncate text-sm",
                unread ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {snippet(item)}
            </p>
          )}
          {unread && (
            <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
              {item.unreadCount > 9 ? "9+" : item.unreadCount}
            </span>
          )}
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label={`Conversation options for ${peer.displayName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onDelete(item.id, peer.displayName)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete conversation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
