import { Link } from "react-router-dom";
import type { PostView } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { postImageUrls } from "@/lib/postImages";

type SharedPostEmbedProps = {
  sharedFrom: PostView | null;
  className?: string;
};

export function SharedPostEmbed({ sharedFrom, className }: SharedPostEmbedProps) {
  if (!sharedFrom) {
    return (
      <div className={className ?? "mt-2 rounded-lg border border-border/70 bg-canvas/50 px-3 py-3"}>
        <p className="text-sm text-muted-foreground">Original post unavailable.</p>
      </div>
    );
  }

  const images = postImageUrls(sharedFrom);

  return (
    <div className={className ?? "mt-2 rounded-lg border border-border/70 bg-canvas/50 px-3 py-3"}>
      <div className="flex items-start gap-2.5">
        <Link
          to={`/u/${sharedFrom.author.username || sharedFrom.author.id}`}
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
            to={`/u/${sharedFrom.author.username || sharedFrom.author.id}`}
          >
            {sharedFrom.author.displayName}
            {sharedFrom.author.username ? (
              <span className="font-normal text-muted-foreground">{` @${sharedFrom.author.username}`}</span>
            ) : null}
          </Link>
          {sharedFrom.body ? (
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed">{sharedFrom.body}</p>
          ) : null}
          {images.length > 0 && (
            <div className="mt-2.5 grid gap-1.5">
              {images.map((url, index) => (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt=""
                  className="max-h-96 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
