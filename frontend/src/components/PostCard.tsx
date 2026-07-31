import { Link } from "react-router-dom";
import type { PostView, ReactionSummary } from "@/api/types";
import { PostActionRow } from "@/components/PostActionRow";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionBar } from "@/components/ReactionBar";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { canSharePost, shareAttributionLabel } from "@/lib/sharePost";

type PostCardProps = {
  post: PostView;
  viewerId: string;
  onDeleteRequest: (postId: string) => void;
  onReactionChange: (postId: string, reactionSummary: ReactionSummary) => void;
  onShareRequest?: (postId: string) => void;
  sharingPostId?: string | null;
};

export function PostCard({
  post,
  viewerId,
  onDeleteRequest,
  onReactionChange,
  onShareRequest,
  sharingPostId = null,
}: PostCardProps) {
  const attribution = shareAttributionLabel(viewerId, post);
  const isShare = Boolean(post.sharedFromPostId);

  return (
    <li className="feed-card px-3 py-3">
      <div className="flex items-start gap-2.5">
        <Link
          to={`/u/${post.author.username || post.author.id}`}
          className="shrink-0"
          aria-label={`${post.author.displayName}'s profile`}
        >
          <ProfileAvatar displayName={post.author.displayName} avatarUrl={post.author.avatarUrl} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {attribution ? (
              <p className="min-w-0 font-medium leading-snug">{attribution}</p>
            ) : (
              <Link
                className="min-w-0 font-medium leading-snug underline-offset-2 hover:underline"
                to={`/u/${post.author.username || post.author.id}`}
              >
                {post.author.displayName}
                {post.author.username ? (
                  <span className="font-normal text-muted-foreground">{` @${post.author.username}`}</span>
                ) : null}
              </Link>
            )}
            <div className="flex shrink-0 items-center gap-1.5">
              <time
                className="text-xs text-muted-foreground"
                dateTime={post.createdAt}
                title={formatAbsoluteTime(post.createdAt) || undefined}
              >
                {formatRelativeTime(post.createdAt)}
              </time>
              {viewerId === post.author.id && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onDeleteRequest(post.id)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
          {isShare ? (
            <SharedPostEmbed sharedFrom={post.sharedFrom} />
          ) : (
            <>
              <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="" className="mt-2.5 max-h-96 w-full rounded-lg object-cover" />
              )}
            </>
          )}
          <div className="mt-2.5 border-t border-border/70 pt-2">
            <PostActionRow
              size="md"
              commentTo={`/posts/${post.id}#comments`}
              onShare={
                onShareRequest && canSharePost(viewerId, post)
                  ? () => onShareRequest(post.id)
                  : undefined
              }
              shareBusy={sharingPostId === post.id}
            >
              <ReactionBar
                size="md"
                targetType="post"
                targetId={post.id}
                summary={post.reactionSummary}
                onSummaryChange={(reactionSummary) => onReactionChange(post.id, reactionSummary)}
              />
            </PostActionRow>
          </div>
        </div>
      </div>
    </li>
  );
}
