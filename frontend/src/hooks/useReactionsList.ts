import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import type { ReactionEmoji, ReactionEntry } from "@/api/types";

export const REACTIONS_LIST_MAX_LIMIT = 100;

type UseReactionsListArgs = {
  targetType: "post" | "comment" | "post_image";
  targetId: string;
  filter: ReactionEmoji | "all";
  limit: number;
  enabled: boolean;
};

export function useReactionsList({
  targetType,
  targetId,
  filter,
  limit,
  enabled,
}: UseReactionsListArgs) {
  const [entries, setEntries] = useState<ReactionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setEntries([]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const path =
      targetType === "post"
        ? `/api/posts/${targetId}/reactions`
        : targetType === "post_image"
          ? `/api/post-images/${targetId}/reactions`
          : `/api/comments/${targetId}/reactions`;

    const params = new URLSearchParams();
    if (filter !== "all") params.set("emoji", filter);
    params.set("limit", String(limit));
    const query = `?${params.toString()}`;

    void (async () => {
      try {
        const data = await api.get<{ reactions: ReactionEntry[] }>(`${path}${query}`);
        if (cancelled) return;
        setEntries(data.reactions);
      } catch (e) {
        if (cancelled) return;
        setEntries([]);
        setError(e instanceof Error ? e.message : "Failed to load reactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, targetType, targetId, filter, limit]);

  return { entries, loading, error, reset };
}
