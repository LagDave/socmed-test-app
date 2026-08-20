import type { MessageReplyToView } from "@/api/types";
import { cn } from "@/lib/utils";

const QUOTE_SNIPPET_MAX = 80;

export function truncateQuoteText(text: string, max = QUOTE_SNIPPET_MAX): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function messageQuotePreview(replyTo: MessageReplyToView): string {
  if (replyTo.isUnsent) return "Message unavailable";
  if (replyTo.body?.trim()) return truncateQuoteText(replyTo.body);
  if (replyTo.imageUrl) return "Photo";
  return "Message";
}

type MessageQuoteStripProps = {
  replyTo: MessageReplyToView;
  mine: boolean;
  themed?: boolean;
  className?: string;
};

export function MessageQuoteStrip({ replyTo, mine, themed = false, className }: MessageQuoteStripProps) {
  const unavailable = replyTo.isUnsent;

  return (
    <div
      className={cn(
        "mb-1.5 border-l-2 pl-2 text-xs leading-snug",
        themed
          ? mine
            ? "border-[color-mix(in_srgb,var(--chat-bubble-mine-fg)_35%,transparent)] text-[color-mix(in_srgb,var(--chat-bubble-mine-fg)_80%,transparent)]"
            : "border-[color-mix(in_srgb,var(--chat-bubble-theirs-fg)_35%,transparent)] text-[color-mix(in_srgb,var(--chat-bubble-theirs-fg)_75%,transparent)]"
          : mine
            ? "border-background/40 text-background/80"
            : "border-foreground/25 text-muted-foreground",
        className
      )}
    >
      <p
        className={cn(
          "font-semibold",
          themed
            ? mine
              ? "text-[var(--chat-bubble-mine-fg)]"
              : "text-[var(--chat-bubble-theirs-fg)]"
            : mine
              ? "text-background"
              : "text-foreground"
        )}
      >
        {replyTo.senderDisplayName}
      </p>
      {unavailable ? (
        <p className="italic opacity-80">Message unavailable</p>
      ) : (
        <div className="flex items-center gap-2">
          {replyTo.imageUrl && (
            <div className="user-media-stage h-8 w-8 shrink-0 rounded">
              <img src={replyTo.imageUrl} alt="" className="user-media-thumbnail rounded" />
            </div>
          )}
          {replyTo.body?.trim() ? (
            <p className="min-w-0 truncate opacity-90">{truncateQuoteText(replyTo.body)}</p>
          ) : replyTo.imageUrl ? (
            <p className="opacity-90">Photo</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
