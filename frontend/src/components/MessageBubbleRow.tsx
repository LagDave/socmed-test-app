import { Link } from "react-router-dom";
import type { MessageView, PublicUser } from "@/api/types";
import { MessageReactionBar } from "@/components/MessageReactionBar";
import { ProfileAvatar } from "@/components/ProfileAvatar";
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
  return (
    <div className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
      {!mine &&
        (showAvatar && peer ? (
          <Link to={peerProfilePath} className="shrink-0 self-end" aria-label={`${peer.displayName}'s profile`}>
            <ProfileAvatar displayName={peer.displayName} avatarUrl={peer.avatarUrl} size="sm" />
          </Link>
        ) : (
          <div className="h-10 w-10 shrink-0" aria-hidden="true" />
        ))}

      <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-0.5", mine ? "items-end" : "items-start")}>
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
          <>
            <MessageReactionBar
              messageId={message.id}
              summary={message.reactionSummary}
              onSummaryChange={(summary) => onReactionChange(message.id, summary)}
              onError={onError}
              className={mine ? "justify-end" : "justify-start"}
            />
            {showMeta && (
              <div
                className={cn(
                  "flex items-center gap-2 px-1",
                  mine ? "flex-row-reverse" : "flex-row"
                )}
              >
                <time
                  className="text-[11px] text-muted-foreground"
                  dateTime={message.createdAt}
                  title={formatAbsoluteTime(message.createdAt) || undefined}
                >
                  {formatRelativeTime(message.createdAt)}
                </time>
                {mine && (
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => onUnsend(message.id)}
                  >
                    Unsend
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
