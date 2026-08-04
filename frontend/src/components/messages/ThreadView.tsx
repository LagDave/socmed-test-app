import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { ThreadViewContent } from "@/components/messages/ThreadViewContent";
import { ConversationSearchPanel } from "@/components/messages/ConversationSearchPanel";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { deleteConversation, setMessagePinned, updateConversationTheme } from "@/api/messages";
import {
  CONVERSATION_PEER_READ,
  CONVERSATION_THEME,
  MESSAGE_DELIVERED,
  MESSAGE_EDITED,
  MESSAGE_NEW,
  MESSAGE_REACTION,
  MESSAGE_PINS_UPDATED,
  MESSAGE_UNSENT,
  getMessagesSocket,
  type ConversationPeerReadPayload,
  type ConversationThemePayload,
  type MessageDeliveredPayload,
  type MessageEventPayload,
  type MessagePinsUpdatedPayload,
} from "@/api/socket";
import type { ConversationThemeView, MessagePinActivityView, MessageView, PinnedMessageView, PublicUser, ThemeLogEntry } from "@/api/types";
import { PinnedMessagesDialog } from "@/components/messages/PinnedMessagesDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCanHover } from "@/hooks/useCanHover";
import { useConversationSearch } from "@/hooks/useConversationSearch";
import { useConversationSearchResultFocus } from "@/hooks/useConversationSearchResultFocus";
import { useSocketConnected } from "@/hooks/useMessagesSocket";
import { usePeerTyping, useTypingEmitter } from "@/hooks/useTypingIndicator";
import { chatThemeCssVars, resolveConversationTheme } from "@/lib/chatThemeApply";
import type { ChatTheme } from "@/api/types";
import { insertTextAtSelection } from "@/lib/composerEmojiOptions";
import { buildThreadTimeline, mergePinActivities, mergeThreadSystemLogs } from "@/components/messages/threadTimeline";
import { patchReplyTargetsUnsent, replyTargetPreview } from "@/components/messages/threadViewUtils";

const POLL_MS = 2500;

function focusComposer(textareaRef: RefObject<HTMLTextAreaElement | null>) {
  requestAnimationFrame(() => {
    textareaRef.current?.focus();
  });
}

type PendingDeleteConversation = {
  id: string;
  peerName: string;
};

function deleteConversationDescription(peerName: string): string {
  return `This permanently deletes the chat and all messages from your inbox. ${peerName} will still have the conversation.`;
}

