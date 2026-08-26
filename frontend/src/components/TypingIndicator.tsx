import { cn } from "@/lib/utils";

type TypingIndicatorProps = {
  displayName: string;
  compact?: boolean;
  themed?: boolean;
  className?: string;
};

export function TypingIndicator({
  displayName,
  compact = false,
  themed = false,
  className,
}: TypingIndicatorProps) {
  const typingName = displayName.trim().split(/\s+/, 1)[0] || displayName;

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5",
        themed ? "text-[var(--chat-thread-muted)]" : "text-muted-foreground",
        compact ? "text-sm" : "px-5 py-2 text-xs",
        className
      )}
    >
      <span className={cn("truncate", compact && "italic")}>
        {typingName} is typing
        {compact ? "…" : ""}
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden="true">
        <span className="typing-dot" />
        <span className="typing-dot typing-dot-delay-1" />
        <span className="typing-dot typing-dot-delay-2" />
      </span>
    </div>
  );
}
