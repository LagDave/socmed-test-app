import { useState, type MouseEvent, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Reply } from "lucide-react";
import type { MessageView, PublicUser } from "@/api/types";
import { MessageQuoteStrip } from "@/components/MessageQuoteStrip";
import { ReactionBar } from "@/components/ReactionBar";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { MessageStatusIconForMessage } from "@/components/MessageStatusIcon";
import { ViewImageDialog } from "@/components/ViewImageDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuArrow,
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

const MINIMUM_COUNT_FOR_REACTION_TOTAL = 2;

function messageReactionEntries(summary: MessageView["reactionSummary"]) {
  return REACTION_OPTIONS.map(({ emoji }) => ({ emoji, count: summary.counts[emoji] })).filter(
    ({ count }) => count > 0
  );
}

function MessageReactionBadge({
  reactions,
  mine,
  themed,
}: {
  reactions: Array<{ emoji: ReactionEmoji; count: number }>;
  mine: boolean;
  themed: boolean;
}) {
  return (
    <span
      className={cn(
        "message-reaction-badge absolute bottom-0 z-20 inline-flex translate-y-[30%] items-center gap-0.5 rounded-full px-1 py-px shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
        themed
          ? "border border-[var(--chat-accent)] bg-[color-mix(in_srgb,var(--chat-accent)_14%,white)] text-black"
          : "bg-white text-black",
        mine ? "right-2" : "left-1"
      )}
      aria-hidden="true"
    >
      {reactions.map(({ emoji, count }) => (
        <span key={emoji} className="inline-flex items-center gap-px">
          <ReactionIcon emoji={emoji} className="text-base leading-none" />
          {count >= MINIMUM_COUNT_FOR_REACTION_TOTAL && (
            <span className="text-[11px] font-semibold leading-none">{count}</span>
          )}
        </span>
      ))}
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
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "message-action-toolbar flex shrink-0 items-center gap-0 self-center transition-opacity",
        mine && "flex-row-reverse",
        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        isOptionsMenuOpen && "opacity-100",
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
        <DropdownMenu onOpenChange={setIsOptionsMenuOpen}>
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
          <DropdownMenuContent
            align="center"
            side="top"
            sideOffset={10}
            className="overflow-visible rounded-2xl border-border/70 px-1.5 py-1.5 shadow-lg shadow-black/10"
          >
            <DropdownMenuArrow className="-mt-px fill-popover" width={18} height={9} />
            <DropdownMenuItem
              disabled={pinSaving || !onPinChange}
              onSelect={() => onPinChange?.(message.id, !isPinned)}
            >
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
  compactWithPrevious = false,
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
  compactWithPrevious?: boolean;
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
  const reactionEntries = messageReactionEntries(message.reactionSummary);
  const showReactionBadge = !message.isUnsent && reactionEntries.length > 0;
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
        mine ? "flex-row-reverse" : "flex-row",
        !mine && compactWithPrevious && "-mt-2"
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
                            "user-media-stage block cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                              "user-media-full max-w-[220px]",
                              imageOnlyPlain
                                ? "rounded-[inherit]"
                                : "rounded-lg"
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
                {showReactionBadge && (
                  <MessageReactionBadge reactions={reactionEntries} mine={mine} themed={themed} />
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
                className="message-inline-timestamp text-[11px] text-muted-foreground"
                dateTime={message.createdAt}
                title={formatAbsoluteTime(message.createdAt) || undefined}
              >
                {formatRelativeTime(message.createdAt)}
              </time>
              {message.editedAt && <span className="message-inline-timestamp text-[11px] text-muted-foreground">(edited)</span>}
            </div>
          )}
        </div>
      </div>

      {message.imageUrl && (
        <ViewImageDialog
          open={lightboxOpen}
          imageUrl={message.imageUrl}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
