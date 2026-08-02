import { useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, SmilePlus } from "lucide-react";
import type { MessageView, PublicUser } from "@/api/types";
import {
  MessageReactionPicker,
  MessageReactionSummary,
} from "@/components/MessageReactionBar";
import { ReactionIcon } from "@/components/ReactionIcon";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { MessageStatusIconForMessage } from "@/components/MessageStatusIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";

export function MessageBubbleRow({
  message,
  mine,
  peer,
  showAvatar,
  peerLastReadAt,
  peerProfilePath,
  onUnsend,
  onReactionChange,
  onError,
}: {
  message: MessageView;
  mine: boolean;
  peer: PublicUser | null;
  showAvatar: boolean;
  peerLastReadAt: string | null;
  peerProfilePath: string;
  onUnsend: (id: string) => void;
  onReactionChange: (id: string, summary: MessageView["reactionSummary"]) => void;
  onError: (message: string) => void;
}) {
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [timestampVisible, setTimestampVisible] = useState(false);

  function toggleTimestamp() {
    if (message.isUnsent) return;
    setTimestampVisible((visible) => !visible);
  }

  return (
    <div className={cn("group/message flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
      {!mine &&
        (showAvatar && peer ? (
          <Link to={peerProfilePath} className="shrink-0 self-end" aria-label={`${peer.displayName}'s profile`}>
            <ProfileAvatar displayName={peer.displayName} avatarUrl={peer.avatarUrl} size="sm" />
          </Link>
        ) : (
          <div className="h-10 w-10 shrink-0" aria-hidden="true" />
        ))}

      <div
        className={cn(
          "flex min-w-0 max-w-[85%] items-end gap-1",
          mine ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className={cn("flex min-w-0 flex-col gap-0.5", mine ? "items-end" : "items-start")}>
          <div className="relative">
            <div
              role={message.isUnsent ? undefined : "button"}
              tabIndex={message.isUnsent ? undefined : 0}
              onClick={toggleTimestamp}
              onKeyDown={(e) => {
                if (message.isUnsent) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleTimestamp();
                }
              }}
              className={cn(
                "rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm",
                message.isUnsent
                  ? "border border-dashed border-border bg-transparent italic text-muted-foreground shadow-none"
                  : mine
                    ? "cursor-pointer bg-foreground text-background"
                    : "cursor-pointer bg-secondary text-foreground"
              )}
            >
              {message.isUnsent ? (
                "Unsent a message"
              ) : (
                <>
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt=""
                      className="mb-2 max-h-72 w-full rounded-lg object-cover"
                    />
                  )}
                  {message.body}
                </>
              )}
            </div>

            {!message.isUnsent && (
              <>
                <button
                  type="button"
                  aria-label="React to message"
                  aria-expanded={reactionsOpen}
                  className={cn(
                    "absolute -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-background shadow-sm transition-opacity",
                    mine ? "-left-1" : "-right-1",
                    reactionsOpen
                      ? "opacity-100"
                      : "opacity-0 group-hover/message:opacity-100 focus:opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setReactionsOpen((open) => !open);
                  }}
                >
                  {message.reactionSummary.viewerEmoji ? (
                    <ReactionIcon emoji={message.reactionSummary.viewerEmoji} className="text-sm" />
                  ) : (
                    <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
                <MessageReactionPicker
                  messageId={message.id}
                  summary={message.reactionSummary}
                  onSummaryChange={(summary) => onReactionChange(message.id, summary)}
                  onError={onError}
                  open={reactionsOpen}
                  onOpenChange={setReactionsOpen}
                  className={mine ? "right-0" : "left-0"}
                />
              </>
            )}
          </div>

          {!message.isUnsent && (
            <MessageReactionSummary summary={message.reactionSummary} />
          )}

          {!message.isUnsent && (mine || timestampVisible) && (
            <div className={cn("flex items-center gap-1 px-1", mine && "justify-end")}>
              {mine && peer && (
                <MessageStatusIconForMessage
                  message={message}
                  peerLastReadAt={peerLastReadAt}
                  peer={peer}
                />
              )}
              {timestampVisible && (
                <time
                  className="text-[11px] text-muted-foreground"
                  dateTime={message.createdAt}
                  title={formatAbsoluteTime(message.createdAt) || undefined}
                >
                  {formatRelativeTime(message.createdAt)}
                </time>
              )}
            </div>
          )}
        </div>

        {mine && !message.isUnsent && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/message:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                aria-label="Message options"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="left">
              <DropdownMenuItem onSelect={() => onUnsend(message.id)}>Unsend</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
