import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";
import type { CommentView, ReactionSummary } from "@/api/types";
import { ReplyActionButton } from "@/components/PostActionRow";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionBar } from "@/components/ReactionBar";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";

type CommentItemProps = {
  comment: CommentView;
  currentUserId?: string;
  isReply?: boolean;
  onReply?: () => void;
  onDelete: () => void;
  onReactionSummaryChange: (summary: ReactionSummary) => void;
};

export function CommentItem({
  comment,
  currentUserId,
  isReply = false,
  onReply,
  onDelete,
  onReactionSummaryChange,
}: CommentItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profilePath = `/u/${comment.author.username || comment.author.id}`;
  const isOwner = currentUserId === comment.author.id;

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <article
      className={cn(
        "comment-item feed-post-enter",
        isReply ? "comment-item-reply" : "comment-item-root"
      )}
    >
      <div className="flex items-start gap-2.5">
        <Link to={profilePath} className="shrink-0" aria-label={`${comment.author.displayName}'s profile`}>
          <ProfileAvatar
            displayName={comment.author.displayName}
            avatarUrl={comment.author.avatarUrl}
            size="sm"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                className="text-sm font-semibold leading-snug underline-offset-2 hover:underline"
                to={profilePath}
              >
                {comment.author.displayName}
                {comment.author.username ? (
                  <span className="font-normal text-muted-foreground">{` @${comment.author.username}`}</span>
                ) : null}
              </Link>
              <time
                className="mt-0.5 block text-xs text-muted-foreground"
                dateTime={comment.createdAt}
                title={formatAbsoluteTime(comment.createdAt) || undefined}
              >
                {formatRelativeTime(comment.createdAt)}
              </time>
            </div>

            {isOwner && (
              <div ref={menuRef} className="relative shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Comment options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-10 mt-1 min-w-36 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {comment.body ? (
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{comment.body}</p>
          ) : null}

          {comment.imageUrl && (
            <img
              src={comment.imageUrl}
              alt=""
              className="mt-2.5 max-h-52 w-full rounded-lg border border-border/70 object-cover"
            />
          )}

          <div className="comment-action-row mt-2">
            <ReactionBar
              size="sm"
              targetType="comment"
              targetId={comment.id}
              summary={comment.reactionSummary}
              onSummaryChange={onReactionSummaryChange}
              actions={onReply ? <ReplyActionButton onClick={onReply} /> : undefined}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
