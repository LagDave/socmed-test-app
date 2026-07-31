import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { ReactionEmoji, ReactionSummary } from "@/api/types";
import { ReactionIcon } from "@/components/ReactionIcon";
import { REACTION_OPTIONS, reactionOption } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

const HOLD_MS = 350;
const EXPAND_DELAY_MS = 220;

export function MessageReactionBar({
  messageId,
  summary,
  onSummaryChange,
  onError,
  className,
}: {
  messageId: string;
  summary: ReactionSummary;
  onSummaryChange: (summary: ReactionSummary) => void;
  onError: (message: string) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [popEmoji, setPopEmoji] = useState<ReactionEmoji | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const expandTimerRef = useRef<number | null>(null);

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
      setExpanded(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Reaction failed");
    } finally {
      setBusy(false);
    }
  }

  const presentTypes = REACTION_OPTIONS.filter((o) => summary.counts[o.emoji] > 0);
  const totalCount = presentTypes.reduce((sum, o) => sum + summary.counts[o.emoji], 0);
  const triggerEmoji = summary.viewerEmoji;
  const triggerLabel = reactionOption(triggerEmoji).label;

  return (
    <div ref={rootRef} className={cn("mt-1 flex flex-wrap items-center gap-1.5", className)}>
      <div
        className="relative inline-flex"
        onMouseEnter={scheduleExpand}
        onMouseLeave={collapse}
      >
        <div
          className={cn(
            "inline-flex items-center rounded-full border border-border/80 bg-background",
            expanded ? "gap-1.5 px-1.5 py-0.5" : "p-px"
          )}
        >
          {!expanded ? (
            <button
              type="button"
              disabled={busy}
              aria-label={triggerLabel}
              aria-expanded={false}
              className={cn(
                "group relative inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-accent",
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
                <ReactionIcon emoji={triggerEmoji} className="text-[0.95rem]" />
              </span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5" role="listbox" aria-label="Choose reaction">
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
                      "reaction-icon-btn group/emoji relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full leading-none hover:bg-accent",
                      selected && "ring-1 ring-foreground/30",
                      popEmoji === opt.emoji && "reaction-icon-pop"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      void applyEmoji(opt.emoji);
                    }}
                  >
                    <ReactionIcon emoji={opt.emoji} className="text-[0.95rem]" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
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
      )}
    </div>
  );
}
