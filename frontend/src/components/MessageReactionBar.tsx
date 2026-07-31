import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { ReactionEmoji, ReactionSummary } from "@/api/types";
import { ReactionIcon } from "@/components/ReactionIcon";
import { REACTION_OPTIONS } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

export function MessageReactionSummary({ summary }: { summary: ReactionSummary }) {
  const presentTypes = REACTION_OPTIONS.filter((o) => summary.counts[o.emoji] > 0);
  const totalCount = presentTypes.reduce((sum, o) => sum + summary.counts[o.emoji], 0);
  if (totalCount === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center -space-x-1" aria-hidden="true">
        {presentTypes.map((opt) => (
          <span
            key={opt.emoji}
            className="inline-flex items-center justify-center rounded-full bg-background ring-1 ring-border/70"
          >
            <ReactionIcon emoji={opt.emoji} className="text-[0.95rem]" />
          </span>
        ))}
      </span>
      <span>{totalCount}</span>
    </span>
  );
}

export function MessageReactionPicker({
  messageId,
  summary,
  onSummaryChange,
  onError,
  open,
  onOpenChange,
  className,
}: {
  messageId: string;
  summary: ReactionSummary;
  onSummaryChange: (summary: ReactionSummary) => void;
  onError: (message: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [popEmoji, setPopEmoji] = useState<ReactionEmoji | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onOpenChange]);

  async function applyEmoji(emoji: ReactionEmoji) {
    if (busy) return;
    setBusy(true);
    try {
      if (summary.viewerEmoji === emoji) {
        const data = await api.delete<{ message: { reactionSummary: ReactionSummary } }>(
          `/api/messages/messages/${messageId}/reaction`
        );
        onSummaryChange(data.message.reactionSummary);
      } else {
        const data = await api.put<{ message: { reactionSummary: ReactionSummary } }>(
          `/api/messages/messages/${messageId}/reaction`,
          { emoji }
        );
        onSummaryChange(data.message.reactionSummary);
      }
      setPopEmoji(emoji);
      window.setTimeout(() => setPopEmoji(null), 280);
      onOpenChange(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Reaction failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "absolute bottom-full z-10 mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background px-1.5 py-0.5 shadow-md",
        className
      )}
      role="listbox"
      aria-label="Choose reaction"
    >
      {REACTION_OPTIONS.map((opt) => {
        const selected = summary.viewerEmoji === opt.emoji;
        return (
          <button
            key={opt.emoji}
            type="button"
            role="option"
            aria-label={opt.label}
            aria-selected={selected}
            disabled={busy}
            className={cn(
              "reaction-icon-btn relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full leading-none hover:bg-accent",
              selected && "ring-1 ring-foreground/30",
              popEmoji === opt.emoji && "reaction-icon-pop"
            )}
            onClick={(e) => {
              e.stopPropagation();
              void applyEmoji(opt.emoji);
            }}
          >
            <ReactionIcon emoji={opt.emoji} className="text-[1rem]" />
          </button>
        );
      })}
    </div>
  );
}
