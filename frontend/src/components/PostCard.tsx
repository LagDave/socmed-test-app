import { Link } from "react-router-dom";
import { ImageIcon, UserRound } from "lucide-react";
import type { PostView, ReactionSummary } from "@/api/types";
import { PostActionRow } from "@/components/PostActionRow";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionBar } from "@/components/ReactionBar";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  isProfileActivityPost,
  isProfilePicturePost,
  profileActivityDisplayBody,
  profileActivityHasCustomCaption,
  profileActivityKind,
} from "@/lib/profileActivityPosts";
import { canSharePost, shareAttributionLabel } from "@/lib/sharePost";
import { cn } from "@/lib/utils";

/** Full card width — offsets the header avatar column (sm + gap-2.5). */
const POST_MEDIA_BREAKOUT =
  "-ml-[calc(2.5rem+0.625rem)] flex w-[calc(100%+2.5rem+0.625rem)] justify-center";

function ProfileActivityMedia({ body, imageUrl }: { body: string; imageUrl: string }) {
  const isAvatar = isProfilePicturePost(body);

  if (isAvatar) {
    return (
      <div className={`mt-3 ${POST_MEDIA_BREAKOUT}`}>
        <div className="relative inline-flex">
          <div
            className="absolute -inset-2 rounded-full bg-gradient-to-br from-foreground/10 via-transparent to-foreground/5 blur-sm"
            aria-hidden="true"
          />
          <img
            src={imageUrl}
            alt=""
            className="relative size-44 rounded-full object-cover shadow-[0_10px_28px_rgba(0,0,0,0.16)] ring-4 ring-card sm:size-48"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-3 ${POST_MEDIA_BREAKOUT}`}>
      <div className="w-full max-w-2xl overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-border/70">
        <img src={imageUrl} alt="" className="block max-h-80 w-full object-cover sm:max-h-96" />
      </div>
    </div>
  );
}

function PostActivityImage({ body, imageUrl }: { body: string; imageUrl: string }) {
  if (isProfileActivityPost(body)) {
    return <ProfileActivityMedia body={body} imageUrl={imageUrl} />;
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
  const activityKind = profileActivityKind(post.body);
  const isActivity = activityKind !== null;
  const displayBody = profileActivityDisplayBody(post.body);
  const hasCustomCaption = profileActivityHasCustomCaption(post.body);

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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => onDeleteRequest(post.id)}
        >
          Delete
        </Button>
      )}
    </div>
  );

  const bodyBlock = isShare ? (
    <SharedPostEmbed sharedFrom={post.sharedFrom} />
  ) : (
    <>
      {isActivity && (
        <span className="profile-activity-badge mt-2 inline-flex items-center gap-1.5">
          {activityKind === "avatar" ? (
            <UserRound className="size-3" aria-hidden="true" />
          ) : (
            <ImageIcon className="size-3" aria-hidden="true" />
          )}
          {activityKind === "avatar" ? "Profile picture" : "Cover photo"}
        </span>
      )}
      <p
        className={cn(
          "mt-2 whitespace-pre-wrap leading-relaxed",
          isActivity && !hasCustomCaption
            ? "text-sm font-medium text-muted-foreground"
            : "text-[15px] text-foreground/95"
        )}
      >
        {displayBody}
      </p>
      {post.imageUrl && <PostActivityImage body={post.body} imageUrl={post.imageUrl} />}
    </>
  );

  return (
    <div className="flex items-start gap-2.5">
      <Link
        to={`/u/${post.author.username || post.author.id}`}
        className="shrink-0 transition-opacity hover:opacity-85"
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
              className="min-w-0 font-medium leading-snug underline-offset-2 transition-colors hover:text-foreground/80 hover:underline"
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
