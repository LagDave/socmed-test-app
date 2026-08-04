import { useState, type MouseEvent, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Pin, PinOff, Reply } from "lucide-react";
import type { MessageView, PublicUser } from "@/api/types";
import { MessageQuoteStrip } from "@/components/MessageQuoteStrip";
import { ReactionBar } from "@/components/ReactionBar";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { MessageStatusIconForMessage } from "@/components/MessageStatusIcon";
import { ViewChatImageDialog } from "@/components/ViewChatImageDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REACTION_OPTIONS } from "@/lib/reactionOptions";
import { ReactionIcon } from "@/components/ReactionIcon";
import type { ReactionEmoji } from "@/api/types";
import { MessageBodyWithEffects } from "@/components/MessageBodyWithEffects";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";

const messageActionBtnClass =
  "flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground";

function messageReactionEmoji(summary: MessageView["reactionSummary"]): ReactionEmoji | null {
  if (summary.viewerEmoji) return summary.viewerEmoji;
  return REACTION_OPTIONS.find((option) => summary.counts[option.emoji] > 0)?.emoji ?? null;
}

function MessageReactionBadge({
  emoji,
  mine,
}: {
  emoji: ReactionEmoji;
  mine: boolean;
}) {
  return (
    <span
      className={cn(
        "message-reaction-badge absolute bottom-0 z-20 inline-flex translate-y-[30%] items-center justify-center rounded-full bg-white p-px shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
        mine ? "right-2" : "left-1"
      )}
      aria-hidden="true"
    >
      <ReactionIcon emoji={emoji} className="text-base leading-none" />
    </span>
  );
}

