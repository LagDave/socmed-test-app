import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ImageIcon, MoreHorizontal, Trash2, UserRound } from "lucide-react";
import type { PostView, ReactionSummary } from "@/api/types";
import { PostActionRow } from "@/components/PostActionRow";
import { FriendPresenceAvatar } from "@/components/FriendPresenceAvatar";
import { ReactionBar } from "@/components/ReactionBar";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";
import { PostMediaGallery } from "@/components/PostMediaGallery";
import { Button } from "@/components/ui/button";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  isProfilePicturePost,
  profileActivityDisplayBody,
  profileActivityHasCustomCaption,
  profileActivityKind,
} from "@/lib/profileActivityPosts";
import { ShareAttribution } from "@/components/ShareAttribution";
import { canSharePost } from "@/lib/sharePost";
import { postMediaImages, postMediaUrls } from "@/lib/postMedia";
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

function wrapFeedMediaStage(node: ReactNode, variant: "standalone" | "embedded") {
  if (variant === "embedded") return node;
  return <div className="post-media-stage">{node}</div>;
}

function PostStandardMedia({
  post,
  postPath,
  mediaMode = "feed",
  variant = "standalone",
  onReactionSummaryChange,
  onPhotoReactionSummaryChange,
  onShare,
  sharingPostId = null,
  currentUserId,
}: {
  post: PostView;
  postPath: string;
  mediaMode?: "feed" | "detail";
  variant?: "standalone" | "embedded";
  currentUserId: string;
  onReactionSummaryChange: (postId: string, summary: ReactionSummary) => void;
  onPhotoReactionSummaryChange?: (postImageId: string, summary: ReactionSummary) => void;
  onShare?: (postId: string) => void;
  sharingPostId?: string | null;
}) {
  const media = postMediaImages(post);
  if (media.length === 0) return null;

  const detailActions =
    mediaMode === "detail"
      ? {
          postId: post.id,
          postReactionSummary: post.reactionSummary,
          onPostReactionSummaryChange: (summary: ReactionSummary) =>
            onReactionSummaryChange(post.id, summary),
          onPhotoReactionSummaryChange: (postImageId: string, summary: ReactionSummary) =>
            onPhotoReactionSummaryChange?.(postImageId, summary),
          onShare,
          sharingPostId,
          canShare: canSharePost(currentUserId, post),
          shareCount: post.shareCount,
        }
      : undefined;

  if (media.length > 1 || mediaMode === "detail") {
    return wrapFeedMediaStage(
      <PostMediaGallery
        media={media}
        postPath={postPath}
        mode={mediaMode === "detail" ? "detail" : "feed"}
        postActions={detailActions}
      />,
      variant
    );
  }
  return wrapFeedMediaStage(
    <Link to={postPath} className="mt-3 block overflow-hidden rounded-xl border border-border/60">
      <img
        src={media[0].url}
        alt=""
        className="max-h-[28rem] w-full object-cover transition-transform duration-300 hover:scale-[1.01]"
      />
    </Link>,
    variant
  );
}

type PostCardProps = {
  post: PostView;
  currentUserId: string;
  onDelete: (postId: string) => void;
  onReactionSummaryChange: (postId: string, summary: ReactionSummary) => void;
  onPhotoReactionSummaryChange?: (postImageId: string, summary: ReactionSummary) => void;
  onShare?: (postId: string) => void;
  sharingPostId?: string | null;
  /** When embedded inside an outer feed-card (e.g. profile timeline). */
  variant?: "standalone" | "embedded";
  /** Full photo album on post detail; grid + link on feed. */
  postMediaMode?: "feed" | "detail";
  className?: string;
};

export function PostCard({
  post,
  currentUserId,
  onDelete,
  onReactionSummaryChange,
  onPhotoReactionSummaryChange,
  onShare,
  sharingPostId = null,
  variant = "standalone",
  postMediaMode = "feed",
  className,
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isShare = Boolean(post.sharedFromPostId);
  const isOwner = currentUserId === post.author.id;
  const profilePath = `/u/${post.author.username || post.author.id}`;
  const postPath = `/posts/${post.id}`;
  const activityKind = profileActivityKind(post.body);
  const isActivity = activityKind !== null;
  const displayBody = profileActivityDisplayBody(post.body);
  const hasCustomCaption = profileActivityHasCustomCaption(post.body);
  const mediaUrls = postMediaUrls(post);
  const perPhotoActions = !isActivity && postMediaMode === "detail" && mediaUrls.length > 0;

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

  const standardMedia =
    !isShare && !isActivity && mediaUrls.length > 0 ? (
      <PostStandardMedia
        post={post}
        postPath={postPath}
        mediaMode={postMediaMode}
        variant={variant}
        currentUserId={currentUserId}
        onReactionSummaryChange={onReactionSummaryChange}
        onPhotoReactionSummaryChange={onPhotoReactionSummaryChange}
        onShare={onShare}
        sharingPostId={sharingPostId}
      />
    ) : null;
  const sharedPostEmbed = isShare ? (
    <SharedPostEmbed sharedFrom={post.sharedFrom} className={post.body.trim() ? "mt-2.5" : undefined} />
  ) : null;

  const bodyBlock = isShare ? (
    <>
      {post.body.trim() ? (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95">{post.body}</p>
      ) : null}
      {variant === "embedded" ? sharedPostEmbed : null}
    </>
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
      {displayBody ? (
        isActivity ? (
          <p
            className={cn(
              "mt-2 whitespace-pre-wrap leading-relaxed",
              !hasCustomCaption ? "text-sm font-medium text-muted-foreground" : "text-[15px] text-foreground/95"
            )}
          >
            {displayBody}
          </p>
        ) : (
          <Link to={postPath} className="block group/post">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed group-hover/post:text-foreground/90">
              {displayBody}
            </p>
          </Link>
        )
      ) : null}
      {variant === "embedded" ? standardMedia : null}
      {isActivity && post.imageUrl ? (
        <ProfileActivityMedia body={post.body} imageUrl={post.imageUrl} />
      ) : null}
    </>
  );

  const content = (
    <>
      <div className={variant === "embedded" ? undefined : "px-4 pt-4 pb-1"}>
        <div className="flex items-start gap-3">
          <Link to={profilePath} className="shrink-0" aria-label={`${post.author.displayName}'s profile`}>
            <FriendPresenceAvatar user={post.author} />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {isShare ? (
                  <ShareAttribution viewerId={currentUserId} post={post} />
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

            <div className="mt-2.5">{bodyBlock}</div>
          </div>
        </div>
        {variant === "standalone" ? (isShare ? sharedPostEmbed : standardMedia) : null}
      </div>

      {perPhotoActions ? null : (
        <div className={cn("feed-action-row mt-2 mb-3", variant === "standalone" && "mx-4")}>
          <PostActionRow
            size="md"
            commentTo={`/posts/${post.id}#comments`}
            commentCount={post.commentCount}
            onShare={onShare && canSharePost(currentUserId, post) ? () => onShare(post.id) : undefined}
            shareBusy={sharingPostId === post.id}
            shareCount={post.shareCount}
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
      )}
    </>
  );

  if (variant === "embedded") {
    return <div className={className}>{content}</div>;
  }

  return (
    <article className={cn("feed-card feed-post-enter overflow-hidden", className)}>{content}</article>
  );
}
