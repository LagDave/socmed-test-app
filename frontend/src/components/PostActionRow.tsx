import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Reply, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZE = {
  md: { btn: "h-9 w-9", icon: "h-5 w-5", badge: "min-w-[1.125rem] h-[1.125rem] text-[10px]" },
  sm: { btn: "h-6 w-6", icon: "h-3.5 w-3.5", badge: "min-w-4 h-4 text-[9px]" },
} as const;

type ReactionBarChildProps = {
  actions?: ReactNode;
  className?: string;
};

type PostActionRowProps = {
  children: ReactNode;
  size?: keyof typeof SIZE;
  className?: string;
  commentTo?: string;
  commentCount?: number;
  onCommentClick?: () => void;
  onShare?: () => void;
  shareBusy?: boolean;
  showShare?: boolean;
  shareDisabled?: boolean;
};

function CommentCountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "comment-count-badge absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-primary px-1 font-semibold tabular-nums leading-none text-primary-foreground ring-2 ring-background",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function PostActionRow({
  children,
  size = "md",
  className,
  commentTo,
  commentCount = 0,
  onCommentClick,
  onShare,
  shareBusy = false,
  showShare = false,
  shareDisabled = false,
}: PostActionRowProps) {
  const s = SIZE[size];
  const commentLabel =
    commentCount > 0
      ? `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`
      : "Comments";
  const commentIcon = <MessageSquare className={s.icon} aria-hidden="true" />;

  const commentControl = commentTo ? (
    <Button asChild variant="ghost" size="icon" className={cn(s.btn, "relative")}>
      <Link to={commentTo} aria-label={commentLabel}>
        {commentIcon}
        <CommentCountBadge count={commentCount} className={s.badge} />
      </Link>
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(s.btn, "relative")}
      aria-label={commentLabel}
      onClick={onCommentClick}
    >
      {commentIcon}
      <CommentCountBadge count={commentCount} className={s.badge} />
    </Button>
  );

  const shareControl =
    onShare || showShare ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={s.btn}
        aria-label={shareDisabled ? "Share unavailable" : "Share"}
        disabled={shareBusy || shareDisabled || !onShare}
        onClick={onShare}
      >
        <Share2 className={s.icon} aria-hidden="true" />
      </Button>
    ) : null;

  const leftActions = (
    <>
      {commentControl}
      {shareControl}
    </>
  );

  return (
    <div className={cn("w-full", className)}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const el = child as ReactElement<ReactionBarChildProps>;
        return cloneElement(el, {
          actions: leftActions,
          className: cn(el.props.className, "w-full"),
        });
      })}
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
