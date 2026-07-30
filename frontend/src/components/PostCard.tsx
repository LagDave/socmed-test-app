import { Link } from "react-router-dom";
import type { PostView, ReactionSummary } from "@/api/types";
import { PostActionRow } from "@/components/PostActionRow";
import { ReactionBar } from "@/components/ReactionBar";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";

type PostCardProps = {
  post: PostView;
  viewerId: string;
  onDeleteRequest: (postId: string) => void;
  onReactionChange: (postId: string, reactionSummary: ReactionSummary) => void;
};

export function PostCard({ post, viewerId, onDeleteRequest, onReactionChange }: PostCardProps) {
  return (
    <li className="feed-card p-5">
      <div className="flex items-baseline justify-between gap-2 pb-3">
        <Link
          className="font-medium underline-offset-2 hover:underline"
          to={`/u/${post.author.username || post.author.id}`}
        >
          {post.author.displayName}
          {post.author.username ? ` @${post.author.username}` : ""}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
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
      <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" className="mt-4 max-h-96 w-full rounded-lg object-cover" />
      )}
      <PostActionRow className="mt-4" size="md" commentTo={`/posts/${post.id}#comments`}>
        <ReactionBar
          size="md"
          targetType="post"
          targetId={post.id}
          summary={post.reactionSummary}
          onSummaryChange={(reactionSummary) => onReactionChange(post.id, reactionSummary)}
        />
      </PostActionRow>
    </li>
  );
}
