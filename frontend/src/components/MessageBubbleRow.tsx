import { useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Reply, SmilePlus } from "lucide-react";
import type { MessageView, PublicUser } from "@/api/types";
import {
  MessageReactionPicker,
  MessageReactionSummary,
} from "@/components/MessageReactionBar";
import { MessageQuoteStrip } from "@/components/MessageQuoteStrip";
import { ReactionIcon } from "@/components/ReactionIcon";
import { ProfileAvatar } from "@/components/ProfileAvatar";
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
  showMeta,
  peerProfilePath,
  onUnsend,
  onReactionChange,
  onReply,
  onError,
}: {
  message: MessageView;
  mine: boolean;
  peer: PublicUser | null;
  showAvatar: boolean;
  showMeta: boolean;
  peerProfilePath: string;
  onUnsend: (id: string) => void;
  onReactionChange: (id: string, summary: MessageView["reactionSummary"]) => void;
  onReply: (message: MessageView) => void;
  onError: (message: string) => void;
}) {
  const [reactionsOpen, setReactionsOpen] = useState(false);

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
              className={cn(
                "rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm",
                message.isUnsent
                  ? "border border-dashed border-border bg-transparent italic text-muted-foreground shadow-none"
                  : mine
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground"
              )}
            >
              {message.isUnsent ? (
                "Unsent a message"
              ) : (
                <>
                  {message.replyTo && (
                    <MessageQuoteStrip replyTo={message.replyTo} mine={mine} />
                  )}
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
                <div
                  className={cn(
                    "absolute top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100",
                    mine ? "-left-[4.25rem]" : "-right-[4.25rem]"
                  )}
                >
                  <button
                    type="button"
                    aria-label="Reply to message"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-background shadow-sm"
                    onClick={() => onReply(message)}
                  >
                    <Reply className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="React to message"
                    aria-expanded={reactionsOpen}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-background shadow-sm"
                    onClick={() => setReactionsOpen((open) => !open)}
                  >
                    {message.reactionSummary.viewerEmoji ? (
                      <ReactionIcon emoji={message.reactionSummary.viewerEmoji} className="text-sm" />
                    ) : (
                      <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    )}
                  </button>
                </div>
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

          {showMeta && (
            <time
              className="px-1 text-[11px] text-muted-foreground"
              dateTime={message.createdAt}
              title={formatAbsoluteTime(message.createdAt) || undefined}
            >
              {formatRelativeTime(message.createdAt)}
            </time>
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
