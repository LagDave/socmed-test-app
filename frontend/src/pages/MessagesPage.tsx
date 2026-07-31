import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ImagePlus, MessageCircle, Palette, SendHorizontal } from "lucide-react";
import { api } from "@/api/client";
import {
  CONVERSATION_THEME,
  CONVERSATION_UPDATED,
  MESSAGE_NEW,
  MESSAGE_REACTION,
  MESSAGE_UNSENT,
  getMessagesSocket,
  type ConversationThemePayload,
  type ConversationUpdatedPayload,
  type MessageEventPayload,
} from "@/api/socket";
import type { ConversationListItem, ConversationThemeView, MessageView, PublicUser } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ChatThemePicker } from "@/components/ChatThemePicker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ConversationListRow } from "@/components/ConversationListRow";
import { MessageBubbleRow } from "@/components/MessageBubbleRow";
import { MessagesFriendPicker } from "@/components/MessagesFriendPicker";
import {
  MessageDaySeparator,
  MessagesEmptyThread,
  MessagesErrorBanner,
  MessagesRowSkeleton,
  MessagesThreadSkeleton,
} from "@/components/MessagesUiHelpers";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useSocketConnected } from "@/hooks/useMessagesSocket";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatMessageDay,
  isSameCalendarDay,
  messagesShareGroup,
} from "@/lib/formatMessageDay";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { updateConversationTheme } from "@/api/messages";
import {
  chatThemeCssVars,
  resolveConversationTheme,
} from "@/lib/chatThemeApply";
import type { ChatTheme } from "@/api/types";
import { cn } from "@/lib/utils";

const POLL_MS = 2500;

