import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import type { MessageView, PublicUser } from "@/api/types";
import { ReactionBar } from "@/components/ReactionBar";
import { REACTION_OPTIONS } from "@/lib/reactionOptions";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";

export function MessageBubbleRow({
  message,
  mine,
  peer,
  showAvatar,
  showMeta,
  peerProfilePath,
  onUnsend,
  onReactionChange,
  onError,
}: {
  message: MessageView;
  mine: boolean;
  peer: PublicUser | null;
  showAvatar: boolean;
  showMeta: boolean;
  peerProfilePath: string;
  onUnsend: (id: string) => void;
  onReactionChange: (id: string, summary: MessageView["reactionSummary"]) => void;
  onError: (message: string) => void;
}) {
  const hasReactions = REACTION_OPTIONS.some((o) => message.reactionSummary.counts[o.emoji] > 0);

  return (
    <div className={cn("group/message flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
      {!mine &&
        (showAvatar && peer ? (
          <Link to={peerProfilePath} className="shrink-0 self-end" aria-label={`${peer.displayName}'s profile`}>
            <ProfileAvatar displayName={peer.displayName} avatarUrl={peer.avatarUrl} size="sm" />
          </Link>
        ) : (
          <div className="h-10 w-10 shrink-0" aria-hidden="true" />
        ))}

      <div
        className={cn(
          "flex min-w-0 max-w-[85%] items-end gap-1",
          mine ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className={cn("flex min-w-0 flex-col gap-0.5", mine ? "items-end" : "items-start")}>
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm",
              message.isUnsent
                ? "border border-dashed border-border bg-transparent italic text-muted-foreground shadow-none"
                : mine
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground"
            )}
          >
            {message.isUnsent ? (
              "Unsent a message"
            ) : (
              <>
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt=""
                    className="mb-2 max-h-72 w-full rounded-lg object-cover"
                  />
                )}
                {message.body}
              </>
            )}
          </div>

          {!message.isUnsent && (
            <div
              className={cn(
                "max-w-full px-0.5 transition-opacity",
                !hasReactions &&
                  "opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100"
              )}
            >
              <ReactionBar
                targetType="message"
                targetId={message.id}
                summary={message.reactionSummary}
                onSummaryChange={(summary) => onReactionChange(message.id, summary)}
                onError={onError}
                size="sm"
              />
            </div>
          )}

          {showMeta && (
            <time
              className="px-1 text-[11px] text-muted-foreground"
              dateTime={message.createdAt}
              title={formatAbsoluteTime(message.createdAt) || undefined}
            >
              {formatRelativeTime(message.createdAt)}
            </time>
          )}
        </div>

        {mine && !message.isUnsent && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/message:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                aria-label="Message options"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="left">
              <DropdownMenuItem onSelect={() => onUnsend(message.id)}>Unsend</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
