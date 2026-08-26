import { useEffect, useRef, type CSSProperties, type FormEvent, type KeyboardEvent, type MutableRefObject, type RefObject } from "react";
import { Link, type NavigateFunction } from "react-router-dom";
import { ChevronLeft, ImagePlus, MoreVertical, Palette, Pin, Search, SendHorizontal, Trash2, X } from "lucide-react";
import type { ChatTheme, ConversationThemeView, MessageView, PeerPresence, PublicUser, ReactionSummary } from "@/api/types";
import { ChatThemePicker } from "@/components/ChatThemePicker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MessageBubbleRow } from "@/components/MessageBubbleRow";
import { MessagePinActivityRow } from "@/components/messages/MessagePinActivityRow";
import { MessageComposerEmojiPicker } from "@/components/MessageComposerEmojiPicker";
import { MessageDaySeparator, MessageSystemLog, MessagesEmptyThread, MessagesErrorBanner, MessagesThreadSkeleton } from "@/components/MessagesUiHelpers";
import { OnlinePresenceIndicator } from "@/components/OnlinePresenceIndicator";
import { PeerPresenceStatus } from "@/components/PeerPresenceStatus";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { TypingIndicator } from "@/components/TypingIndicator";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { formatMessageDay, isSameCalendarDay, messagesHaveTimeGap, messagesShareGroup } from "@/lib/formatMessageDay";
import { formatMessageTimeSeparator } from "@/lib/formatRelativeTime";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { cn } from "@/lib/utils";
import type { ResolvedChatTheme } from "@/lib/chatThemeApply";
import type { ThreadTimelineItem } from "@/components/messages/threadTimeline";

type PendingDeleteConversation = { id: string; peerName: string };
type ReplyPreview = { name: string; snippet: string; imageUrl: string | null };
type SetString = (value: string | null | ((previous: string | null) => string | null)) => void;

const TOP_THREAD_LOAD_ROOT_MARGIN = "96px 0px 0px";
const BOTTOM_THREAD_LOAD_ROOT_MARGIN = "0px 0px 96px";

function hasMessageReaction(message: MessageView): boolean {
  return Object.values(message.reactionSummary.counts).some((count) => count > 0);
}

