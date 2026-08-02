import { useState, type MouseEvent, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Reply } from "lucide-react";
import type { MessageView, PublicUser } from "@/api/types";
import { MessageQuoteStrip } from "@/components/MessageQuoteStrip";
import { ReactionBar } from "@/components/ReactionBar";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { MessageStatusIconForMessage } from "@/components/MessageStatusIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REACTION_OPTIONS } from "@/lib/reactionOptions";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { MessageBodyWithEffects } from "@/components/MessageBodyWithEffects";
import { cn } from "@/lib/utils";

function MessageHoverActions({
  message,
  mine,
  touchRevealed,
  onReply,
}: {
  message: MessageView;
  mine: boolean;
  touchRevealed: boolean;
  onReply: (message: MessageView) => void;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center gap-0.5 self-center transition-opacity",
        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        touchRevealed && "opacity-100"
      )}
    >
      <div className={cn("flex items-center gap-0.5", mine && "flex-row-reverse")}>
        <button
          type="button"
          aria-label="Reply to message"
          title="Reply"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground"
          onClick={() => onReply(message)}
        >
          <Reply className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function MessageBubbleRow({
  message,
  mine,
  peer,
  showAvatar,
  peerLastReadAt,
  groupedWithPrev,
  groupedWithNext,
  peerProfilePath,
  isBeingEdited,
  canHover,
  touchRevealed,
  onToggleTouchReveal,
  onUnsend,
  onStartEdit,
  onReactionChange,
  onReply,
  onError,
  themed = false,
}: {
  message: MessageView;
  mine: boolean;
  peer: PublicUser | null;
  showAvatar: boolean;
  peerLastReadAt: string | null;
  groupedWithPrev?: boolean;
  groupedWithNext?: boolean;
  peerProfilePath: string;
  isBeingEdited?: boolean;
  canHover: boolean;
  touchRevealed: boolean;
  onToggleTouchReveal: () => void;
  onUnsend: (id: string) => void;
  onStartEdit: (id: string) => void;
  onReactionChange: (id: string, summary: MessageView["reactionSummary"]) => void;
  onReply: (message: MessageView) => void;
  onError: (message: string) => void;
  themed?: boolean;
}) {
  const [timestampVisible, setTimestampVisible] = useState(false);
  const hasReactions = REACTION_OPTIONS.some((o) => message.reactionSummary.counts[o.emoji] > 0);
  const canEdit = mine && !message.isUnsent && Boolean(message.body?.trim());

  function handleTouchToggle(e: MouseEvent | TouchEvent) {
    if (canHover || message.isUnsent) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, [role='menu'], [data-radix-popper-content-wrapper]")) return;
    e.stopPropagation();
    onToggleTouchReveal();
  }

  function toggleTimestamp(e: MouseEvent) {
    if (message.isUnsent) return;
    e.stopPropagation();
    setTimestampVisible((visible) => !visible);
  }

  return (
    <div
      className={cn(
        "group flex gap-2",
        mine ? "flex-row-reverse" : "flex-row",
        groupedWithNext ? "mb-0.5" : "mb-1"
      )}
      data-message-row=""
      data-message-id={message.id}
      onClick={handleTouchToggle}
    >
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
          <div
            role={message.isUnsent ? undefined : "button"}
            tabIndex={message.isUnsent ? undefined : 0}
            onClick={toggleTimestamp}
            onKeyDown={(e) => {
              if (message.isUnsent) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setTimestampVisible((visible) => !visible);
              }
            }}
            className={cn(
              "relative overflow-visible px-3.5 py-2 text-[15px] leading-relaxed shadow-sm",
              message.isUnsent
                ? "rounded-2xl border border-dashed border-border bg-transparent italic text-muted-foreground shadow-none"
                : cn(
                    "rounded-2xl shadow-sm",
                    themed
                      ? mine
                        ? "cursor-pointer bg-[var(--chat-bubble-mine)] text-[var(--chat-bubble-mine-fg)]"
                        : "cursor-pointer bg-[var(--chat-bubble-theirs)] text-[var(--chat-bubble-theirs-fg)]"
                      : mine
                        ? "cursor-pointer bg-foreground text-background shadow-foreground/10"
                        : "cursor-pointer bg-card text-foreground ring-1 ring-border/60",
                    groupedWithPrev && (mine ? "rounded-tr-lg" : "rounded-tl-lg"),
                    groupedWithNext && (mine ? "rounded-br-lg" : "rounded-bl-lg"),
                    isBeingEdited && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                    !canHover && touchRevealed && !message.isUnsent && "ring-2 ring-border/80"
                  )
            )}
          >
            {message.isUnsent ? (
              "Unsent a message"
            ) : (
              <>
                {message.replyTo && <MessageQuoteStrip replyTo={message.replyTo} mine={mine} />}
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt=""
                    className={cn(
                      "block max-h-48 max-w-[220px] rounded-lg object-contain",
                      message.body && "mb-2"
                    )}
                  />
                )}
                {message.body && (
                  <MessageBodyWithEffects body={message.body} messageId={message.id} />
                )}
              </>
            )}
          </div>

          {!message.isUnsent && (
            <div
              className={cn(
                "max-w-full px-0.5 transition-opacity",
                !hasReactions &&
                  "opacity-0 group-hover:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100"
              )}
            >
              <ReactionBar
                targetType="message"
                targetId={message.id}
                summary={message.reactionSummary}
                onSummaryChange={(summary) => onReactionChange(message.id, summary)}
                onError={onError}
                size="sm"
              />
            </div>
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
                <>
                  <time
                    className="text-[11px] text-muted-foreground"
                    dateTime={message.createdAt}
                    title={formatAbsoluteTime(message.createdAt) || undefined}
                  >
                    {formatRelativeTime(message.createdAt)}
                  </time>
                  {message.editedAt && <span className="text-[11px] text-muted-foreground">(edited)</span>}
                </>
              )}
            </div>
          )}
        </div>

        {!message.isUnsent && !isBeingEdited && (
          <MessageHoverActions
            message={message}
            mine={mine}
            touchRevealed={touchRevealed}
            onReply={onReply}
          />
        )}

        {mine && !message.isUnsent && !isBeingEdited && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100",
                  touchRevealed && "opacity-100"
                )}
                aria-label="Message options"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="left">
              {canEdit && (
                <DropdownMenuItem onSelect={() => onStartEdit(message.id)}>Edit</DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => onUnsend(message.id)}>Unsend</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
