import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from "react";
import { api } from "@/api/client";
import type { MessageView } from "@/api/types";

type UseConversationSearchResultFocusParams = {
  conversationId: string;
  closeSearch: () => void;
  generationRef: MutableRefObject<number>;
  scrollRef: RefObject<HTMLDivElement | null>;
  setError: Dispatch<SetStateAction<string | null>>;
  setHasMore: Dispatch<SetStateAction<boolean>>;
  setHasMoreNewer: Dispatch<SetStateAction<boolean>>;
  setMessages: Dispatch<SetStateAction<MessageView[]>>;
  stickToBottomRef: MutableRefObject<boolean>;
  newestPagedMessageIdRef: MutableRefObject<string | null>;
};

function mergeSearchContext(context: MessageView[], result: MessageView): MessageView[] {
  const messages = new Map<string, MessageView>();
  for (const message of context) messages.set(message.id, message);
  messages.set(result.id, result);
  return Array.from(messages.values()).sort(
    (firstMessage, secondMessage) =>
      new Date(firstMessage.createdAt).getTime() - new Date(secondMessage.createdAt).getTime()
  );
}

export function useConversationSearchResultFocus({
  conversationId,
  closeSearch,
  generationRef,
  scrollRef,
  setError,
  setHasMore,
  setHasMoreNewer,
  setMessages,
  stickToBottomRef,
  newestPagedMessageIdRef,
}: UseConversationSearchResultFocusParams) {
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [searchHighlightQuery, setSearchHighlightQuery] = useState<string | null>(null);
  const oldestPagedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!focusedMessageId) return;
    const frameId = window.requestAnimationFrame(() => {
      const target = scrollRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${focusedMessageId}"]`
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [focusedMessageId, scrollRef]);

  const clearFocusedSearch = useCallback(() => {
    setFocusedMessageId(null);
    setSearchHighlightQuery(null);
  }, []);

  async function focusSearchResult(message: MessageView, query: string) {
    closeSearch();
    stickToBottomRef.current = false;
    const generation = generationRef.current;
    try {
      const [olderData, newerData] = await Promise.all([
        api.get<{ messages: MessageView[]; hasMore: boolean }>(
          `/api/messages/conversations/${conversationId}?before=${encodeURIComponent(message.id)}`
        ),
        api.get<{ messages: MessageView[]; hasMore: boolean }>(
          `/api/messages/conversations/${conversationId}?after=${encodeURIComponent(message.id)}`
        ),
      ]);
      if (generation !== generationRef.current) return;
      setMessages(mergeSearchContext([...olderData.messages, ...newerData.messages], message));
      oldestPagedMessageIdRef.current = olderData.messages[0]?.id ?? message.id;
      newestPagedMessageIdRef.current = newerData.messages.at(-1)?.id ?? message.id;
      setHasMore(Boolean(olderData.hasMore));
      setHasMoreNewer(Boolean(newerData.hasMore));
      setFocusedMessageId(message.id);
      setSearchHighlightQuery(query);
    } catch (error) {
      if (generation !== generationRef.current) return;
      setError(error instanceof Error ? error.message : "Failed to load search result context");
    }
  }

  return {
    clearFocusedSearch,
    focusSearchResult,
    focusedMessageId,
    oldestPagedMessageIdRef,
    searchHighlightQuery,
  };
}