type ThreadViewContentProps = {
  embedded: boolean;
  user: PublicUser | null;
  resolvedTheme: ResolvedChatTheme;
  themeVars: CSSProperties;
  navigate: NavigateFunction;
  peer: PublicUser | null;
  peerPresence: PeerPresence | null;
  peerProfilePath: string;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  setThemePickerOpen: (open: boolean) => void;
  onOpenPinnedMessages: () => void;
  setPendingDelete: (value: PendingDeleteConversation | null) => void;
  conversationId: string;
  bottomRef: RefObject<HTMLDivElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  stickToBottomRef: MutableRefObject<boolean>;
  canHover: boolean;
  setTappedMessageId: SetString;
  loadingThread: boolean;
  hasMore: boolean;
  hasMoreNewer: boolean;
  loadingEarlier: boolean;
  loadingNewer: boolean;
  loadEarlier: () => Promise<void>;
  loadNewer: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
  isPeerTyping: boolean;
  threadTimeline: ThreadTimelineItem[];
  focusedMessageId: string | null;
  searchHighlightQuery: string | null;
  peerLastReadAt: string | null;
  editingMessageId: string | null;
  tappedMessageId: string | null;
  startEdit: (messageId: string) => void;
  patchMessageReaction: (messageId: string, reactionSummary: ReactionSummary) => void;
  pinnedMessageIds: Set<string>;
  pinSavingMessageId: string | null;
  changeMessagePin: (messageId: string, shouldPin: boolean) => Promise<void>;
  setReplyToMessage: (message: MessageView | null) => void;
  latestOwnMessageId: string | null;
  body: string;
  onSend: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  composeBusy: boolean;
  cancelEdit: () => void;
  replyPreview: ReplyPreview | null;
  fileRef: RefObject<HTMLInputElement | null>;
  onImage: (file: File | null) => Promise<void>;
  insertComposerEmoji: (emoji: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setBody: (body: string) => void;
  stopTyping: () => void;
  handleComposeKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  editingMessage: MessageView | null;
  themePickerOpen: boolean;
  conversationTheme: ConversationThemeView | null;
  themeSaving: boolean;
  applyThemeChoice: (theme: ChatTheme | { reset: true }) => Promise<void>;
  sendWordEffect: (word: string) => Promise<void>;
  pendingUnsendId: string | null;
  unsending: boolean;
  setPendingUnsendId: SetString;
  confirmUnsend: () => Promise<void>;
  pendingDelete: PendingDeleteConversation | null;
  deleting: boolean;
  confirmDeleteConversation: () => Promise<void>;
  deleteConversationDescription: (peerName: string) => string;
};

export function ThreadViewContent(props: ThreadViewContentProps) {
  const {
    embedded, user, resolvedTheme, themeVars, navigate, peer, peerPresence, peerProfilePath, isSearchOpen, onToggleSearch, setThemePickerOpen, onOpenPinnedMessages,
    setPendingDelete, conversationId, bottomRef, scrollRef, stickToBottomRef, canHover, setTappedMessageId,
    loadingThread, hasMore, hasMoreNewer, loadingEarlier, loadingNewer, loadEarlier, loadNewer, error, setError, isPeerTyping,
    threadTimeline, focusedMessageId, searchHighlightQuery, peerLastReadAt, editingMessageId, tappedMessageId, startEdit, patchMessageReaction, pinnedMessageIds, pinSavingMessageId, changeMessagePin,
    setReplyToMessage, latestOwnMessageId, body, onSend, composeBusy, cancelEdit, replyPreview,
    fileRef, onImage, insertComposerEmoji, textareaRef, setBody, stopTyping, handleComposeKeyDown,
    editingMessage, themePickerOpen, conversationTheme, themeSaving, applyThemeChoice, sendWordEffect,
    pendingUnsendId, unsending, setPendingUnsendId, confirmUnsend, pendingDelete, deleting,
    confirmDeleteConversation, deleteConversationDescription,
  } = props;
  const loadEarlierRef = useRef(loadEarlier);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const hasTriggeredAutoLoadRef = useRef(false);
  const hasTriggeredNewerLoadRef = useRef(false);

  useEffect(() => {
    loadEarlierRef.current = loadEarlier;
  }, [loadEarlier]);

  useEffect(() => {
    hasTriggeredAutoLoadRef.current = false;
    hasTriggeredNewerLoadRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    hasTriggeredNewerLoadRef.current = false;
  }, [focusedMessageId]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = topSentinelRef.current;
    if (!root || !sentinel || loadingThread || loadingEarlier || !hasMore) return;
    hasTriggeredAutoLoadRef.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          hasTriggeredAutoLoadRef.current = false;
          return;
        }
        if (hasTriggeredAutoLoadRef.current) return;
        hasTriggeredAutoLoadRef.current = true;
        void loadEarlierRef.current();
      },
      { root, rootMargin: TOP_THREAD_LOAD_ROOT_MARGIN, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingEarlier, loadingThread, scrollRef]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = bottomSentinelRef.current;
    if (!root || !sentinel || loadingThread || loadingNewer || !hasMoreNewer) return;
    hasTriggeredNewerLoadRef.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          hasTriggeredNewerLoadRef.current = false;
          return;
        }
        if (hasTriggeredNewerLoadRef.current) return;
        hasTriggeredNewerLoadRef.current = true;
        void loadNewer();
      },
      { root, rootMargin: BOTTOM_THREAD_LOAD_ROOT_MARGIN, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreNewer, loadingNewer, loadingThread, loadNewer, scrollRef]);

  return (
    <section className={cn("messages-page space-y-4", embedded && "lg:h-full lg:space-y-0")}>
      <div
        className={cn(
          "feed-card messages-thread-shell relative flex h-[calc(100dvh-7rem)] min-h-[70vh] flex-col overflow-hidden",
          embedded && "lg:h-full lg:min-h-0 lg:rounded-none lg:shadow-none"
        )}
        data-chat-theme={resolvedTheme.active ? "true" : undefined}
        style={themeVars}
      >
        <header className="messages-thread-header sticky top-0 z-10 shrink-0">
          <div className="messages-thread-header-inner">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="messages-thread-header-back h-9 w-9 shrink-0 rounded-full"
              aria-label="Back to inbox"
              onClick={() => navigate("/messages")}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </Button>

            {peer ? (
              <Link
                to={peerProfilePath}
                className="messages-thread-header-profile flex min-w-0 flex-1 items-center gap-3 text-inherit no-underline"
              >
                <span className="relative shrink-0">
                  <ProfileAvatar
                    displayName={peer.displayName}
                    avatarUrl={peer.avatarUrl}
                    size="sm"
                    className="messages-thread-header-avatar"
                  />
                  {peerPresence?.isOnline && <OnlinePresenceIndicator />}
                </span>
                <div className="min-w-0">
                  <p className="messages-thread-header-name truncate text-[15px] font-semibold leading-tight tracking-tight">
                    {peer.displayName}
                  </p>
                  {peerPresence ? (
                    <PeerPresenceStatus
                      presence={peerPresence}
                      labelStyle="active"
                      className="messages-thread-header-handle mt-0.5 block truncate"
                    />
                  ) : null}
                </div>
              </Link>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary/80" />
                <div className="min-w-0 space-y-1.5">
                  <div className="h-4 w-32 animate-pulse rounded-md bg-secondary/80" />
                  <div className="h-3 w-20 animate-pulse rounded-md bg-secondary/60" />
                </div>
              </div>
            )}

            <div className="messages-thread-header-actions shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="messages-thread-header-action h-8 w-8 rounded-full"
                aria-label={isSearchOpen ? "Close message search" : "Search messages"}
                aria-pressed={isSearchOpen}
                onClick={onToggleSearch}
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="messages-thread-header-action h-8 w-8 rounded-full"
                aria-label="Customize chat theme"
                onClick={() => setThemePickerOpen(true)}
              >
                <Palette className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="messages-thread-header-action h-8 w-8 rounded-full"
                    aria-label="Conversation options"
                    disabled={!peer}
                  >
                    <MoreVertical className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={!peer} onSelect={onOpenPinnedMessages}>
                    <Pin className="mr-2 h-4 w-4" />
                    Pinned messages
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={!peer}
                    onSelect={() => {
                      if (peer) {
                        setPendingDelete({ id: conversationId, peerName: peer.displayName });
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="messages-thread-pane scrollbar-none min-h-0 flex-1 overflow-y-auto px-5 py-3"
          onScroll={() => {
            const el = scrollRef.current;
            if (!el) return;
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            stickToBottomRef.current = distanceFromBottom < 80;
          }}
          onClick={() => {
            if (!canHover) setTappedMessageId(null);
          }}
        >
          {loadingThread ? (
            <MessagesThreadSkeleton />
          ) : (
            <div className="messages-thread-list">
              <div ref={topSentinelRef} className="h-px" aria-hidden="true" />
              {threadTimeline.length === 0 && peer && !error && (
                <MessagesEmptyThread peerName={peer.displayName} />
              )}
              {threadTimeline.map((item, timelineIndex) => {
                const prevItem = timelineIndex > 0 ? threadTimeline[timelineIndex - 1] : null;
                const showDay =
                  !prevItem || !isSameCalendarDay(prevItem.createdAt, item.createdAt);

                if (item.kind === "system-log") {
                  return (
                    <div key={item.key} className="message-system-log-row">
                      {showDay && <MessageDaySeparator label={formatMessageDay(item.createdAt)} />}
                      <MessageSystemLog text={item.log.text} />
                    </div>
                  );
                }

                if (item.kind === "pin-activity") {
                  return (
                    <div key={item.key} className="message-pin-activity-row">
                      {showDay && <MessageDaySeparator label={formatMessageDay(item.createdAt)} />}
                      <MessagePinActivityRow activity={item.activity} isCurrentUser={item.activity.actorId === user?.id} />
                    </div>
                  );
                }

                const m = item.message;
                const prev = prevItem?.kind === "message" ? prevItem.message : null;
                const nextItem = threadTimeline[timelineIndex + 1] ?? null;
                const next = nextItem?.kind === "message" ? nextItem.message : null;
                const mine = m.senderId === user?.id;
                const showAvatar = !mine && (!prev || !messagesShareGroup(prev, m));
                const groupedWithPrev = Boolean(prev && messagesShareGroup(prev, m));
                const groupedWithNext = Boolean(next && messagesShareGroup(m, next));
                const previousHasReaction = prev ? hasMessageReaction(prev) : false;
                const messageHasReaction = hasMessageReaction(m);
                const imagesBreakCompactGrouping = Boolean(prev?.imageUrl || m.imageUrl);
                const compactWithPrevious = Boolean(
                  prev &&
                    prev.senderId === m.senderId &&
                    !previousHasReaction &&
                    !messageHasReaction &&
                    !imagesBreakCompactGrouping
                );
                const showTimeGap = Boolean(prev && !showDay && messagesHaveTimeGap(prev, m));

                return (
                  <div
                    key={item.key}
                    className={cn(
                      "messages-thread-item",
                      groupedWithPrev && "messages-thread-item-grouped"
                    )}
                  >
                    {showDay && <MessageDaySeparator label={formatMessageDay(m.createdAt)} />}
                    {showTimeGap && (
                      <time className="message-time-separator" dateTime={m.createdAt}>
                        {formatMessageTimeSeparator(m.createdAt)}
                      </time>
                    )}
                    <MessageBubbleRow
                      message={m}
                      mine={mine}
                      peer={peer}
                      showAvatar={showAvatar}
                      peerLastReadAt={peerLastReadAt}
                      groupedWithPrev={groupedWithPrev}
                      groupedWithNext={groupedWithNext}
                      compactWithPrevious={compactWithPrevious}
                      peerProfilePath={peerProfilePath}
                      isBeingEdited={editingMessageId === m.id}
                      isSearchFocused={focusedMessageId === m.id}
                      searchHighlightQuery={searchHighlightQuery ?? undefined}
                      canHover={canHover}
                      touchRevealed={tappedMessageId === m.id}
                      onToggleTouchReveal={() =>
                        setTappedMessageId((prev) => (prev === m.id ? null : m.id))
                      }
                      onUnsend={setPendingUnsendId}
                      onStartEdit={startEdit}
                      onReactionChange={patchMessageReaction}
                      isPinned={pinnedMessageIds.has(m.id)}
                      pinSaving={pinSavingMessageId === m.id}
                      onPinChange={(messageId, shouldPin) => void changeMessagePin(messageId, shouldPin)}
                      onReply={(msg) => {
                        setTappedMessageId(null);
                        setReplyToMessage(msg);
                      }}
                      onError={setError}
                      themed={resolvedTheme.active}
                      showMessageStatus={mine && m.id === latestOwnMessageId}
                      allowSeenStatus
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div ref={bottomSentinelRef} className="h-px" aria-hidden="true" />
          <div ref={bottomRef} />
        </div>

        {error && <MessagesErrorBanner message={error} />}

        {isPeerTyping && peer && (
          <TypingIndicator
            displayName={peer.displayName}
            themed={resolvedTheme.active}
            className="messages-typing-indicator"
          />
        )}

        <form
          onSubmit={onSend}
          className={cn(
            "messages-composer-form border-t border-border bg-card px-5 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]",
            resolvedTheme.active && "border-transparent"
          )}
        >
          {editingMessageId && (
            <div className="mb-2 flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
              <span>Editing message</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                disabled={composeBusy}
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            </div>
          )}
          {replyPreview && (
            <div className="messages-composer-reply mb-2 flex items-start justify-between gap-2 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-muted-foreground">
                  Replying to{" "}
                  <span className="font-medium text-foreground">{replyPreview.name}</span>
                  {" · "}
                  <span className="text-foreground/90">{replyPreview.snippet}</span>
                </p>
                {replyPreview.imageUrl && (
                  <div className="user-media-stage mt-2 h-10 w-10 rounded">
                    <img src={replyPreview.imageUrl} alt="" className="user-media-thumbnail rounded" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Cancel reply"
                onClick={() => setReplyToMessage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div
            className={cn(
              "messages-composer-track flex items-end gap-2 rounded-full px-2 py-1.5",
              resolvedTheme.active && "border-transparent shadow-none"
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void onImage(e.target.files?.[0] ?? null)}
            />
            {user && (
              <ProfileAvatar
                displayName={user.displayName}
                avatarUrl={user.avatarUrl}
                size="sm"
                className="messages-composer-avatar"
              />
            )}
            <div className="flex shrink-0 items-center -space-x-1">
              {!editingMessageId && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Attach image"
                    disabled={composeBusy}
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <MessageComposerEmojiPicker disabled={composeBusy} onPick={insertComposerEmoji} />
                </>
              )}
            </div>
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => stopTyping()}
              onKeyDown={(e) => {
                handleComposeKeyDown(e);
                if (e.defaultPrevented) return;
                submitOnEnter(e);
              }}
              placeholder={editingMessageId ? "Edit message" : "Type a message"}
              aria-label={editingMessageId ? "Edit message" : "Message"}
              rows={1}
              disabled={composeBusy}
              className="max-h-32 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-6 shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              aria-label={editingMessageId ? "Save edit" : "Send"}
              disabled={
                composeBusy ||
                (editingMessage
                  ? !editingMessage.imageUrl && !body.trim()
                  : !body.trim())
              }
              style={
                resolvedTheme.active
                  ? {
                      backgroundColor: "var(--chat-accent)",
                      color: "var(--chat-accent-fg)",
                    }
                  : undefined
              }
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      <ChatThemePicker
        open={themePickerOpen}
        current={conversationTheme}
        busy={themeSaving || composeBusy}
        onApply={(payload) => void applyThemeChoice(payload)}
        onWordEffectSend={(word) => void sendWordEffect(word)}
        onClose={() => {
          if (!themeSaving) setThemePickerOpen(false);
        }}
      />

      <ConfirmDialog
        open={pendingUnsendId !== null}
        title="Unsend this message?"
        description="This removes the message for everyone in the chat."
        confirmLabel="Unsend"
        busy={unsending}
        onCancel={() => {
          if (!unsending) setPendingUnsendId(null);
        }}
        onConfirm={() => void confirmUnsend()}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete conversation?"
        description={
          pendingDelete ? deleteConversationDescription(pendingDelete.peerName) : undefined
        }
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDeleteConversation()}
      />
    </section>
  );
}
