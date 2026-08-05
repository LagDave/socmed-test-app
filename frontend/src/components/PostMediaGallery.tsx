import { Link } from "react-router-dom";
import { Images } from "lucide-react";
import type { PostImageView, ReactionSummary } from "@/api/types";
import { PostActionRow } from "@/components/PostActionRow";
import { ReactionBar } from "@/components/ReactionBar";
import { postPhotoCommentsPath } from "@/lib/postMedia";
import { emptyReactionSummary } from "@/lib/reactions";
import { cn } from "@/lib/utils";

export type PostMediaActionsConfig = {
  postId: string;
  postReactionSummary: ReactionSummary;
  onPhotoReactionSummaryChange: (postImageId: string, summary: ReactionSummary) => void;
  onPostReactionSummaryChange: (summary: ReactionSummary) => void;
  onShare?: (postId: string) => void;
  sharingPostId?: string | null;
  canShare: boolean;
};

type PostMediaGalleryProps = {
  media: PostImageView[];
  postPath?: string;
  mode?: "feed" | "detail" | "compact";
  postActions?: PostMediaActionsConfig;
  className?: string;
};

type GridPreviewProps = {
  imageUrls: string[];
  compact: boolean;
  postPath?: string;
};

const POST_PHOTOS_ANCHOR = "photos";