function MessageActionToolbar({
  message,
  mine,
  canEdit,
  touchRevealed,
  onReply,
  onReactionChange,
  onStartEdit,
  onUnsend,
  isPinned = false,
  pinSaving = false,
  onPinChange,
  onError,
}: {
  message: MessageView;
  mine: boolean;
  canEdit: boolean;
  touchRevealed: boolean;
  onReply: (message: MessageView) => void;
  onReactionChange: (id: string, summary: MessageView["reactionSummary"]) => void;
  onStartEdit: (id: string) => void;
  onUnsend: (id: string) => void;
  isPinned?: boolean;
  pinSaving?: boolean;
  onPinChange?: (id: string, isPinned: boolean) => void;
  onError: (message: string) => void;
}) {
  return (
    <div
      className={cn(
        "message-action-toolbar flex shrink-0 items-center gap-0 self-center transition-opacity",
        mine && "flex-row-reverse",
        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        touchRevealed && "opacity-100"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <ReactionBar
        targetType="message"
        targetId={message.id}
        summary={message.reactionSummary}
        onSummaryChange={(summary) => onReactionChange(message.id, summary)}
        onError={onError}
        variant="toolbar"
        pickerAlign={mine ? "end" : "start"}
      />
      <button
        type="button"
        aria-label="Reply to message"
        title="Reply"
        className={messageActionBtnClass}
        onClick={() => onReply(message)}
      >
        <Reply className="h-[15px] w-[15px]" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(messageActionBtnClass, "shrink-0 data-[state=open]:bg-accent/60")}
              aria-label="Message options"
            >
              <MoreVertical className="h-[15px] w-[15px]" strokeWidth={1.75} aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side={mine ? "left" : "right"}>
            <DropdownMenuItem
              disabled={pinSaving || !onPinChange}
              onSelect={() => onPinChange?.(message.id, !isPinned)}
            >
              {isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
              {isPinned ? "Unpin message" : "Pin message"}
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onSelect={() => onStartEdit(message.id)}>Edit</DropdownMenuItem>
            )}
            {mine && <DropdownMenuItem onSelect={() => onUnsend(message.id)}>Unsend</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
  isSearchFocused = false,
  searchHighlightQuery,
  canHover,
  touchRevealed,
  onToggleTouchReveal,
  onUnsend,
  isPinned = false,
  pinSaving = false,
  onPinChange,
  onStartEdit,
  onReactionChange,
  onReply,
  onError,
  themed = false,
  showMessageStatus = false,
  allowSeenStatus = false,
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
  isSearchFocused?: boolean;
  searchHighlightQuery?: string;
  canHover: boolean;
  touchRevealed: boolean;
  onToggleTouchReveal: () => void;
  onUnsend: (id: string) => void;
  isPinned?: boolean;
  pinSaving?: boolean;
  onPinChange?: (id: string, isPinned: boolean) => void;
  onStartEdit: (id: string) => void;
  onReactionChange: (id: string, summary: MessageView["reactionSummary"]) => void;
  onReply: (message: MessageView) => void;
  onError: (message: string) => void;
  themed?: boolean;
  showMessageStatus?: boolean;
  allowSeenStatus?: boolean;
}) {
  const [timestampVisible, setTimestampVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const canEdit = mine && !message.isUnsent && Boolean(message.body?.trim());
  const reactionEmoji = messageReactionEmoji(message.reactionSummary);
  const showReactionBadge = !message.isUnsent && reactionEmoji !== null;
  const imageOnlyPlain = Boolean(
    !message.isUnsent && message.imageUrl && !message.body?.trim() && !message.replyTo
  );

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
        "group flex gap-1.5",
        mine ? "flex-row-reverse" : "flex-row"
      )}
      data-message-row=""
      data-message-id={message.id}
      data-grouped-with-prev={groupedWithPrev ? "true" : undefined}
      data-has-reaction={showReactionBadge ? "true" : undefined}
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
          "flex min-w-0 max-w-[85%] items-end gap-0.5",
          mine ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className={cn("flex min-w-0 flex-col gap-0", mine ? "items-end" : "items-start")}>
          <div className={cn("flex max-w-full items-center", mine ? "flex-row-reverse gap-0.5" : "gap-0.5")}>
              <div className={cn("relative inline-block max-w-full", showReactionBadge && "pb-1.5")}>
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
                    "message-bubble max-w-full text-[15px] leading-snug",
                    message.isUnsent
                      ? "rounded-[1.25rem] border border-dashed border-border bg-transparent px-3 py-1.5 italic text-muted-foreground shadow-none"
                      : cn(
                          imageOnlyPlain
                            ? "message-bubble-image-only cursor-pointer overflow-hidden rounded-[1.25rem] bg-transparent p-0 shadow-none ring-0"
                            : cn(
                                "rounded-[1.25rem] px-3 py-1.5",
                                themed
                                  ? mine
                                    ? "message-bubble-mine cursor-pointer bg-[var(--chat-bubble-mine)] text-[var(--chat-bubble-mine-fg)]"
                                    : "message-bubble-theirs cursor-pointer bg-[var(--chat-bubble-theirs)] text-[var(--chat-bubble-theirs-fg)]"
                                  : mine
                                    ? "message-bubble-mine cursor-pointer bg-foreground text-background"
                                    : "message-bubble-theirs cursor-pointer bg-card text-foreground ring-1 ring-border/50"
                              ),
                          groupedWithPrev && (mine ? "rounded-tr-[6px]" : "rounded-tl-[6px]"),
                          groupedWithNext && (mine ? "rounded-br-[6px]" : "rounded-bl-[6px]"),
                          isBeingEdited && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                          !canHover && touchRevealed && !message.isUnsent && "ring-2 ring-border/80"
                        )
                  )}
                >
                  {message.isUnsent ? (
                    "Unsent a message"
                  ) : (
                    <>
                      {message.replyTo && (
                        <MessageQuoteStrip replyTo={message.replyTo} mine={mine} themed={themed} />
                      )}
                      {message.imageUrl && (
                        <button
                          type="button"
                          aria-label="View full-size image"
                          className={cn(
                            "block cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            imageOnlyPlain ? "rounded-[inherit]" : "rounded-lg",
                            message.body && "mb-1.5"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxOpen(true);
                          }}
                        >
                          <img
                            src={message.imageUrl}
                            alt=""
                            className={cn(
                              "block max-h-48 max-w-[220px]",
                              imageOnlyPlain
                                ? "rounded-[inherit] object-cover"
                                : "rounded-lg object-contain"
                            )}
                          />
                        </button>
                      )}
                      {message.body && (
                        <MessageBodyWithEffects
                          body={message.body}
                          messageId={message.id}
                          highlightQuery={isSearchFocused ? searchHighlightQuery : undefined}
                        />
                      )}
                    </>
                  )}
                </div>
                {showReactionBadge && reactionEmoji && (
                  <MessageReactionBadge emoji={reactionEmoji} mine={mine} />
                )}
              </div>
              {!message.isUnsent && !isBeingEdited && (
                <MessageActionToolbar
                  message={message}
                  mine={mine}
                  canEdit={canEdit}
                  touchRevealed={touchRevealed}
                  onReply={onReply}
                  onReactionChange={onReactionChange}
                  onStartEdit={onStartEdit}
                  onUnsend={onUnsend}
                  isPinned={isPinned}
                  pinSaving={pinSaving}
                  onPinChange={onPinChange}
                  onError={onError}
                />
              )}
            </div>
          {showMessageStatus && mine && peer && (
            <div
              className={cn(
                "message-seen-status self-end",
                showReactionBadge ? "mt-2" : "mt-0.5"
              )}
            >
              <MessageStatusIconForMessage
                message={message}
                peerLastReadAt={peerLastReadAt}
                peer={peer}
                allowSeen={allowSeenStatus}
              />
            </div>
          )}

          {!message.isUnsent && timestampVisible && (
            <div className={cn("flex items-center gap-1 px-1", mine && "justify-end")}>
              <time
                className="text-[11px] text-muted-foreground"
                dateTime={message.createdAt}
                title={formatAbsoluteTime(message.createdAt) || undefined}
              >
                {formatRelativeTime(message.createdAt)}
              </time>
              {message.editedAt && <span className="text-[11px] text-muted-foreground">(edited)</span>}
            </div>
          )}
        </div>
      </div>

      {message.imageUrl && (
        <ViewChatImageDialog
          open={lightboxOpen}
          imageUrl={message.imageUrl}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
