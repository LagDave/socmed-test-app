import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { ReactionEmoji, ReactionEntry, ReactionSummary } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionIcon } from "@/components/ReactionIcon";
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

export function ReactionsListPopover({
  targetType,
  targetId,
  summary,
  open,
  onClose,
}: ReactionsListPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<ReactionEmoji | "all">("all");
  const [entries, setEntries] = useState<ReactionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presentTypes = REACTION_OPTIONS.filter((o) => summary.counts[o.emoji] > 0);
  const totalCount = presentTypes.reduce((sum, o) => sum + summary.counts[o.emoji], 0);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const path =
      targetType === "post"
        ? `/api/posts/${targetId}/reactions`
        : `/api/comments/${targetId}/reactions`;
    const query = filter === "all" ? "" : `?emoji=${filter}`;

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
  }, [open, targetType, targetId, filter]);

  useEffect(() => {
    if (!open) {
      setFilter("all");
      setEntries([]);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="People who reacted"
      className="absolute bottom-full right-0 z-20 mb-2 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    >
      <div className="border-b border-border/70 px-3 py-2.5">
        <p className="text-sm font-semibold">
          {totalCount} {totalCount === 1 ? "reaction" : "reactions"}
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
            {presentTypes.map((opt) => (
              <button
                key={opt.emoji}
                type="button"
                aria-label={opt.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                  filter === opt.emoji
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
                onClick={() => setFilter(opt.emoji)}
              >
                <ReactionIcon emoji={opt.emoji} className="text-sm" />
                <span>{summary.counts[opt.emoji]}</span>
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
