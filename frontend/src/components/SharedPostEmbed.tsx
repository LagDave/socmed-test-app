import { Link } from "react-router-dom";
import type { PostView } from "@/api/types";
import { PostMediaGallery } from "@/components/PostMediaGallery";
import { FriendPresenceAvatar } from "@/components/FriendPresenceAvatar";
import { postMediaImages } from "@/lib/postMedia";
import { cn } from "@/lib/utils";

type SharePostPreviewProps = {
  post: PostView;
  className?: string;
};

/** Read-only preview of a post inside the share composer. */
export function SharePostPreview({ post, className }: SharePostPreviewProps) {
  const media = postMediaImages(post);

  return (
    <div className={cn("shared-post-embed shared-post-embed--preview", className)} aria-hidden="true">
      <div className="flex items-start gap-2.5">
        <FriendPresenceAvatar user={post.author} />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">
            {post.author.displayName}
          </p>
          {post.body ? (
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {post.body}
            </p>
          ) : null}
          {media.length > 1 ? (
            <PostMediaGallery media={media} mode="compact" className="mt-2.5" />
          ) : media.length === 1 ? (
            <div className="shared-post-embed-media user-media-stage mt-2.5 overflow-hidden rounded-lg">
              <img src={media[0].url} alt="" className="user-media-thumbnail max-h-48 w-full sm:max-h-56" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type SharedPostEmbedProps = {
  sharedFrom: PostView | null;
  className?: string;
};

export function SharedPostEmbed({ sharedFrom, className }: SharedPostEmbedProps) {
  if (!sharedFrom) {
    return (
      <div className={cn("shared-post-embed shared-post-embed--missing", className)}>
        <p className="text-sm text-muted-foreground">Original post unavailable.</p>
      </div>
    );
  }

  const profilePath = `/u/${sharedFrom.author.username || sharedFrom.author.id}`;
  const postPath = `/posts/${sharedFrom.id}`;
  const media = postMediaImages(sharedFrom);
  const originalMedia = media.length > 0 ? (
    <PostMediaGallery media={media} postPath={postPath} mode="feed" className="mt-2.5" />
  ) : null;

  return (
    <div className={cn("shared-post-embed", className)}>
      <div className="flex items-start gap-2.5">
        <Link
          to={profilePath}
          className="shrink-0"
          aria-label={`${sharedFrom.author.displayName}'s profile`}
        >
          <FriendPresenceAvatar user={sharedFrom.author} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            className="font-medium leading-snug underline-offset-2 hover:underline"
            to={profilePath}
          >
            {sharedFrom.author.displayName}
          </Link>
          {sharedFrom.body ? (
            <Link
              to={postPath}
              className="group/embed mt-1 block rounded-md outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90 transition-colors group-hover/embed:text-foreground">
                {sharedFrom.body}
              </p>
            </Link>
          ) : null}
        </div>
      </div>
      {originalMedia ? <div className="post-media-stage user-media-stage">{originalMedia}</div> : null}
    </div>
  );
}
