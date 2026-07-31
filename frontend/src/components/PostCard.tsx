import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";
import type { PostView, ReactionSummary } from "@/api/types";
import { PostActionRow } from "@/components/PostActionRow";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionBar } from "@/components/ReactionBar";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { canSharePost, shareAttributionLabel } from "@/lib/sharePost";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: PostView;
  currentUserId: string;
  sharingPostId: string | null;
  onDelete: (postId: string) => void;
  onShare: (postId: string) => void;
  onReactionSummaryChange: (postId: string, summary: ReactionSummary) => void;
  className?: string;
};

export function PostCard({
  post,
  currentUserId,
  sharingPostId,
  onDelete,
  onShare,
  onReactionSummaryChange,
  className,
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const attribution = shareAttributionLabel(currentUserId, post);
  const isShare = Boolean(post.sharedFromPostId);
  const isOwner = currentUserId === post.author.id;
  const profilePath = `/u/${post.author.username || post.author.id}`;
  const postPath = `/posts/${post.id}`;

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
    <article className={cn("feed-card feed-post-enter overflow-hidden", className)}>
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-start gap-3">
          <Link to={profilePath} className="shrink-0" aria-label={`${post.author.displayName}'s profile`}>
            <ProfileAvatar
              displayName={post.author.displayName}
              avatarUrl={post.author.avatarUrl}
              size="sm"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {attribution ? (
                  <p className="font-semibold leading-snug">{attribution}</p>
                ) : (
                  <Link
                    className="font-semibold leading-snug underline-offset-2 hover:underline"
                    to={profilePath}
                  >
                    {post.author.displayName}
                    {post.author.username ? (
                      <span className="font-normal text-muted-foreground">{` @${post.author.username}`}</span>
                    ) : null}
                  </Link>
                )}
                <time
                  className="mt-0.5 block text-xs text-muted-foreground"
                  dateTime={post.createdAt}
                  title={formatAbsoluteTime(post.createdAt) || undefined}
                >
                  {formatRelativeTime(post.createdAt)}
                </time>
              </div>

              {isOwner && (
                <div ref={menuRef} className="relative shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label="Post options"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 z-10 mt-1 min-w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(post.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Delete post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2.5">
              {isShare ? (
                <SharedPostEmbed sharedFrom={post.sharedFrom} />
              ) : (
                <>
                  {post.body ? (
                    <Link to={postPath} className="block group/post">
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed group-hover/post:text-foreground/90">
                        {post.body}
                      </p>
                    </Link>
                  ) : null}
                  {post.imageUrl && (
                    <Link to={postPath} className="mt-3 block overflow-hidden rounded-xl border border-border/60">
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="max-h-[28rem] w-full object-cover transition-transform duration-300 hover:scale-[1.01]"
                      />
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="feed-action-row mx-4 mt-2 mb-3">
        <PostActionRow
          size="md"
          commentTo={`/posts/${post.id}#comments`}
          onShare={canSharePost(currentUserId, post) ? () => onShare(post.id) : undefined}
          shareBusy={sharingPostId === post.id}
        >
          <ReactionBar
            size="md"
            targetType="post"
            targetId={post.id}
            summary={post.reactionSummary}
            onSummaryChange={(reactionSummary) => onReactionSummaryChange(post.id, reactionSummary)}
          />
        </PostActionRow>
      </div>
    </article>
  );
}
