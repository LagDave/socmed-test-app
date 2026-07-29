import type { ReactionEmoji } from "@/api/types";
import { reactionOption } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

export function ReactionIcon({
  emoji,
  className,
}: {
  emoji: ReactionEmoji | null;
  /** Kept for call-site compatibility; emoji stickers are always full-color. */
  filled?: boolean;
  muted?: boolean;
  className?: string;
}) {
  const { glyph } = reactionOption(emoji);
  return (
    <span aria-hidden className={cn("inline-block leading-none select-none", className)}>
      {glyph}
    </span>
  );
}
