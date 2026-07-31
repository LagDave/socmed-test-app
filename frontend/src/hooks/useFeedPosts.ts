import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { PostView, ReactionSummary } from "@/api/types";

const PAGE_SIZE = 30;

type FeedState = {
  posts: PostView[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
};

export function useFeedPosts(enabled: boolean) {
  const [state, setState] = useState<FeedState>({
    posts: [],
    loading: enabled,
    loadingMore: false,
    hasMore: true,
    error: null,
  });
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const loadPage = useCallback(async (before?: string) => {
    const qs = before ? `?before=${encodeURIComponent(before)}` : "";
    const data = await api.get<{ posts: PostView[] }>(`/api/feed${qs}`);
    return data.posts;
  }, []);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState((prev) => ({ ...prev, loading: prev.posts.length === 0, error: null }));
    try {
      const posts = await loadPage();
      setState({
        posts,
        loading: false,
        loadingMore: false,
        hasMore: posts.length >= PAGE_SIZE,
        error: null,
      });
      await api.post("/api/feed/seen").catch(() => undefined);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load feed",
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    const prev = stateRef.current;
    if (
      loadingMoreRef.current ||
      loadingRef.current ||
      !prev.hasMore ||
      prev.loading ||
      prev.loadingMore ||
      prev.posts.length === 0
    ) {
      return;
    }

    const cursor = prev.posts[prev.posts.length - 1]?.createdAt;
    if (!cursor) return;

    loadingMoreRef.current = true;
    setState((s) => ({ ...s, loadingMore: true, error: null }));
    try {
      const next = await loadPage(cursor);
      setState((s) => ({
        ...s,
        posts: [...s.posts, ...next],
        loadingMore: false,
        hasMore: next.length >= PAGE_SIZE,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loadingMore: false,
        error: err instanceof Error ? err.message : "Failed to load more posts",
      }));
    } finally {
      loadingMoreRef.current = false;
    }
  }, [loadPage]);

  const patchPostSummary = useCallback((postId: string, reactionSummary: ReactionSummary) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, reactionSummary } : p)),
    }));
  }, []);

  const removePost = useCallback((postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({
        posts: [],
        loading: false,
        loadingMore: false,
        hasMore: true,
        error: null,
      });
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return {
    ...state,
    refresh,
    loadMore,
    patchPostSummary,
    removePost,
  };
}
