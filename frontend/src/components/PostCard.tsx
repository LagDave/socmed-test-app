import { Link } from "react-router-dom";
import type { PostView, ReactionSummary } from "@/api/types";
import { PostActionRow } from "@/components/PostActionRow";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionBar } from "@/components/ReactionBar";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { canSharePost, shareAttributionLabel } from "@/lib/sharePost";
import { cn } from "@/lib/utils";

export const PROFILE_PICTURE_POST_BODY = "Updated profile picture.";
export const COVER_PHOTO_POST_BODY = "Updated cover photo.";

function isProfileActivityPost(body: string): boolean {
  return body === PROFILE_PICTURE_POST_BODY || body === COVER_PHOTO_POST_BODY;
}

/** Full card width — offsets the header avatar column (sm + gap-2.5). */
const POST_MEDIA_BREAKOUT =
  "-ml-[calc(2.5rem+0.625rem)] flex w-[calc(100%+2.5rem+0.625rem)] justify-center";

function PostActivityImage({ body, imageUrl }: { body: string; imageUrl: string }) {
  if (body === PROFILE_PICTURE_POST_BODY || body === COVER_PHOTO_POST_BODY) {
    return (
      <div className={`mt-2.5 ${POST_MEDIA_BREAKOUT}`}>
        <img
          src={imageUrl}
          alt=""
          className="block h-auto max-h-80 w-auto max-w-full rounded-lg border border-border sm:max-h-96"
        />
      </div>
    );
  }
  return <img src={imageUrl} alt="" className="mt-2.5 max-h-96 w-full rounded-lg object-cover" />;
}

type PostCardProps = {
  post: PostView;
  viewerId: string;
  onDeleteRequest: (postId: string) => void;
  onReactionChange: (postId: string, reactionSummary: ReactionSummary) => void;
  onShare?: (postId: string) => void;
  shareBusy?: boolean;
};

export function PostCard({
  post,
  viewerId,
  onDeleteRequest,
  onReactionChange,
  onShare,
  shareBusy = false,
}: PostCardProps) {
  const attribution = shareAttributionLabel(viewerId, post);
  const isShare = Boolean(post.sharedFromPostId);

  const metaRow = (
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
  );

  const bodyBlock = isShare ? (
    <SharedPostEmbed sharedFrom={post.sharedFrom} />
  ) : (
    <>
      <p
        className={`mt-1.5 whitespace-pre-wrap leading-relaxed ${
          isProfileActivityPost(post.body)
            ? "text-sm font-medium text-muted-foreground"
            : "text-[15px]"
        }`}
      >
        {post.body}
      </p>
      {post.imageUrl && <PostActivityImage body={post.body} imageUrl={post.imageUrl} />}
    </>
  );

  return (
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
          {metaRow}
        </div>
        {bodyBlock}
        <div className={cn("mt-2.5 border-t border-border/70 pt-2", POST_MEDIA_BREAKOUT)}>
          <PostActionRow
            size="md"
            commentTo={`/posts/${post.id}#comments`}
            onShare={onShare && canSharePost(viewerId, post) ? () => onShare(post.id) : undefined}
            shareBusy={shareBusy}
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
  );
}
