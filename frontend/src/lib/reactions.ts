import type { ReactionEmoji, ReactionSummary } from "@/api/types";

export function emptyReactionSummary(): ReactionSummary {
  return {
    counts: { like: 0, heart: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    viewerEmoji: null,
  };
}

export function reactionTotal(summary: ReactionSummary): number {
  return (Object.keys(summary.counts) as ReactionEmoji[]).reduce(
    (sum, emoji) => sum + summary.counts[emoji],
    0
  );
}
