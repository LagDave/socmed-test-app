import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImageIcon, MoreHorizontal, Trash2, UserRound } from "lucide-react";
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
import { postImageUrls } from "@/lib/postImages";
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

function PostActivityImage({
  body,
  imageUrl,
  postPath,
}: {
  body: string;
  imageUrl: string;
  postPath: string;
}) {
  if (isProfileActivityPost(body)) {
    return <ProfileActivityMedia body={body} imageUrl={imageUrl} />;
  }
  return (
    <Link
      to={postPath}
      className="post-media-gallery post-media-single block overflow-hidden rounded-xl ring-1 ring-border/60"
    >
        <img
          src={imageUrl}
          alt=""
          className="max-h-80 w-full object-cover sm:max-h-96 transition-transform duration-300 hover:scale-[1.02]"
        />
    </Link>
  );
}

function PostMediaGallery({
  urls,
  postPath,
  isActivity,
  body,
}: {
  urls: string[];
  postPath: string;
  isActivity: boolean;
  body: string;
}) {
  if (urls.length === 0) return null;

  if (isActivity && urls.length === 1) {
    return <PostActivityImage body={body} imageUrl={urls[0]} postPath={postPath} />;
  }

  const imgClass =
    "h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]";

  if (urls.length === 1) {
    return (
      <Link
        to={postPath}
        className="post-media-gallery post-media-single block overflow-hidden rounded-xl ring-1 ring-border/60"
      >
        <img src={urls[0]} alt="" className="max-h-80 w-full object-cover sm:max-h-96" />
      </Link>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="post-media-gallery post-media-duo grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl ring-1 ring-border/60">
        {urls.map((url, index) => (
          <Link key={`${url}-${index}`} to={postPath} className="aspect-[4/3] overflow-hidden">
            <img src={url} alt="" className={imgClass} />
          </Link>
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className="post-media-gallery post-media-trio grid grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden rounded-xl ring-1 ring-border/60">
        <Link to={postPath} className="row-span-2 overflow-hidden">
          <img src={urls[0]} alt="" className={cn(imgClass, "min-h-[12rem]")} />
        </Link>
        <Link to={postPath} className="overflow-hidden">
          <img src={urls[1]} alt="" className={cn(imgClass, "aspect-[4/3]")} />
        </Link>
        <Link to={postPath} className="overflow-hidden">
          <img src={urls[2]} alt="" className={cn(imgClass, "aspect-[4/3]")} />
        </Link>
      </div>
    );
  }

  const visible = urls.slice(0, 4);
  const extra = urls.length - 4;

  return (
    <div className="post-media-gallery post-media-grid grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl ring-1 ring-border/60">
      {visible.map((url, index) => (
        <Link
          key={`${url}-${index}`}
          to={postPath}
          className="relative aspect-square overflow-hidden"
        >
          <img src={url} alt="" className={imgClass} />
          {index === 3 && extra > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
              +{extra}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

type PostCardProps = {
  post: PostView;
  currentUserId: string;
  onDelete: (postId: string) => void;
  onReactionSummaryChange: (postId: string, summary: ReactionSummary) => void;
  onShare?: (postId: string) => void;
  sharingPostId?: string | null;
  /** When embedded inside an outer feed-card (e.g. profile timeline). */
  variant?: "standalone" | "embedded";
  /** Icon + label action row at md+ — feed and post detail only. */
  showActionLabels?: boolean;
  className?: string;
};

export function PostCard({
  post,
  currentUserId,
  onDelete,
  onReactionSummaryChange,
  onShare,
  sharingPostId = null,
  variant = "standalone",
  showActionLabels = false,
  className,
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const attribution = shareAttributionLabel(currentUserId, post);
  const isShare = Boolean(post.sharedFromPostId);
  const isOwner = currentUserId === post.author.id;
  const profilePath = `/u/${post.author.username || post.author.id}`;
  const postPath = `/posts/${post.id}`;
  const activityKind = profileActivityKind(post.body);
  const isActivity = activityKind !== null;
  const displayBody = profileActivityDisplayBody(post.body);
  const hasCustomCaption = profileActivityHasCustomCaption(post.body);
  const mediaUrls = isShare ? [] : postImageUrls(post);

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
    </>
  );

  const content = (
    <>
      <div className={variant === "embedded" ? undefined : "px-4 pt-4 pb-1"}>
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

            <div className={cn("mt-2", displayBody && "mt-2.5")}>{bodyBlock}</div>
          </div>
        </div>

        {mediaUrls.length > 0 && (
          <div className="post-media-stage">
            <PostMediaGallery
              urls={mediaUrls}
              postPath={postPath}
              isActivity={isActivity}
              body={post.body}
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          "feed-action-row mt-2 mb-3",
          variant === "embedded" ? cn("border-t border-border/70 pt-2", POST_MEDIA_BREAKOUT) : "mx-4"
        )}
      >
        <PostActionRow
          size="md"
          showLabels={showActionLabels}
          commentTo={`/posts/${post.id}#comments`}
          onShare={onShare && canSharePost(currentUserId, post) ? () => onShare(post.id) : undefined}
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
    </>
  );

  if (variant === "embedded") {
    return <div className={className}>{content}</div>;
  }

  return (
    <article className={cn("feed-card feed-post-enter overflow-hidden", className)}>{content}</article>
  );
}
