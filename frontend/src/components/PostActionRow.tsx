import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Reply, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZE = {
  md: { btn: "h-8 w-8", icon: "h-4 w-4" },
  sm: { btn: "h-6 w-6", icon: "h-3.5 w-3.5" },
} as const;

type PostActionRowProps = {
  children: ReactNode;
  size?: keyof typeof SIZE;
  className?: string;
  /** Feed: navigate to post comments. */
  commentTo?: string;
  /** Detail: scroll / focus comments. */
  onCommentClick?: () => void;
  /** Friends' original posts only — omit to hide Share. */
  onShare?: () => void;
  shareBusy?: boolean;
};

export function PostActionRow({
  children,
  size = "md",
  className,
  commentTo,
  onCommentClick,
  onShare,
  shareBusy = false,
}: PostActionRowProps) {
  const s = SIZE[size];
  const commentIcon = <MessageSquare className={s.icon} aria-hidden="true" />;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
      {commentTo ? (
        <Button asChild variant="ghost" size="icon" className={s.btn}>
          <Link to={commentTo} aria-label="Comments">
            {commentIcon}
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={s.btn}
          aria-label="Comments"
          onClick={onCommentClick}
        >
          {commentIcon}
        </Button>
      )}
      {onShare ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={s.btn}
          aria-label="Share"
          disabled={shareBusy}
          onClick={onShare}
        >
          <Share2 className={s.icon} aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

type ReplyActionButtonProps = {
  onClick: () => void;
  className?: string;
};

export function ReplyActionButton({ onClick, className }: ReplyActionButtonProps) {
  const s = SIZE.sm;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(s.btn, className)}
      aria-label="Reply"
      onClick={onClick}
    >
      <Reply className={s.icon} aria-hidden="true" />
    </Button>
  );
}