function mergeById(prev: MessageView[], incoming: MessageView[]): MessageView[] {
  const map = new Map<string, MessageView>();
  for (const m of prev) map.set(m.id, m);
  for (const m of incoming) {
    const existing = map.get(m.id);
    map.set(m.id, {
      ...m,
      deliveredAt: m.deliveredAt ?? existing?.deliveredAt ?? null,
      editedAt: m.editedAt ?? existing?.editedAt ?? null,
    });
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function ThreadView({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketConnected = useSocketConnected();
  const [peer, setPeer] = useState<PublicUser | null>(null);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingUnsendId, setPendingUnsendId] = useState<string | null>(null);
  const [unsending, setUnsending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteConversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingThread, setLoadingThread] = useState(true);
  const [conversationTheme, setConversationTheme] = useState<ConversationThemeView | null>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<MessageView | null>(null);
  const [tappedMessageId, setTappedMessageId] = useState<string | null>(null);
  const [systemLogs, setSystemLogs] = useState<ThemeLogEntry[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessageView[]>([]);
  const [pinActivities, setPinActivities] = useState<MessagePinActivityView[]>([]);
  const [pinSavingMessageId, setPinSavingMessageId] = useState<string | null>(null);
  const [pinnedMessagesDialogOpen, setPinnedMessagesDialogOpen] = useState(false);
  const canHover = useCanHover();
  const isPeerTyping = usePeerTyping(conversationId, user?.id);
  const conversationSearch = useConversationSearch(conversationId);
  const { closeSearch, openSearch, refreshSearch, resetSearch } = conversationSearch;
  const { stopTyping } = useTypingEmitter({
    conversationId,
    text: body,
    connected: socketConnected,
    active: !sending && !editingMessageId,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generationRef = useRef(0);
  const themePickerOpenRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const replyTargetIdRef = useRef<string | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const {
    clearFocusedSearch,
    focusSearchResult,
    focusedMessageId,
    oldestPagedMessageIdRef,
    searchHighlightQuery,
  } = useConversationSearchResultFocus({
    conversationId,
    closeSearch,
    generationRef,
    scrollRef,
    setError,
    setHasMore,
    setMessages,
    stickToBottomRef,
  });

  useEffect(() => {
    replyTargetIdRef.current = replyToMessage?.id ?? null;
  }, [replyToMessage?.id]);

  useEffect(() => {
    peerIdRef.current = peer?.id ?? null;
  }, [peer?.id]);

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
    setPeerLastReadAt(null);
    setMessages([]);
    oldestPagedMessageIdRef.current = null;
    setHasMore(false);
    setError(null);
    setBody("");
    setEditingMessageId(null);
    setReplyToMessage(null);
    setTappedMessageId(null);
    clearFocusedSearch();
    setSystemLogs([]);
    setPinnedMessages([]);
    setPinActivities([]);
    setPinSavingMessageId(null);
    setPinnedMessagesDialogOpen(false);
    setLoadingThread(true);
    setConversationTheme(null);
    setThemePickerOpen(false);

    async function loadInitial() {
      try {
        const data = await api.get<{
          conversationId: string;
          peer: PublicUser;
          peerLastReadAt: string | null;
          messages: MessageView[];
          hasMore: boolean;
          theme: ConversationThemeView;
          themeLogs?: ThemeLogEntry[];
          pinnedMessages: PinnedMessageView[];
          pinActivities: MessagePinActivityView[];
        }>(`/api/messages/conversations/${conversationId}?restore=1`);
        if (generation !== generationRef.current) return;
        setPeer(data.peer);
        setPeerLastReadAt(data.peerLastReadAt);
        setMessages(data.messages);
        oldestPagedMessageIdRef.current = data.messages[0]?.id ?? null;
        setHasMore(Boolean(data.hasMore));
        setConversationTheme(data.theme);
        setSystemLogs(data.themeLogs ?? []);
        setPinnedMessages(data.pinnedMessages);
        setPinActivities(data.pinActivities);
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
  }, [clearFocusedSearch, conversationId, oldestPagedMessageIdRef]);

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
            peerLastReadAt: string | null;
            messages: MessageView[];
            hasMore: boolean;
            theme: ConversationThemeView;
            themeLogs?: ThemeLogEntry[];
            pinnedMessages: PinnedMessageView[];
            pinActivities: MessagePinActivityView[];
          }>(`/api/messages/conversations/${conversationId}`);
          if (generation !== generationRef.current) return;
          setPeer(data.peer);
          setPeerLastReadAt(data.peerLastReadAt);
          setMessages((prev) => {
            let merged = mergeById(prev, data.messages);
            for (const msg of data.messages) {
              if (msg.isUnsent) merged = patchReplyTargetsUnsent(merged, msg.id);
            }
            return merged;
          });
          if (!themePickerOpenRef.current) {
            setConversationTheme(data.theme);
          }
          setPinnedMessages(data.pinnedMessages);
          setPinActivities(data.pinActivities);
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
      setMessages((prev) => {
        const merged = mergeById(prev, [msg]);
        return msg.isUnsent ? patchReplyTargetsUnsent(merged, msg.id) : merged;
      });
      if (replyTargetIdRef.current === msg.id && msg.isUnsent) {
        setReplyToMessage(null);
      }
    };

    const applySearchAwarePatch = (payload: MessageEventPayload) => {
      applyMessagePatch(payload);
      refreshSearch();
    };

    const applyInboundNewMessage = (payload: MessageEventPayload) => {
      const msg = payload.message;
      if (msg.conversationId !== conversationId) return;
      if (generation !== generationRef.current) return;
      setMessages((prev) => mergeById(prev, [msg]));
      refreshSearch();
      if (msg.senderId === user?.id) return;
      stickToBottomRef.current = true;
      void api.post(`/api/messages/conversations/${conversationId}/read`).catch(() => undefined);
    };

    const applyMessageDelivered = (payload: MessageDeliveredPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (generation !== generationRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, deliveredAt: payload.deliveredAt } : m
        )
      );
    };

    const applyPeerRead = (payload: ConversationPeerReadPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (generation !== generationRef.current) return;
      if (payload.readerId !== peerIdRef.current) return;
      setPeerLastReadAt(payload.peerLastReadAt);
    };

    const applyPinnedMessages = (payload: MessagePinsUpdatedPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (generation !== generationRef.current) return;
      setPinnedMessages(payload.pinnedMessages);
      setPinActivities((previous) => mergePinActivities(previous, payload.pinActivity));
      if (payload.pinActivity) stickToBottomRef.current = true;
    };

    socket.on(MESSAGE_NEW, applyInboundNewMessage);
    socket.on(MESSAGE_UNSENT, applySearchAwarePatch);
    socket.on(MESSAGE_EDITED, applySearchAwarePatch);
    socket.on(MESSAGE_REACTION, applyMessagePatch);
    socket.on(MESSAGE_DELIVERED, applyMessageDelivered);
    socket.on(CONVERSATION_PEER_READ, applyPeerRead);
    socket.on(MESSAGE_PINS_UPDATED, applyPinnedMessages);

    const applyTheme = (payload: ConversationThemePayload) => {
      if (payload.conversationId !== conversationId) return;
      if (generation !== generationRef.current) return;
      setConversationTheme({
        theme: payload.theme,
        updatedAt: payload.updatedAt,
        updatedBy: payload.updatedBy,
      });
      if (payload.logEntry) {
        setSystemLogs((prev) => mergeThreadSystemLogs(prev, [payload.logEntry]));
        stickToBottomRef.current = true;
      }
    };
    socket.on(CONVERSATION_THEME, applyTheme);

    return () => {
      socket.off(MESSAGE_NEW, applyInboundNewMessage);
      socket.off(MESSAGE_UNSENT, applySearchAwarePatch);
      socket.off(MESSAGE_EDITED, applySearchAwarePatch);
      socket.off(MESSAGE_REACTION, applyMessagePatch);
      socket.off(MESSAGE_DELIVERED, applyMessageDelivered);
      socket.off(CONVERSATION_PEER_READ, applyPeerRead);
      socket.off(MESSAGE_PINS_UPDATED, applyPinnedMessages);
      socket.off(CONVERSATION_THEME, applyTheme);
    };
  }, [conversationId, refreshSearch, user?.id]);

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

  useEffect(() => {
    if (!replyToMessage || editingMessageId) return;
    textareaRef.current?.focus();
  }, [replyToMessage, editingMessageId]);

  useEffect(() => {
    if (!editingMessageId) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [editingMessageId]);

  async function sendText(text: string, options?: { clearComposer?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed || sending) return false;
    stopTyping();
    const generation = generationRef.current;
    setSending(true);
    setError(null);
    stickToBottomRef.current = true;
    try {
      const payload: { body: string; replyToMessageId?: string } = { body: trimmed };
      if (replyToMessage) payload.replyToMessageId = replyToMessage.id;
      const data = await api.post<{ message: MessageView }>(
        `/api/messages/conversations/${conversationId}/messages`,
        payload
      );
      if (generation !== generationRef.current) return false;
      if (options?.clearComposer !== false) {
        setBody("");
        setReplyToMessage(null);
      }
      setMessages((prev) => mergeById(prev, [data.message]));
      if (generation !== generationRef.current) return false;
      await api.post(`/api/messages/conversations/${conversationId}/read`);
      focusComposer(textareaRef);
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
    if (loadingEarlier || !hasMore) return;
    const oldestId = oldestPagedMessageIdRef.current;
    if (!oldestId) return;
    const generation = generationRef.current;
    setLoadingEarlier(true);
    stickToBottomRef.current = false;
    try {
      const data = await api.get<{
        conversationId: string;
        peer: PublicUser;
        peerLastReadAt: string | null;
        messages: MessageView[];
        hasMore: boolean;
      }>(`/api/messages/conversations/${conversationId}?before=${encodeURIComponent(oldestId)}`);
      if (generation !== generationRef.current) return;
      setMessages((prev) => mergeById(data.messages, prev));
      oldestPagedMessageIdRef.current = data.messages[0]?.id ?? oldestPagedMessageIdRef.current;
      setHasMore(Boolean(data.hasMore));
    } catch (e) {
      if (generation !== generationRef.current) return;
      setError(e instanceof Error ? e.message : "Failed to load earlier messages");
    } finally {
      if (generation === generationRef.current) setLoadingEarlier(false);
    }
  }

  function insertComposerEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setBody((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const { nextValue, nextCursor } = insertTextAtSelection(body, emoji, start, end);
    setBody(nextValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextCursor, nextCursor);
    });
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (editingMessageId) {
      await saveEdit();
      return;
    }
    const text = body.trim();
    if (!text || sending) return;
    await sendText(text);
  }

  async function onImage(file: File | null) {
    if (!file || sending || editingMessageId) return;
    stopTyping();
    const generation = generationRef.current;
    setSending(true);
    setError(null);
    stickToBottomRef.current = true;
    try {
      const uploaded = await api.upload<{ url: string }>("/api/uploads", file);
      if (generation !== generationRef.current) return;
      const caption = body.trim() || undefined;
      const payload: { body?: string; imageUrl: string; replyToMessageId?: string } = {
        body: caption,
        imageUrl: uploaded.url,
      };
      if (replyToMessage) payload.replyToMessageId = replyToMessage.id;
      const data = await api.post<{ message: MessageView }>(
        `/api/messages/conversations/${conversationId}/messages`,
        payload
      );
      if (generation !== generationRef.current) return;
      setBody("");
      setReplyToMessage(null);
      setMessages((prev) => mergeById(prev, [data.message]));
      if (generation !== generationRef.current) return;
      await api.post(`/api/messages/conversations/${conversationId}/read`);
      focusComposer(textareaRef);
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
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === pendingUnsendId ? data.message : m));
        return patchReplyTargetsUnsent(next, pendingUnsendId);
      });
      if (replyToMessage?.id === pendingUnsendId) setReplyToMessage(null);
      setPendingUnsendId(null);
      if (editingMessageId === pendingUnsendId) cancelEdit();
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

  async function changeMessagePin(messageId: string, shouldPin: boolean) {
    if (pinSavingMessageId) return;
    const generation = generationRef.current;
    setPinSavingMessageId(messageId);
    setError(null);
    try {
      const data = await setMessagePinned(messageId, shouldPin);
      if (generation !== generationRef.current) return;
      setPinnedMessages(data.pinnedMessages);
      setPinActivities((previous) => mergePinActivities(previous, data.pinActivity));
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to update pinned message");
    } finally {
      if (generation === generationRef.current) setPinSavingMessageId(null);
    }
  }

  function cancelSearch() {
    closeSearch();
    clearFocusedSearch();
  }

  function clearSearch() {
    resetSearch();
    clearFocusedSearch();
  }

  async function confirmDeleteConversation() {
    if (!pendingDelete || deleting) return;
    const { id } = pendingDelete;
    generationRef.current += 1;
    setDeleting(true);
    try {
      await deleteConversation(id);
      setPendingDelete(null);
      navigate("/messages");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation");
    } finally {
      setDeleting(false);
    }
  }

  function startEdit(messageId: string) {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.body?.trim()) return;
    setEditingMessageId(messageId);
    setReplyToMessage(null);
    setBody(msg.body ?? "");
    setError(null);
    stickToBottomRef.current = true;
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setBody("");
  }

  async function saveEdit() {
    if (!editingMessageId || savingEdit) return;
    const msg = messages.find((m) => m.id === editingMessageId);
    if (!msg) return;
    const trimmed = body.trim();
    if (!msg.imageUrl && !trimmed) {
      setError("Message body cannot be empty.");
      return;
    }
    const generation = generationRef.current;
    setSavingEdit(true);
    setError(null);
    try {
      const data = await api.patch<{ message: MessageView }>(
        `/api/messages/messages/${editingMessageId}`,
        { body: trimmed }
      );
      if (generation !== generationRef.current) return;
      setMessages((prev) => mergeById(prev, [data.message]));
      cancelEdit();
      focusComposer(textareaRef);
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(err instanceof Error ? err.message : "Edit failed");
    } finally {
      if (generation === generationRef.current) setSavingEdit(false);
    }
  }

  function handleComposeKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape" && editingMessageId) {
      e.preventDefault();
      cancelEdit();
    }
  }

  async function applyThemeChoice(payload: ChatTheme | { reset: true }) {
    setThemeSaving(true);
    setError(null);
    try {
      const updated = await updateConversationTheme(conversationId, payload);
      setConversationTheme(updated);
      setSystemLogs((prev) => mergeThreadSystemLogs(prev, [updated.logEntry]));
      stickToBottomRef.current = true;
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
  const replyPreview =
    replyToMessage && user && peer && !editingMessageId
      ? replyTargetPreview(replyToMessage, user, peer)
      : null;
  const editingMessage = editingMessageId
    ? messages.find((m) => m.id === editingMessageId) ?? null
    : null;
  const composeBusy = sending || savingEdit;
  const latestOwnMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.senderId === user?.id && !message.isUnsent) return message.id;
    }
    return null;
  })();
  const threadTimeline = buildThreadTimeline(messages, systemLogs, pinActivities);

  return (
    <>
    <ThreadViewContent
      user={user}
      resolvedTheme={resolvedTheme}
      themeVars={themeVars}
      navigate={navigate}
      peer={peer}
      peerProfilePath={peerProfilePath}
      isSearchOpen={conversationSearch.isSearchOpen}
      onToggleSearch={() => (conversationSearch.isSearchOpen ? cancelSearch() : openSearch())}
      setThemePickerOpen={setThemePickerOpen}
      onOpenPinnedMessages={() => setPinnedMessagesDialogOpen(true)}
      setPendingDelete={setPendingDelete}
      conversationId={conversationId}
      bottomRef={bottomRef}
      scrollRef={scrollRef}
      stickToBottomRef={stickToBottomRef}
      canHover={canHover}
      setTappedMessageId={setTappedMessageId}
      loadingThread={loadingThread}
      hasMore={hasMore}
      loadingEarlier={loadingEarlier}
      loadEarlier={loadEarlier}
      error={error}
      setError={setError}
      isPeerTyping={isPeerTyping}
      threadTimeline={threadTimeline}
      focusedMessageId={focusedMessageId}
      searchHighlightQuery={searchHighlightQuery}
      peerLastReadAt={peerLastReadAt}
      editingMessageId={editingMessageId}
      tappedMessageId={tappedMessageId}
      startEdit={startEdit}
      patchMessageReaction={patchMessageReaction}
      pinnedMessageIds={new Set(pinnedMessages.map((message) => message.messageId))}
      pinSavingMessageId={pinSavingMessageId}
      changeMessagePin={changeMessagePin}
      setReplyToMessage={setReplyToMessage}
      latestOwnMessageId={latestOwnMessageId}
      body={body}
      onSend={onSend}
      composeBusy={composeBusy}
      cancelEdit={cancelEdit}
      replyPreview={replyPreview}
      fileRef={fileRef}
      onImage={onImage}
      insertComposerEmoji={insertComposerEmoji}
      textareaRef={textareaRef}
      setBody={setBody}
      stopTyping={stopTyping}
      handleComposeKeyDown={handleComposeKeyDown}
      editingMessage={editingMessage}
      themePickerOpen={themePickerOpen}
      conversationTheme={conversationTheme}
      themeSaving={themeSaving}
      applyThemeChoice={applyThemeChoice}
      sendWordEffect={sendWordEffect}
      pendingUnsendId={pendingUnsendId}
      unsending={unsending}
      setPendingUnsendId={setPendingUnsendId}
      confirmUnsend={confirmUnsend}
      pendingDelete={pendingDelete}
      deleting={deleting}
      confirmDeleteConversation={confirmDeleteConversation}
      deleteConversationDescription={deleteConversationDescription}
    />
    <PinnedMessagesDialog
      open={pinnedMessagesDialogOpen}
      messages={pinnedMessages}
      onClose={() => setPinnedMessagesDialogOpen(false)}
      onUnpin={(messageId) => void changeMessagePin(messageId, false)}
      unpinningMessageId={pinSavingMessageId}
    />
    {conversationSearch.isSearchOpen && (
      <ConversationSearchPanel
        query={conversationSearch.query}
        results={conversationSearch.results}
        hasMore={conversationSearch.hasMore}
        isSearching={conversationSearch.isSearching}
        error={conversationSearch.error}
        currentUserId={user?.id}
        peer={peer}
        hasActiveHighlight={Boolean(searchHighlightQuery)}
        onQueryChange={conversationSearch.setQuery}
        onClear={clearSearch}
        onClose={cancelSearch}
        onSelectMessage={focusSearchResult}
      />
    )}
    </>
  );
}