function mergeById(prev: MessageView[], incoming: MessageView[]): MessageView[] {
  const map = new Map<string, MessageView>();
  for (const m of prev) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function ThreadView({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketConnected = useSocketConnected();
  const [peer, setPeer] = useState<PublicUser | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingUnsendId, setPendingUnsendId] = useState<string | null>(null);
  const [unsending, setUnsending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(true);
  const [conversationTheme, setConversationTheme] = useState<ConversationThemeView | null>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const generationRef = useRef(0);
  const themePickerOpenRef = useRef(false);
  const stickToBottomRef = useRef(true);

  themePickerOpenRef.current = themePickerOpen;

  function scrollThreadToBottom(behavior: ScrollBehavior = "auto") {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;
    stickToBottomRef.current = true;
    setPeer(null);
    setMessages([]);
    setHasMore(false);
    setError(null);
    setBody("");
    setLoadingThread(true);
    setConversationTheme(null);
    setThemePickerOpen(false);

    async function loadInitial() {
      try {
        const data = await api.get<{
          conversationId: string;
          peer: PublicUser;
          messages: MessageView[];
          hasMore: boolean;
          theme: ConversationThemeView;
        }>(`/api/messages/conversations/${conversationId}`);
        if (generation !== generationRef.current) return;
        setPeer(data.peer);
        setMessages(data.messages);
        setHasMore(Boolean(data.hasMore));
        setConversationTheme(data.theme);
        setLoadingThread(false);
        if (generation !== generationRef.current) return;
        await api.post(`/api/messages/conversations/${conversationId}/read`);
      } catch (e) {
        if (generation !== generationRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load conversation");
      } finally {
        if (generation === generationRef.current) setLoadingThread(false);
      }
    }

    void loadInitial();
    return () => {
      generationRef.current += 1;
    };
  }, [conversationId]);

  useEffect(() => {
    if (socketConnected) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const generation = generationRef.current;
      void (async () => {
        try {
          const data = await api.get<{
            conversationId: string;
            peer: PublicUser;
            messages: MessageView[];
            hasMore: boolean;
            theme: ConversationThemeView;
          }>(`/api/messages/conversations/${conversationId}`);
          if (generation !== generationRef.current) return;
          setPeer(data.peer);
          setMessages((prev) => mergeById(prev, data.messages));
          if (!themePickerOpenRef.current) {
            setConversationTheme(data.theme);
          }
          if (generation !== generationRef.current) return;
          await api.post(`/api/messages/conversations/${conversationId}/read`);
        } catch {
          /* poll failures are non-fatal */
        }
      })();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [conversationId, socketConnected]);

  useEffect(() => {
    const socket = getMessagesSocket();
    const generation = generationRef.current;

    const applyMessagePatch = (payload: MessageEventPayload) => {
      const msg = payload.message;
      if (msg.conversationId !== conversationId) return;
      if (generation !== generationRef.current) return;
      setMessages((prev) => mergeById(prev, [msg]));
    };

    const applyInboundNewMessage = (payload: MessageEventPayload) => {
      const msg = payload.message;
      if (msg.conversationId !== conversationId) return;
      if (generation !== generationRef.current) return;
      setMessages((prev) => mergeById(prev, [msg]));
      if (msg.senderId === user?.id) return;
      stickToBottomRef.current = true;
      void api.post(`/api/messages/conversations/${conversationId}/read`).catch(() => undefined);
    };

    socket.on(MESSAGE_NEW, applyInboundNewMessage);
    socket.on(MESSAGE_UNSENT, applyMessagePatch);
    socket.on(MESSAGE_REACTION, applyMessagePatch);

    const applyTheme = (payload: ConversationThemePayload) => {
      if (payload.conversationId !== conversationId) return;
      if (generation !== generationRef.current) return;
      setConversationTheme({
        theme: payload.theme,
        updatedAt: payload.updatedAt,
        updatedBy: payload.updatedBy,
      });
    };
    socket.on(CONVERSATION_THEME, applyTheme);

    return () => {
      socket.off(MESSAGE_NEW, applyInboundNewMessage);
      socket.off(MESSAGE_UNSENT, applyMessagePatch);
      socket.off(MESSAGE_REACTION, applyMessagePatch);
      socket.off(CONVERSATION_THEME, applyTheme);
    };
  }, [conversationId, user?.id]);

  useLayoutEffect(() => {
    if (loadingThread || !stickToBottomRef.current) return;
    scrollThreadToBottom("auto");
    const id = window.requestAnimationFrame(() => {
      scrollThreadToBottom("auto");
    });
    return () => window.cancelAnimationFrame(id);
  }, [loadingThread, conversationId, messages]);

  useEffect(() => {
    if (loadingThread) return;
    const el = scrollRef.current;
    if (!el) return;

    const stickIfNeeded = () => {
      if (!stickToBottomRef.current) return;
      scrollThreadToBottom("auto");
    };

    const ro = new ResizeObserver(stickIfNeeded);
    ro.observe(el);
    const content = el.firstElementChild;
    if (content) ro.observe(content);

    return () => ro.disconnect();
  }, [loadingThread, conversationId]);

  async function sendText(text: string, options?: { clearComposer?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed || sending) return false;
    const generation = generationRef.current;
    setSending(true);
    setError(null);
    stickToBottomRef.current = true;
    try {
      const data = await api.post<{ message: MessageView }>(
        `/api/messages/conversations/${conversationId}/messages`,
        { body: trimmed }
      );
      if (generation !== generationRef.current) return false;
      if (options?.clearComposer !== false) setBody("");
      setMessages((prev) => mergeById(prev, [data.message]));
      if (generation !== generationRef.current) return false;
      await api.post(`/api/messages/conversations/${conversationId}/read`);
      return true;
    } catch (err) {
      if (generation !== generationRef.current) return false;
      setError(err instanceof Error ? err.message : "Send failed");
      return false;
    } finally {
      if (generation === generationRef.current) setSending(false);
    }
  }

  async function loadEarlier() {
    if (loadingEarlier || !hasMore || messages.length === 0) return;
    const oldestId = messages[0]?.id;
    if (!oldestId) return;
    const generation = generationRef.current;
    setLoadingEarlier(true);
    stickToBottomRef.current = false;
    try {
      const data = await api.get<{
        conversationId: string;
        peer: PublicUser;
        messages: MessageView[];
        hasMore: boolean;
      }>(`/api/messages/conversations/${conversationId}?before=${encodeURIComponent(oldestId)}`);
      if (generation !== generationRef.current) return;
      setMessages((prev) => mergeById(data.messages, prev));
      setHasMore(Boolean(data.hasMore));
    } catch (e) {
      if (generation !== generationRef.current) return;
      setError(e instanceof Error ? e.message : "Failed to load earlier messages");
    } finally {
      if (generation === generationRef.current) setLoadingEarlier(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    await sendText(text);
  }

  async function onImage(file: File | null) {
    if (!file || sending) return;
    const generation = generationRef.current;
    setSending(true);
    setError(null);
    stickToBottomRef.current = true;
    try {
      const uploaded = await api.upload<{ url: string }>("/api/uploads", file);
      if (generation !== generationRef.current) return;
      const caption = body.trim() || undefined;
      const data = await api.post<{ message: MessageView }>(
        `/api/messages/conversations/${conversationId}/messages`,
        { body: caption, imageUrl: uploaded.url }
      );
      if (generation !== generationRef.current) return;
      setBody("");
      setMessages((prev) => mergeById(prev, [data.message]));
      if (generation !== generationRef.current) return;
      await api.post(`/api/messages/conversations/${conversationId}/read`);
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (generation === generationRef.current) {
        setSending(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    }
  }

  async function confirmUnsend() {
    if (!pendingUnsendId || unsending) return;
    const generation = generationRef.current;
    setUnsending(true);
    try {
      const data = await api.delete<{ message: MessageView }>(
        `/api/messages/messages/${pendingUnsendId}`
      );
      if (generation !== generationRef.current) return;
      setMessages((prev) => prev.map((m) => (m.id === pendingUnsendId ? data.message : m)));
      setPendingUnsendId(null);
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(err instanceof Error ? err.message : "Unsend failed");
    } finally {
      if (generation === generationRef.current) setUnsending(false);
    }
  }

  function patchMessageReaction(messageId: string, reactionSummary: MessageView["reactionSummary"]) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reactionSummary } : m))
    );
  }

  async function applyThemeChoice(payload: ChatTheme | { reset: true }) {
    setThemeSaving(true);
    setError(null);
    try {
      const updated = await updateConversationTheme(conversationId, payload);
      setConversationTheme(updated);
      setThemePickerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update theme");
    } finally {
      setThemeSaving(false);
    }
  }

  async function sendWordEffect(word: string) {
    setThemePickerOpen(false);
    await sendText(word, { clearComposer: false });
  }

  const resolvedTheme = resolveConversationTheme(conversationTheme);
  const themeVars = chatThemeCssVars(resolvedTheme);
  const peerProfilePath = peer?.username ? `/u/${peer.username}` : peer ? `/u/${peer.id}` : "#";

  return (
    <section className="space-y-4">
      <div
        className="feed-card relative flex h-[calc(100dvh-7rem)] min-h-[420px] flex-col overflow-hidden"
        data-chat-theme={resolvedTheme.active ? "true" : undefined}
        style={themeVars}
      >
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card/95 px-3 py-3 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Back to inbox"
            onClick={() => navigate("/messages")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {peer ? (
            <Link to={peerProfilePath} className="flex min-w-0 flex-1 items-center gap-3">
              <ProfileAvatar
                displayName={peer.displayName}
                avatarUrl={peer.avatarUrl}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold leading-snug">{peer.displayName}</p>
                {peer.username && (
                  <p className="truncate text-xs text-muted-foreground">@{peer.username}</p>
                )}
              </div>
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="min-w-0 space-y-1.5">
                <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Customize chat theme"
            onClick={() => setThemePickerOpen(true)}
          >
            <Palette className="h-5 w-5" />
          </Button>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
          style={resolvedTheme.active ? { background: resolvedTheme.background } : undefined}
          onScroll={() => {
            const el = scrollRef.current;
            if (!el) return;
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            stickToBottomRef.current = distanceFromBottom < 80;
          }}
        >
          {loadingThread ? (
            <MessagesThreadSkeleton />
          ) : (
            <div className="space-y-3">
              {hasMore && (
                <div className="flex justify-center pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={loadingEarlier}
                    onClick={() => void loadEarlier()}
                  >
                    {loadingEarlier ? "Loading…" : "Load earlier messages"}
                  </Button>
                </div>
              )}
              {messages.length === 0 && peer && !error && (
                <MessagesEmptyThread peerName={peer.displayName} />
              )}
              {messages.map((m, index) => {
                const prev = index > 0 ? messages[index - 1] : null;
                const next = index < messages.length - 1 ? messages[index + 1] : null;
                const mine = m.senderId === user?.id;
                const showDay =
                  !prev || !isSameCalendarDay(prev.createdAt, m.createdAt);
                const showAvatar = !mine && (!prev || !messagesShareGroup(prev, m));
                const showMeta = !next || !messagesShareGroup(m, next);

                return (
                  <div key={m.id} className="space-y-3">
                    {showDay && <MessageDaySeparator label={formatMessageDay(m.createdAt)} />}
                    <MessageBubbleRow
                      message={m}
                      mine={mine}
                      peer={peer}
                      showAvatar={showAvatar}
                      showMeta={showMeta}
                      peerProfilePath={peerProfilePath}
                      onUnsend={setPendingUnsendId}
                      onReactionChange={patchMessageReaction}
                      onError={setError}
                      themed={resolvedTheme.active}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="px-4 pb-2">
            <MessagesErrorBanner message={error} />
          </div>
        )}

        <form onSubmit={onSend} className="border-t border-border px-3 py-3">
          <div
            className={cn(
              "flex items-end gap-2 rounded-2xl px-2 py-1.5",
              !resolvedTheme.active && "bg-secondary/50"
            )}
            style={
              resolvedTheme.active
                ? {
                    backgroundColor: "color-mix(in srgb, var(--chat-accent) 18%, transparent)",
                  }
                : undefined
            }
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
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Attach image"
              disabled={sending}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Textarea
              ref={composerRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={submitOnEnter}
              placeholder="Message — try love, congrats, or wow for effects"
              aria-label="Message"
              rows={1}
              disabled={sending}
              className="max-h-32 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-6 shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              aria-label="Send"
              disabled={sending || !body.trim()}
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
        busy={themeSaving || sending}
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
    </section>
  );
}

function InboxView() {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function reloadInbox() {
    try {
      const d = await api.get<{ conversations: ConversationListItem[] }>(
        "/api/messages/conversations"
      );
      setItems(d.conversations);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadInbox();
  }, []);

  useEffect(() => {
    const socket = getMessagesSocket();
    const onUpdated = (_payload: ConversationUpdatedPayload) => {
      void reloadInbox();
    };
    const onMessage = (_payload: MessageEventPayload) => {
      void reloadInbox();
    };
    socket.on(CONVERSATION_UPDATED, onUpdated);
    socket.on(MESSAGE_NEW, onMessage);
    socket.on(MESSAGE_UNSENT, onMessage);
    return () => {
      socket.off(CONVERSATION_UPDATED, onUpdated);
      socket.off(MESSAGE_NEW, onMessage);
      socket.off(MESSAGE_UNSENT, onMessage);
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat with friends.</p>
      </div>

      {error && (
        <div className="px-1">
          <MessagesErrorBanner message={error} />
        </div>
      )}

      <div className="feed-card p-5">
        <MessagesFriendPicker hasConversations={items.length > 0} />
      </div>

      {loading && (
        <div className="feed-card p-5">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Conversations</h2>
          <div className="mt-3">
            <MessagesRowSkeleton rows={3} />
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="feed-card p-5">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Conversations</h2>
          <ul className="mt-3 space-y-1">
            {items.map((c) => (
              <ConversationListRow key={c.id} item={c} />
            ))}
          </ul>
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="feed-card p-5">
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <MessageCircle
              className="size-10 text-muted-foreground/40"
              aria-hidden="true"
              strokeWidth={1.25}
            />
            <p className="text-sm text-muted-foreground">
              No conversations yet. Pick a friend above to start chatting.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export function MessagesPage() {
  const { conversationId } = useParams();
  if (conversationId) {
    return <ThreadView conversationId={conversationId} />;
  }
  return <InboxView />;
}
