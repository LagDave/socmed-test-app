import { useEffect, useRef, type RefObject } from "react";
import type { MessageView, PublicUser } from "@/api/types";
import { MessageBubbleRow } from "@/components/MessageBubbleRow";
import {
  MessageDaySeparator,
  MessagesEmptyThread,
  MessagesThreadSkeleton,
} from "@/components/MessagesUiHelpers";
import { Button } from "@/components/ui/button";
import {
  formatMessageDay,
  isSameCalendarDay,
  messagesShareGroup,
} from "@/lib/formatMessageDay";

type ConversationMessageListProps = {
  messages: MessageView[];
  userId: string | undefined;
  peer: PublicUser | null;
  peerLastReadAt: string | null;
  peerProfilePath: string;
  loadingThread: boolean;
  hasMore: boolean;
  loadingEarlier: boolean;
  editingMessageId: string | null;
  canHover: boolean;
  tappedMessageId: string | null;
  focusedMessageId: string | null;
  searchHighlightQuery: string | null;
  themed: boolean;
  background: string | undefined;
  showEmptyThread: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  bottomRef: RefObject<HTMLDivElement | null>;
  onLoadEarlier: () => void;
  onThreadScroll: () => void;
  onThreadClick: () => void;
  onToggleTouchReveal: (messageId: string) => void;
  onUnsend: (messageId: string) => void;
  onStartEdit: (messageId: string) => void;
  onReactionChange: (messageId: string, reactionSummary: MessageView["reactionSummary"]) => void;
  onReply: (message: MessageView) => void;
  onError: (message: string) => void;
};

export function ConversationMessageList({
  messages,
  userId,
  peer,
  peerLastReadAt,
  peerProfilePath,
  loadingThread,
  hasMore,
  loadingEarlier,
  editingMessageId,
  canHover,
  tappedMessageId,
  focusedMessageId,
  searchHighlightQuery,
  themed,
  background,
  showEmptyThread,
  scrollRef,
  bottomRef,
  onLoadEarlier,
  onThreadScroll,
  onThreadClick,
  onToggleTouchReveal,
  onUnsend,
  onStartEdit,
  onReactionChange,
  onReply,
  onError,
}: ConversationMessageListProps) {
  const loadEarlierRef = useRef(onLoadEarlier);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const hasTriggeredAutoLoadRef = useRef(false);

  useEffect(() => {
    loadEarlierRef.current = onLoadEarlier;
  }, [onLoadEarlier]);

  useEffect(() => {
    if (!loadingEarlier) hasTriggeredAutoLoadRef.current = false;
  }, [loadingEarlier]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = topSentinelRef.current;
    if (!root || !sentinel || loadingThread || loadingEarlier || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          hasTriggeredAutoLoadRef.current = false;
          return;
        }
        if (hasTriggeredAutoLoadRef.current) return;
        hasTriggeredAutoLoadRef.current = true;
        loadEarlierRef.current();
      },
      { root, rootMargin: "96px 0px 0px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingEarlier, loadingThread, scrollRef]);

  return (
    <div
      ref={scrollRef}
      className="messages-thread-pane min-h-0 flex-1 overflow-y-auto px-4 py-4"
      style={background ? { background } : undefined}
      onScroll={onThreadScroll}
      onClick={onThreadClick}
    >
      {loadingThread ? (
        <MessagesThreadSkeleton />
      ) : (
        <div className="space-y-1">
          <div ref={topSentinelRef} className="h-px" aria-hidden="true" />
          {hasMore && (
            <div className="flex justify-center pb-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loadingEarlier}
                onClick={onLoadEarlier}
              >
                {loadingEarlier ? "Loading…" : "Load earlier messages"}
              </Button>
            </div>
          )}
          {messages.length === 0 && peer && showEmptyThread && (
            <MessagesEmptyThread peerName={peer.displayName} />
          )}
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
            const isMine = message.senderId === userId;
            const shouldShowDay =
              !previousMessage || !isSameCalendarDay(previousMessage.createdAt, message.createdAt);
            const shouldShowAvatar =
              !isMine && (!previousMessage || !messagesShareGroup(previousMessage, message));
            const isGroupedWithPrevious = Boolean(
              previousMessage && messagesShareGroup(previousMessage, message)
            );
            const isGroupedWithNext = Boolean(
              nextMessage && messagesShareGroup(message, nextMessage)
            );

            return (
              <div key={message.id}>
                {shouldShowDay && <MessageDaySeparator label={formatMessageDay(message.createdAt)} />}
                <MessageBubbleRow
                  message={message}
                  mine={isMine}
                  peer={peer}
                  showAvatar={shouldShowAvatar}
                  peerLastReadAt={peerLastReadAt}
                  groupedWithPrev={isGroupedWithPrevious}
                  groupedWithNext={isGroupedWithNext}
                  peerProfilePath={peerProfilePath}
                  isBeingEdited={editingMessageId === message.id}
                  isSearchFocused={focusedMessageId === message.id}
                  searchHighlightQuery={searchHighlightQuery ?? undefined}
                  canHover={canHover}
                  touchRevealed={tappedMessageId === message.id}
                  onToggleTouchReveal={() => onToggleTouchReveal(message.id)}
                  onUnsend={onUnsend}
                  onStartEdit={onStartEdit}
                  onReactionChange={onReactionChange}
                  onReply={onReply}
                  onError={onError}
                  themed={themed}
                />
              </div>
            );
          })}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
