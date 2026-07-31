import { useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/api/client";
import type { ReactionEmoji, ReactionSummary } from "@/api/types";
import { ReactionIcon } from "@/components/ReactionIcon";
import { REACTION_OPTIONS, reactionOption } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

const HOLD_MS = 350;
const EXPAND_DELAY_MS = 220;

const SIZE = {
  md: {
    trigger: "h-9 w-9",
    triggerIcon: "text-[1.5rem]",
    icon: "text-[1.5rem]",
    option: "h-9 w-9",
    label: "text-[11px] -bottom-4",
    summary: "gap-1.5 text-xs",
    summaryIcon: "text-[1.2rem]",
    pickerPad: "px-2.5 py-1",
    pickerGap: "gap-2",
    leftGap: "gap-2",
  },
  sm: {
    trigger: "h-6 w-6",
    triggerIcon: "text-[0.95rem]",
    icon: "text-[0.95rem]",
    option: "h-6 w-6",
    label: "text-[10px] -bottom-3.5",
    summary: "gap-1 text-[11px]",
    summaryIcon: "text-[0.95rem]",
    pickerPad: "px-1.5 py-0.5",
    pickerGap: "gap-1.5",
    leftGap: "gap-1.5",
  },
} as const;

type ReactionBarProps = {
  targetType: "post" | "comment";
  targetId: string;
  summary: ReactionSummary;
  onSummaryChange: (summary: ReactionSummary) => void;
  /** Post reactions use md; comments/replies use sm. */
  size?: keyof typeof SIZE;
  /** Controls rendered immediately after the trigger (comment / reply). */
  actions?: ReactNode;
  className?: string;
};

export function ReactionBar({
  targetType,
  targetId,
  summary,
  onSummaryChange,
  size = "md",
  actions,
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

  const presentTypes = REACTION_OPTIONS.filter((o) => summary.counts[o.emoji] > 0);
  const totalCount = presentTypes.reduce((sum, o) => sum + summary.counts[o.emoji], 0);
  const triggerEmoji = summary.viewerEmoji;
  const triggerLabel = reactionOption(triggerEmoji).label;
  const summaryLabel =
    totalCount > 0
      ? `${totalCount} ${totalCount === 1 ? "reaction" : "reactions"}: ${presentTypes
          .map((o) => o.label)
          .join(", ")}`
      : undefined;

  const shellClass = cn(
    "inline-flex items-center rounded-full border border-border/80 bg-background",
    expanded ? s.pickerPad : "p-px"
  );

  return (
    <div
      ref={rootRef}
      className={cn("flex w-full flex-wrap items-center justify-between", s.leftGap, className)}
    >
      <div className={cn("flex flex-wrap items-center", s.leftGap)}>
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
                    "inline-flex items-center justify-center leading-none",
                    popEmoji && popEmoji === (triggerEmoji ?? "like") && "reaction-icon-pop"
                  )}
                >
                  <ReactionIcon emoji={triggerEmoji} className={s.triggerIcon} />
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
                        "reaction-icon-btn group/emoji relative inline-flex shrink-0 items-center justify-center rounded-full leading-none",
                        s.option,
                        "hover:bg-accent",
                        selected && "ring-1 ring-foreground/30",
                        popEmoji === opt.emoji && "reaction-icon-pop"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        void applyEmoji(opt.emoji);
                      }}
                    >
                      <ReactionIcon emoji={opt.emoji} className={s.icon} />
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {actions}
      </div>

      {totalCount > 0 && (
        <div
          className={cn("inline-flex items-center text-muted-foreground", s.summary)}
          aria-label={summaryLabel}
        >
          <span className="inline-flex items-center -space-x-1" aria-hidden="true">
            {presentTypes.map((opt) => (
              <span
                key={opt.emoji}
                className="inline-flex items-center justify-center rounded-full bg-background ring-1 ring-border/70"
              >
                <ReactionIcon emoji={opt.emoji} className={s.summaryIcon} />
              </span>
            ))}
          </span>
          <span>{totalCount}</span>
        </div>
      )}
    </div>
  );
}
