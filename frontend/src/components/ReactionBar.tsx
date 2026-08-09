import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Smile, ThumbsUp } from "lucide-react";
import { api } from "@/api/client";
import type { ReactionEmoji, ReactionSummary } from "@/api/types";
import { ReactionIcon } from "@/components/ReactionIcon";
import { ReactionsListDialog } from "@/components/ReactionsListDialog";
import { REACTION_OPTIONS, reactionOption } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

const HOLD_MS = 350;
const EXPAND_DELAY_MS = 220;
const HOVER_CLOSE_DELAY_MS = 180;

const SIZE = {
  md: {
    trigger: "h-9 w-9",
    triggerIcon: "text-[1.5rem]",
    emptyTriggerIcon: "h-5 w-5",
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
    emptyTriggerIcon: "h-3.5 w-3.5",
    icon: "text-[0.95rem]",
    option: "h-6 w-6",
    label: "text-[10px] -bottom-3.5",
    summary: "gap-1 text-[11px]",
    summaryIcon: "text-[0.95rem]",
    pickerPad: "px-1.5 py-0.5",
    pickerGap: "gap-1.5",
    leftGap: "gap-1.5",
  },
  inline: {
    trigger: "h-7 w-7",
    triggerIcon: "text-sm",
    emptyTriggerIcon: "h-4 w-4",
    icon: "text-base",
    option: "h-8 w-8",
    label: "text-[10px] -bottom-3.5",
    summary: "gap-1 text-[11px]",
    summaryIcon: "text-sm",
    pickerPad: "px-2.5 py-1.5",
    pickerGap: "gap-1.5",
    leftGap: "gap-0",
  },
  toolbar: {
    trigger: "h-6 w-6",
    triggerIcon: "h-[15px] w-[15px]",
    emptyTriggerIcon: "h-[15px] w-[15px]",
    icon: "text-[1.35rem]",
    option: "h-8 w-8",
    label: "text-[10px] -bottom-3.5",
    summary: "gap-1 text-[11px]",
    summaryIcon: "text-sm",
    pickerPad: "px-1.5 py-0.5",
    pickerGap: "gap-0.5",
    leftGap: "gap-0",
  },
} as const;

type ReactionBarProps = {
  targetType: "post" | "comment" | "post_image" | "message";
  targetId: string;
  summary: ReactionSummary;
  onSummaryChange: (summary: ReactionSummary) => void;
  size?: keyof typeof SIZE;
  variant?: "default" | "inline" | "toolbar";
  pickerAlign?: "start" | "end" | "center";
  triggerClassName?: string;
  actions?: ReactNode;
  className?: string;
  onError?: (message: string) => void;
};

