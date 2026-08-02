import { Link } from "react-router-dom";
import type { PostView } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { cn } from "@/lib/utils";

type SharePostPreviewProps = {
  post: PostView;
  className?: string;
};

/** Read-only preview of a post inside the share composer. */
export function SharePostPreview({ post, className }: SharePostPreviewProps) {
  return (
    <div className={cn("shared-post-embed shared-post-embed--preview", className)} aria-hidden="true">
      <div className="flex items-start gap-2.5">
        <ProfileAvatar
          displayName={post.author.displayName}
          avatarUrl={post.author.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">
            {post.author.displayName}
            {post.author.username ? (
              <span className="font-normal text-muted-foreground">{` @${post.author.username}`}</span>
            ) : null}
          </p>
          {post.body ? (
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {post.body}
            </p>
          ) : null}
          {post.imageUrl ? (
            <div className="shared-post-embed-media mt-2.5 overflow-hidden rounded-lg">
              <img src={post.imageUrl} alt="" className="max-h-48 w-full object-cover sm:max-h-56" />
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

  return (
    <div className={cn("shared-post-embed", className)}>
      <div className="flex items-start gap-2.5">
        <Link
          to={profilePath}
          className="shrink-0"
          aria-label={`${sharedFrom.author.displayName}'s profile`}
        >
          <ProfileAvatar
            displayName={sharedFrom.author.displayName}
            avatarUrl={sharedFrom.author.avatarUrl}
            size="sm"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            className="font-medium leading-snug underline-offset-2 hover:underline"
            to={profilePath}
          >
            {sharedFrom.author.displayName}
            {sharedFrom.author.username ? (
              <span className="font-normal text-muted-foreground">{` @${sharedFrom.author.username}`}</span>
            ) : null}
          </Link>
          <Link to={postPath} className="group/embed mt-1 block rounded-md outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
            {sharedFrom.body ? (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90 transition-colors group-hover/embed:text-foreground">
                {sharedFrom.body}
              </p>
            ) : null}
            {sharedFrom.imageUrl ? (
              <div className="shared-post-embed-media mt-2.5 overflow-hidden rounded-lg">
                <img
                  src={sharedFrom.imageUrl}
                  alt=""
                  className="max-h-96 w-full object-cover transition-transform duration-300 group-hover/embed:scale-[1.01]"
                />
              </div>
            ) : null}
          </Link>
        </div>
      </div>
    </div>
  );
}
