import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";
import type { PostView } from "@/api/types";

type ShareAttributionProps = {
  viewerId: string;
  post: PostView;
  className?: string;
};

export function ShareAttribution({ viewerId, post, className }: ShareAttributionProps) {
  if (!post.sharedFromPostId) return null;

  const sharerIsViewer = viewerId === post.author.id;
  const sharerPath = `/u/${post.author.username || post.author.id}`;
  const original = post.sharedFrom;
  const originalName = original?.author.displayName ?? "someone";
  const originalPath = original
    ? `/u/${original.author.username || original.author.id}`
    : null;

  return (
    <p className={className ?? "share-attribution"}>
      <Share2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 leading-snug">
        {sharerIsViewer ? (
          <>You shared </>
        ) : (
          <>
            <Link to={sharerPath} className="font-semibold underline-offset-2 hover:underline">
              {post.author.displayName}
            </Link>
            {" shared "}
          </>
        )}
        {originalPath ? (
          <Link to={originalPath} className="font-semibold underline-offset-2 hover:underline">
            {originalName}
          </Link>
        ) : (
          <span className="font-semibold">{originalName}</span>
        )}
        {"'s post"}
      </span>
    </p>
  );
}
