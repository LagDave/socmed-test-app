import { useCallback, useEffect, useRef, useState } from "react";
import { searchConversationMessages } from "@/api/messages";
import type { MessageView } from "@/api/types";

const SEARCH_DEBOUNCE_MS = 150;

type ConversationSearchState = {
  query: string;
  results: MessageView[];
  hasMore: boolean;
  isSearching: boolean;
  error: string | null;
};

const EMPTY_SEARCH_STATE: ConversationSearchState = {
  query: "",
  results: [],
  hasMore: false,
  isSearching: false,
  error: null,
};

export function useConversationSearch(conversationId: string) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [state, setState] = useState<ConversationSearchState>(EMPTY_SEARCH_STATE);
  const requestIdRef = useRef(0);
  const refreshIdRef = useRef(0);
  const isSearchOpenRef = useRef(false);
  const queryRef = useRef("");
  const [refreshId, setRefreshId] = useState(0);

  isSearchOpenRef.current = isSearchOpen;
  queryRef.current = state.query;

  const resetSearch = useCallback(() => {
    requestIdRef.current += 1;
    setState(EMPTY_SEARCH_STATE);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    resetSearch();
  }, [resetSearch]);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const refreshSearch = useCallback(() => {
    if (!isSearchOpenRef.current || !queryRef.current.trim()) return;
    refreshIdRef.current += 1;
    setRefreshId(refreshIdRef.current);
  }, []);

  useEffect(() => {
    closeSearch();
  }, [closeSearch, conversationId]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const query = state.query.trim();
    if (!query) {
      setState((previous) => ({
        ...previous,
        results: [],
        hasMore: false,
        isSearching: false,
        error: null,
      }));
      return;
    }

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((previous) => ({ ...previous, isSearching: true, error: null }));
    const timeoutId = window.setTimeout(() => {
      void searchConversationMessages(conversationId, query, controller.signal)
        .then((response) => {
          if (requestId !== requestIdRef.current) return;
          setState((previous) => ({
            ...previous,
            results: response.messages,
            hasMore: response.hasMore,
            isSearching: false,
          }));
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;
          setState((previous) => ({
            ...previous,
            results: [],
            hasMore: false,
            isSearching: false,
            error: error instanceof Error ? error.message : "Could not search messages.",
          }));
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [conversationId, isSearchOpen, refreshId, state.query]);

  return {
    isSearchOpen,
    openSearch,
    closeSearch,
    query: state.query,
    setQuery: (query: string) => setState((previous) => ({ ...previous, query })),
    results: state.results,
    hasMore: state.hasMore,
    isSearching: state.isSearching,
    error: state.error,
    resetSearch,
    refreshSearch,
  };
}
