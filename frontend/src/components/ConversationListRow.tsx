import { Link } from "react-router-dom";
import { ChevronRight, ImageIcon, MoreVertical, Trash2 } from "lucide-react";
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
import { reactionOption } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

function inboxPreview(
  item: ConversationListItem,
  viewerId: string | undefined
): { text: string; isMedia: boolean; isSystemLog?: boolean } {
  const last = item.lastMessage;
  const reaction = item.lastReaction;
  const systemLog = item.lastSystemLog;
  const pinActivity = item.lastPinActivity;

  const messageAt = last?.createdAt ? new Date(last.createdAt).getTime() : 0;
  const reactionAt = reaction?.reactedAt ? new Date(reaction.reactedAt).getTime() : 0;
  const systemLogAt = systemLog?.createdAt ? new Date(systemLog.createdAt).getTime() : 0;
  const pinActivityAt = pinActivity?.createdAt ? new Date(pinActivity.createdAt).getTime() : 0;
  const latestAt = Math.max(messageAt, reactionAt, systemLogAt, pinActivityAt);

  if (pinActivity && pinActivityAt === latestAt) {
    const verb = pinActivity.action === "pinned" ? "pinned a message" : "unpinned a message";
    return { text: `${pinActivity.actorDisplayName} ${verb}`, isMedia: false, isSystemLog: true };
  }

  if (systemLog && systemLogAt === latestAt) {
    return { text: systemLog.text, isMedia: false, isSystemLog: true };
  }

  if (reaction && viewerId && reactionAt === latestAt) {
    const glyph = reactionOption(reaction.emoji).glyph;
    const peerId = item.peer.id;
    const isPeerReaction = reaction.reactorId === peerId;
    const isMyMessage = reaction.messageSenderId === viewerId;

    if (isPeerReaction && isMyMessage) {
      const action = reaction.emoji === "like" ? "Liked" : "Reacted to";
      return {
        text: `${glyph} ${action} your message`,
        isMedia: false,
      };
    }
    if (isPeerReaction) {
      return { text: `${glyph} Reacted to a message`, isMedia: false };
    }
    if (!isMyMessage) {
      const preview = reaction.messageBody || (reaction.messageImageUrl ? "Photo" : "message");
      return {
        text: `${glyph} ${preview}`,
        isMedia: Boolean(reaction.messageImageUrl && !reaction.messageBody),
      };
    }
  }

  return messageSnippet(item);
}

function messageSnippet(item: ConversationListItem): { text: string; isMedia: boolean } {
  const last = item.lastMessage;
  if (!last) return { text: "No messages yet", isMedia: false };
  if (last.isUnsent) return { text: "Unsent a message", isMedia: false };

  let text: string;
  let isMedia = false;
  if (last.imageUrl && !last.body) {
    text = "Photo";
    isMedia = true;
  } else if (last.imageUrl && last.body) {
    text = last.body;
    isMedia = true;
  } else {
    text = last.body || "";
  }

  if (last.replyToMessageId && text) return { text: `↩ ${text}`, isMedia };
  if (last.replyToMessageId) return { text: "↩ Reply", isMedia: false };
  return { text, isMedia };
}

export function ConversationListRow({
  item,
  onDelete,
  isPeerTyping = false,
  viewerId,
  className,
}: {
  item: ConversationListItem;
  onDelete: (id: string, peerName: string) => void;
  isPeerTyping?: boolean;
  viewerId?: string;
  className?: string;
}) {
  const unread = item.unreadCount > 0 || item.hasUnreadReaction;
  const peer = item.peer;
  const profilePath = peer.username ? `/u/${peer.username}` : `/u/${peer.id}`;
  const preview = inboxPreview(item, viewerId);
  const badgeCount =
    item.unreadCount > 0 ? item.unreadCount : item.hasUnreadReaction ? 1 : 0;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/50",
        unread && "bg-accent/30 hover:bg-accent/40",
        className
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
              {peer.username && (
                <span className="font-normal text-muted-foreground"> @{peer.username}</span>
              )}
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
            {isPeerTyping ? (
              <TypingIndicator displayName={peer.displayName} compact className="min-w-0 flex-1" />
            ) : (
              <span
                className={cn(
                  "flex min-w-0 items-center gap-1 truncate text-sm",
                  preview.isSystemLog
                    ? "italic text-muted-foreground/90"
                    : unread
                      ? "font-medium text-foreground/90"
                      : "text-muted-foreground"
                )}
              >
                {preview.isMedia && (
                  <ImageIcon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
                )}
                <span className="truncate">{preview.text}</span>
              </span>
            )}
            {unread && badgeCount > 0 && (
              <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </span>
        </span>

        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
          aria-hidden="true"
        />
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
