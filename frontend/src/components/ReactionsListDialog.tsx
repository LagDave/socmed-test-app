import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactionEmoji, ReactionEntry, ReactionSummary } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionIcon } from "@/components/ReactionIcon";
import { Button } from "@/components/ui/button";
import { REACTIONS_LIST_MAX_LIMIT, useReactionsList } from "@/hooks/useReactionsList";
import { REACTION_OPTIONS } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

type ReactionsListDialogProps = {
  targetType: "post" | "comment" | "post_image";
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

export function ReactionsListDialog({
  targetType,
  targetId,
  summary,
  open,
  onClose,
}: ReactionsListDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [filter, setFilter] = useState<ReactionEmoji | "all">("all");

  onCloseRef.current = onClose;

  const presentTypes = REACTION_OPTIONS.filter((option) => summary.counts[option.emoji] > 0);
  const featuredEmoji = presentTypes[0]?.emoji ?? null;
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
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFilter("all");
      reset();
    }
  }, [open, reset]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Dismiss"
        className="modal-backdrop absolute inset-0"
        onClick={() => onCloseRef.current()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-panel animate-modal-enter relative z-10 flex max-h-[min(90vh,34rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl sm:max-w-md"
      >
        <div className="flex items-center justify-between border-b border-border/70 bg-gradient-to-br from-card via-card to-muted/70 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background text-xl shadow-sm ring-1 ring-border/70">
              <ReactionIcon emoji={featuredEmoji} className="text-xl" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {headerLabel(scopedCount, entries.length, truncated)}
              </h2>
            </div>
          </div>
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Close reactions"
            onClick={() => onCloseRef.current()}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {presentTypes.length > 1 && (
          <div className="border-b border-border/70 bg-muted/30 px-5 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Filter reactions
            </p>
            <div className="flex flex-wrap gap-1">
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
          </div>
        )}

        <div className="max-h-72 overflow-y-auto bg-card px-3 py-3">
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
                className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-border/70 hover:bg-accent/50"
                onClick={() => onCloseRef.current()}
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
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/70 transition-colors group-hover:bg-background">
                  <ReactionIcon emoji={entry.emoji} className="text-base" />
                </span>
              </Link>
            ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
