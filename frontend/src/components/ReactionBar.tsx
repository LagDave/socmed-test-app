import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { ReactionEmoji, ReactionSummary } from "@/api/types";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS: { emoji: ReactionEmoji; glyph: string; label: string }[] = [
  { emoji: "like", glyph: "👍", label: "Like" },
  { emoji: "heart", glyph: "❤️", label: "Heart" },
  { emoji: "haha", glyph: "😂", label: "Haha" },
  { emoji: "wow", glyph: "😮", label: "Wow" },
];

const HOLD_MS = 350;
const EXPAND_DELAY_MS = 220;

const SIZE = {
  md: {
    trigger: "h-8 w-8",
    emoji: "text-[1.25rem]",
    option: "h-8 w-8 text-[1.25rem]",
    label: "text-[11px] -bottom-4",
    counts: "gap-2 text-xs",
    countGlyph: "text-sm",
    pickerPad: "px-2.5 py-1",
    pickerGap: "gap-2",
    gap: "gap-2",
  },
  sm: {
    trigger: "h-6 w-6",
    emoji: "text-[0.95rem]",
    option: "h-6 w-6 text-[0.95rem]",
    label: "text-[10px] -bottom-3.5",
    counts: "gap-1.5 text-[11px]",
    countGlyph: "text-xs",
    pickerPad: "px-1.5 py-0.5",
    pickerGap: "gap-1.5",
    gap: "gap-1.5",
  },
} as const;

type ReactionBarProps = {
  targetType: "post" | "comment";
  targetId: string;
  summary: ReactionSummary;
  onSummaryChange: (summary: ReactionSummary) => void;
  /** Post reactions use md; comments/replies use sm. */
  size?: keyof typeof SIZE;
  className?: string;
};

function glyphFor(emoji: ReactionEmoji | null): string {
  if (!emoji) return "👍";
  return EMOJI_OPTIONS.find((o) => o.emoji === emoji)?.glyph ?? "👍";
}

function labelFor(emoji: ReactionEmoji | null): string {
  if (!emoji) return "Like";
  return EMOJI_OPTIONS.find((o) => o.emoji === emoji)?.label ?? "Like";
}

export function ReactionBar({
  targetType,
  targetId,
  summary,
  onSummaryChange,
  size = "md",
  className,
}: ReactionBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [popEmoji, setPopEmoji] = useState<ReactionEmoji | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const expandTimerRef = useRef<number | null>(null);
  const s = SIZE[size];

  const path =
    targetType === "post"
      ? `/api/posts/${targetId}/reactions`
      : `/api/comments/${targetId}/reactions`;

  useEffect(() => {
    if (!expanded) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setExpanded(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  function clearHoldTimer() {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function clearExpandTimer() {
    if (expandTimerRef.current !== null) {
      window.clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
  }

  function scheduleExpand() {
    clearExpandTimer();
    expandTimerRef.current = window.setTimeout(() => setExpanded(true), EXPAND_DELAY_MS);
  }

  function collapse() {
    clearExpandTimer();
    setExpanded(false);
  }

  async function applyEmoji(emoji: ReactionEmoji) {
    if (busy) return;
    setBusy(true);
    try {
      if (summary.viewerEmoji === emoji) {
        const data = await api.delete<{ reactionSummary: ReactionSummary }>(path);
        onSummaryChange(data.reactionSummary);
      } else {
        const data = await api.put<{ reactionSummary: ReactionSummary }>(path, { emoji });
        onSummaryChange(data.reactionSummary);
      }
      setPopEmoji(emoji);
      window.setTimeout(() => setPopEmoji(null), 280);
      setExpanded(false);
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Reaction failed");
    } finally {
      setBusy(false);
    }
  }

  const visibleCounts = EMOJI_OPTIONS.filter((o) => summary.counts[o.emoji] > 0);
  const triggerLabel = labelFor(summary.viewerEmoji);

  const shellClass = cn(
    "inline-flex items-center rounded-full border border-border/80 bg-background",
    expanded ? s.pickerPad : "p-px"
  );

  return (
    <div ref={rootRef} className={cn("flex flex-wrap items-center", s.gap, className)}>
      <div
        className="relative inline-flex"
        onMouseEnter={scheduleExpand}
        onMouseLeave={collapse}
      >
        <div className={shellClass}>
          {!expanded ? (
            <button
              type="button"
              disabled={busy}
              aria-label={triggerLabel}
              aria-expanded={false}
              className={cn(
                "group relative inline-flex items-center justify-center rounded-full transition-colors",
                s.trigger,
                "hover:bg-accent",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
              onClick={() => {
                clearExpandTimer();
                setExpanded(true);
              }}
              onPointerDown={(e) => {
                if (e.pointerType === "touch" || e.pointerType === "pen") {
                  clearHoldTimer();
                  holdTimerRef.current = window.setTimeout(() => setExpanded(true), HOLD_MS);
                }
              }}
              onPointerUp={clearHoldTimer}
              onPointerCancel={clearHoldTimer}
              onPointerLeave={clearHoldTimer}
            >
              <span
                className={cn(
                  "inline-block leading-none",
                  s.emoji,
                  popEmoji && popEmoji === (summary.viewerEmoji ?? "like") && "reaction-emoji-pop"
                )}
              >
                {glyphFor(summary.viewerEmoji)}
              </span>
              <span
                className={cn(
                  "pointer-events-none absolute left-1/2 -translate-x-1/2",
                  "whitespace-nowrap text-muted-foreground",
                  s.label,
                  "opacity-0 transition-opacity group-hover:opacity-100"
                )}
              >
                {triggerLabel}
              </span>
            </button>
          ) : (
            <div
              className={cn("inline-flex items-center", s.pickerGap)}
              role="listbox"
              aria-label="Choose reaction"
            >
              {EMOJI_OPTIONS.map((opt) => (
                <button
                  key={opt.emoji}
                  type="button"
                  role="option"
                  aria-label={opt.label}
                  aria-selected={summary.viewerEmoji === opt.emoji}
                  disabled={busy}
                  className={cn(
                    "reaction-emoji-btn group/emoji relative inline-flex shrink-0 items-center justify-center rounded-full leading-none",
                    s.option,
                    "hover:bg-accent",
                    summary.viewerEmoji === opt.emoji && "ring-1 ring-foreground/30",
                    popEmoji === opt.emoji && "reaction-emoji-pop"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    void applyEmoji(opt.emoji);
                  }}
                >
                  <span>{opt.glyph}</span>
                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 -translate-x-1/2",
                      "whitespace-nowrap text-muted-foreground",
                      s.label,
                      "opacity-0 transition-opacity group-hover/emoji:opacity-100"
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {visibleCounts.length > 0 && (
        <div className={cn("flex flex-wrap items-center text-muted-foreground", s.counts)}>
          {visibleCounts.map((opt) => (
            <span key={opt.emoji} className="inline-flex items-center gap-1">
              <span aria-hidden className={cn("leading-none", s.countGlyph)}>
                {opt.glyph}
              </span>
              <span>{summary.counts[opt.emoji]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
