import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ReactionEmoji, ReactionEntry, ReactionSummary } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionIcon } from "@/components/ReactionIcon";
import { REACTIONS_LIST_MAX_LIMIT, useReactionsList } from "@/hooks/useReactionsList";
import { REACTION_OPTIONS } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

type ReactionsListPopoverProps = {
  targetType: "post" | "comment";
  targetId: string;
  summary: ReactionSummary;
  open: boolean;
  onClose: () => void;
};

function profilePath(user: ReactionEntry["user"]): string {
  return `/u/${user.username || user.id}`;
}

function scopedReactionCount(summary: ReactionSummary, filter: ReactionEmoji | "all"): number {
  if (filter !== "all") return summary.counts[filter];
  return REACTION_OPTIONS.reduce((sum, option) => sum + summary.counts[option.emoji], 0);
}

function headerLabel(scopedCount: number, shownCount: number, truncated: boolean): string {
  const noun = scopedCount === 1 ? "reaction" : "reactions";
  if (truncated) {
    return `Showing ${shownCount} of ${scopedCount} ${noun}`;
  }
  return `${scopedCount} ${noun}`;
}

export function ReactionsListPopover({
  targetType,
  targetId,
  summary,
  open,
  onClose,
}: ReactionsListPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<ReactionEmoji | "all">("all");
  const [placement, setPlacement] = useState<"above" | "below">("above");

  const presentTypes = REACTION_OPTIONS.filter((option) => summary.counts[option.emoji] > 0);
  const scopedCount = scopedReactionCount(summary, filter);
  const fetchLimit = Math.min(Math.max(scopedCount, 1), REACTIONS_LIST_MAX_LIMIT);

  const { entries, loading, error, reset } = useReactionsList({
    targetType,
    targetId,
    filter,
    limit: fetchLimit,
    enabled: open,
  });

  const truncated = !loading && !error && entries.length < scopedCount;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;

    const panel = panelRef.current;
    const anchor = panel.parentElement;
    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const padding = 8;
    const spaceAbove = anchorRect.top;
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const fitsAbove = spaceAbove >= panelHeight + padding;
    const fitsBelow = spaceBelow >= panelHeight + padding;

    setPlacement(!fitsAbove && fitsBelow ? "below" : "above");
  }, [open, entries.length, loading, filter, scopedCount]);

  useEffect(() => {
    if (!open) {
      setFilter("all");
      setPlacement("above");
      reset();
    }
  }, [open, reset]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="People who reacted"
      className={cn(
        "absolute right-0 z-20 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg",
        placement === "above" ? "bottom-full mb-2" : "top-full mt-2"
      )}
    >
      <div className="border-b border-border/70 px-3 py-2.5">
        <p className="text-sm font-semibold">
          {headerLabel(scopedCount, entries.length, truncated)}
        </p>
        {presentTypes.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                filter === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            {presentTypes.map((option) => (
              <button
                key={option.emoji}
                type="button"
                aria-label={option.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                  filter === option.emoji
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
                onClick={() => setFilter(option.emoji)}
              >
                <ReactionIcon emoji={option.emoji} className="text-sm" />
                <span>{summary.counts[option.emoji]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto px-1 py-1">
        {loading && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">Loading…</p>
        )}
        {!loading && error && (
          <p className="px-3 py-4 text-center text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">No reactions yet.</p>
        )}
        {!loading &&
          !error &&
          entries.map((entry) => (
            <Link
              key={`${entry.user.id}-${entry.emoji}`}
              to={profilePath(entry.user)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
              onClick={onClose}
            >
              <ProfileAvatar
                displayName={entry.user.displayName}
                avatarUrl={entry.user.avatarUrl}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                <span className="font-semibold">{entry.user.displayName}</span>
                {entry.user.username ? (
                  <span className="font-normal text-muted-foreground">{` @${entry.user.username}`}</span>
                ) : null}
              </span>
              <ReactionIcon emoji={entry.emoji} className="shrink-0 text-base" />
            </Link>
          ))}
      </div>
    </div>
  );
}