export function ReactionBar({
  targetType,
  targetId,
  summary,
  onSummaryChange,
  size = "md",
  variant = "default",
  pickerAlign = "center",
  triggerClassName,
  actions,
  className,
  onError,
}: ReactionBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [popEmoji, setPopEmoji] = useState<ReactionEmoji | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const expandTimerRef = useRef<number | null>(null);
  const collapseTimerRef = useRef<number | null>(null);
  const pickerId = useId();
  const isDefault = variant === "default";
  const isInline = variant === "inline";
  const isToolbar = variant === "toolbar";
  const isPopup = isInline || isToolbar;
  const showsFloatingPicker = isDefault || isPopup;
  const usesHoverTrigger = isDefault;
  const s = SIZE[isToolbar ? "toolbar" : isInline ? "inline" : size];

  const path =
    targetType === "post"
      ? `/api/posts/${targetId}/reactions`
      : targetType === "post_image"
        ? `/api/post-images/${targetId}/reactions`
        : targetType === "comment"
          ? `/api/comments/${targetId}/reactions`
          : `/api/messages/messages/${targetId}/reaction`;

  function parseReactionResponse(
    data: { reactionSummary: ReactionSummary } | { message: { reactionSummary: ReactionSummary } }
  ): ReactionSummary {
    return "message" in data ? data.message.reactionSummary : data.reactionSummary;
  }

  useEffect(() => {
    if (!expanded && !listOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setExpanded(false);
        setListOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, listOpen]);

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

  function clearCollapseTimer() {
    if (collapseTimerRef.current !== null) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }

  function scheduleExpand() {
    clearCollapseTimer();
    clearExpandTimer();
    expandTimerRef.current = window.setTimeout(() => setExpanded(true), EXPAND_DELAY_MS);
  }

  function scheduleCollapse() {
    clearExpandTimer();
    clearCollapseTimer();
    collapseTimerRef.current = window.setTimeout(() => {
      setExpanded(false);
      collapseTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  }

  function toggleList() {
    clearExpandTimer();
    clearCollapseTimer();
    setExpanded(false);
    setListOpen((open) => !open);
  }

  async function applyEmoji(emoji: ReactionEmoji) {
    if (busy) return;
    setBusy(true);
    try {
      if (summary.viewerEmoji === emoji) {
        const data = await api.delete<
          { reactionSummary: ReactionSummary } | { message: { reactionSummary: ReactionSummary } }
        >(path);
        onSummaryChange(parseReactionResponse(data));
      } else {
        const data = await api.put<
          { reactionSummary: ReactionSummary } | { message: { reactionSummary: ReactionSummary } }
        >(path, { emoji });
        onSummaryChange(parseReactionResponse(data));
      }
      setPopEmoji(emoji);
      window.setTimeout(() => setPopEmoji(null), 280);
      clearCollapseTimer();
      setExpanded(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reaction failed";
      if (onError) onError(message);
      else console.error(message);
    } finally {
      setBusy(false);
    }
  }

  const presentTypes = REACTION_OPTIONS.filter((o) => summary.counts[o.emoji] > 0);
  const totalCount = presentTypes.reduce((sum, o) => sum + summary.counts[o.emoji], 0);
  const triggerEmoji = summary.viewerEmoji;
  const triggerLabel = triggerEmoji ? reactionOption(triggerEmoji).label : "React";
  const summaryLabel =
    totalCount > 0
      ? `${totalCount} ${totalCount === 1 ? "reaction" : "reactions"}: ${presentTypes
          .map((o) => o.label)
          .join(", ")}`
      : undefined;

  const shellClass = cn(
    "inline-flex items-center rounded-full",
    isToolbar
      ? ""
      : isInline
        ? "bg-card shadow-[0_2px_8px_rgba(0,0,0,0.12)] ring-1 ring-border/60"
        : "border border-border/80 bg-background p-px"
  );

  const toolbarTriggerContent = (
    <Smile className={s.triggerIcon} strokeWidth={1.75} aria-hidden="true" />
  );

  const defaultTriggerContent = triggerEmoji ? (
    <ReactionIcon emoji={triggerEmoji} className={s.triggerIcon} />
  ) : (
    <ThumbsUp
      className={cn(s.emptyTriggerIcon, "text-muted-foreground")}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );

  const inlineTriggerGlyph = summary.viewerEmoji ? (
    <ReactionIcon emoji={summary.viewerEmoji} className={s.triggerIcon} />
  ) : (
    <span aria-hidden className={cn("inline-block leading-none select-none", s.triggerIcon)}>
      🙂
    </span>
  );

  const pickerOptions = (
    <>
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
            {isDefault && (
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
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "inline-flex flex-wrap items-center",
        isInline ? "gap-0" : isToolbar ? "gap-0" : targetType === "message" ? "gap-1.5" : cn("w-full justify-between", s.leftGap),
        className
      )}
    >
      <div className={cn("flex flex-wrap items-center", isPopup ? "gap-0" : s.leftGap)}>
        <div
          className="relative inline-flex"
          onMouseEnter={usesHoverTrigger ? scheduleExpand : undefined}
          onMouseLeave={usesHoverTrigger ? scheduleCollapse : undefined}
        >
          {expanded && showsFloatingPicker && (
            <div
              id={pickerId}
              className={cn(
                "message-reaction-popup absolute bottom-full z-30 mb-1.5 inline-flex items-center rounded-full bg-popover shadow-lg ring-1 ring-border/60",
                s.pickerPad,
                s.pickerGap,
                isDefault
                  ? "left-0"
                  : pickerAlign === "end"
                    ? "right-0 translate-x-0.5"
                    : pickerAlign === "start"
                      ? "left-0 -translate-x-1"
                      : "left-1/2 -translate-x-1/2"
              )}
              role="listbox"
              aria-label="Choose reaction"
              onMouseEnter={usesHoverTrigger ? clearCollapseTimer : undefined}
              onMouseLeave={usesHoverTrigger ? scheduleCollapse : undefined}
            >
              {pickerOptions}
            </div>
          )}
          <div className={shellClass}>
            {(!expanded || showsFloatingPicker) && (
              <button
                type="button"
                disabled={busy}
                aria-label={isInline || isToolbar ? "React to message" : triggerLabel}
                aria-expanded={expanded}
                aria-controls={pickerId}
                className={cn(
                  "group relative inline-flex items-center justify-center rounded-full transition-colors",
                  s.trigger,
                  isToolbar &&
                    cn(
                      "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      triggerClassName
                    ),
                  usesHoverTrigger && "hover:bg-accent",
                  isInline && !isToolbar && "hover:bg-muted/80",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
                onClick={() => {
                  clearExpandTimer();
                  if (usesHoverTrigger) {
                    setExpanded(true);
                  } else {
                    setExpanded((open) => !open);
                  }
                }}
                onPointerDown={(e) => {
                  if (!usesHoverTrigger) return;
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
                    popEmoji &&
                      summary.viewerEmoji &&
                      popEmoji === summary.viewerEmoji &&
                      "reaction-icon-pop"
                  )}
                >
                  {isToolbar ? (
                    toolbarTriggerContent
                  ) : isInline ? (
                    inlineTriggerGlyph
                  ) : (
                    defaultTriggerContent
                  )}
                </span>
                {isDefault && (
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
                )}
              </button>
            )}
          </div>
        </div>
        {actions}
      </div>

      {totalCount > 0 && targetType !== "message" && (
        <div className="relative">
          <button
            type="button"
            className={cn(
              "inline-flex items-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
              s.summary,
              listOpen && "bg-accent/60 text-foreground"
            )}
            aria-label={summaryLabel}
            aria-haspopup="dialog"
            aria-expanded={listOpen}
            onClick={toggleList}
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
          </button>
          <ReactionsListDialog
            targetType={targetType}
            targetId={targetId}
            summary={summary}
            open={listOpen}
            onClose={() => setListOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