function GridCell({
  src,
  alt,
  overlay,
  className,
}: {
  src: string;
  alt: string;
  overlay?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative h-full min-h-0 w-full overflow-hidden bg-muted/30", className)}>
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
        draggable={false}
      />
      {overlay ? (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl">
            {overlay}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function PostMediaGridPreview({ imageUrls, compact, postPath }: GridPreviewProps) {
  const count = imageUrls.length;
  const gridBase = cn(
    "grid w-full gap-0.5 bg-border/60",
    compact ? "post-media-grid--compact" : "post-media-grid"
  );

  const grid = (
    <>
      {count === 2 ? (
        <div className={cn(gridBase, "post-media-grid-two grid-cols-2")}>
          {imageUrls.map((url, index) => (
            <GridCell key={url} src={url} alt={`Photo ${index + 1}`} />
          ))}
        </div>
      ) : count === 3 ? (
        <div className={cn(gridBase, "post-media-grid-three grid-cols-2 grid-rows-2")}>
          <GridCell src={imageUrls[0]} alt="Photo 1" className="row-span-2" />
          <GridCell src={imageUrls[1]} alt="Photo 2" />
          <GridCell src={imageUrls[2]} alt="Photo 3" />
        </div>
      ) : (
        <div className={cn(gridBase, "post-media-grid-four grid-cols-2 grid-rows-2")}>
          {imageUrls.slice(0, 4).map((url, index) => (
            <GridCell
              key={url}
              src={url}
              alt={`Photo ${index + 1}`}
              overlay={count > 4 && index === 3 ? `+${count - 4}` : undefined}
            />
          ))}
        </div>
      )}
    </>
  );

  const shellClass =
    "post-media-grid-trigger group block w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left shadow-[var(--feed-shadow)] focus-visible:outline-none";

  if (postPath) {
    return (
      <Link
        to={`${postPath}#${POST_PHOTOS_ANCHOR}`}
        className={shellClass}
        aria-label={`View post with ${count} photos`}
      >
        {grid}
      </Link>
    );
  }

  return (
    <div className={shellClass} role="group" aria-label={`${count} photos`}>
      {grid}
    </div>
  );
}

function PostPhotoSlide({
  image,
  photoIndex,
  total,
  compact,
  postActions,
}: {
  image: PostImageView;
  photoIndex: number;
  total: number;
  compact: boolean;
  postActions?: PostMediaActionsConfig;
}) {
  const commentPath =
    postActions && image.id
      ? postPhotoCommentsPath(postActions.postId, image.id)
      : postActions
        ? `/posts/${postActions.postId}#comments`
        : undefined;
  const commentCount = image.commentCount ?? 0;
  const usesPhotoReaction = Boolean(image.id);
  const reactionSummary = usesPhotoReaction
    ? (image.reactionSummary ?? emptyReactionSummary())
    : postActions?.postReactionSummary ?? emptyReactionSummary();

  return (
    <figure className="post-photo-slide overflow-visible rounded-xl bg-gradient-to-b from-muted/20 to-muted/10 ring-1 ring-border/45 shadow-sm">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-t-xl bg-muted/20",
          compact ? "post-media-slide--compact" : "post-media-slide"
        )}
      >
        <img
          src={image.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading={photoIndex === 0 ? "eager" : "lazy"}
        />
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm">
          {photoIndex + 1} / {total}
        </span>
      </div>

      {postActions ? (
        <div className="post-photo-action-row overflow-visible rounded-b-xl border-t border-border/50 bg-card/80 px-2 py-2 backdrop-blur-sm sm:px-3">
          <PostActionRow
            size="md"
            commentTo={commentPath}
            commentCount={commentCount}
            showShare
            shareDisabled={!postActions.canShare}
            onShare={
              postActions.canShare && postActions.onShare
                ? () => postActions.onShare!(postActions.postId)
                : undefined
            }
            shareBusy={postActions.sharingPostId === postActions.postId}
          >
            <ReactionBar
              size="md"
              targetType={usesPhotoReaction ? "post_image" : "post"}
              targetId={usesPhotoReaction ? image.id : postActions.postId}
              summary={reactionSummary}
              onSummaryChange={(summary) => {
                if (usesPhotoReaction) {
                  postActions.onPhotoReactionSummaryChange(image.id, summary);
                } else {
                  postActions.onPostReactionSummaryChange(summary);
                }
              }}
            />
          </PostActionRow>
        </div>
      ) : null}
    </figure>
  );
}

function PostMediaAlbum({
  media,
  compact,
  className,
  detail = false,
  postActions,
}: {
  media: PostImageView[];
  compact: boolean;
  className?: string;
  detail?: boolean;
  postActions?: PostMediaActionsConfig;
}) {
  return (
    <section
      className={cn(
        "post-media-gallery overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[var(--feed-shadow)]",
        detail && "post-media-gallery--detail",
        className
      )}
      id={detail ? POST_PHOTOS_ANCHOR : undefined}
      aria-label={`Photo album, ${media.length} images`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-gradient-to-b from-muted/35 to-transparent px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Images className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Photo album
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {media.length} photos · scroll to browse
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/50">
          {media.length}
        </span>
      </div>

      <div
        className={cn(
          "post-media-gallery-scroll space-y-2.5 p-2.5 sm:p-3",
          detail
            ? "post-media-gallery-scroll--detail"
            : compact
              ? "max-h-64 sm:max-h-72"
              : "max-h-[30rem] sm:max-h-[34rem]",
          !detail && "overflow-y-auto overscroll-y-contain"
        )}
      >
        {media.map((image, index) => (
          <PostPhotoSlide
            key={image.id || `${image.url}-${index}`}
            image={image}
            photoIndex={index}
            total={media.length}
            compact={compact}
            postActions={detail ? postActions : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export function PostMediaGallery({
  media,
  postPath,
  mode = "feed",
  postActions,
  className,
}: PostMediaGalleryProps) {
  if (media.length === 0) return null;

  const compact = mode === "compact";
  const imageUrls = media.map((m) => m.url);

  if (media.length === 1) {
    const frame = (
      <div
        className={cn(
          "post-media-gallery overflow-visible rounded-2xl border border-border/50 bg-card shadow-[var(--feed-shadow)]",
          className
        )}
      >
        <PostPhotoSlide
          image={media[0]}
          photoIndex={0}
          total={1}
          compact={compact}
          postActions={mode === "detail" ? postActions : undefined}
        />
      </div>
    );

    if (postPath && mode !== "detail") {
      return (
        <Link to={postPath} className={cn("mt-3 block focus-visible:outline-none", className)}>
          {frame}
        </Link>
      );
    }

    return <div className={cn("mt-3", className)}>{frame}</div>;
  }

  if (mode === "detail") {
    return (
      <PostMediaAlbum
        media={media}
        compact={false}
        detail
        postActions={postActions}
        className={cn("mt-3", className)}
      />
    );
  }

  return (
    <div className={cn("post-media-gallery mt-3", className)}>
      <PostMediaGridPreview imageUrls={imageUrls} compact={compact} postPath={postPath} />
    </div>
  );
}
