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
  md: { btn: "h-9 w-9", icon: "h-5 w-5" },
  sm: { btn: "h-6 w-6", icon: "h-3.5 w-3.5" },
} as const;

type ReactionBarChildProps = {
  actions?: ReactNode;
  className?: string;
};

type PostActionRowProps = {
  children: ReactNode;
  size?: keyof typeof SIZE;
  className?: string;
  /** Feed + detail: icon + label at md+ breakpoints. */
  showLabels?: boolean;
  /** Feed: navigate to post comments. */
  commentTo?: string;
  /** Detail: scroll / focus comments. */
  onCommentClick?: () => void;
  /** Friends' original posts only — omit to hide Share. */
  onShare?: () => void;
  shareBusy?: boolean;
};

const labeledBtn =
  "md:h-9 md:w-auto md:gap-2 md:rounded-full md:px-3.5 md:text-sm md:font-medium md:text-muted-foreground md:hover:bg-accent md:hover:text-foreground";

export function PostActionRow({
  children,
  size = "md",
  className,
  showLabels = false,
  commentTo,
  onCommentClick,
  onShare,
  shareBusy = false,
}: PostActionRowProps) {
  const s = SIZE[size];
  const commentIcon = <MessageSquare className={s.icon} aria-hidden="true" />;
  const labelClass = showLabels ? labeledBtn : "";

  const commentControl = commentTo ? (
    <Button asChild variant="ghost" size="icon" className={cn(s.btn, labelClass)}>
      <Link to={commentTo} aria-label="Comments">
        {commentIcon}
        {showLabels ? <span className="hidden md:inline">Comment</span> : null}
      </Link>
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(s.btn, labelClass)}
      aria-label="Comments"
      onClick={onCommentClick}
    >
      {commentIcon}
      {showLabels ? <span className="hidden md:inline">Comment</span> : null}
    </Button>
  );

  const shareControl = onShare ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(s.btn, labelClass)}
      aria-label="Share"
      disabled={shareBusy}
      onClick={onShare}
    >
      <Share2 className={s.icon} aria-hidden="true" />
      {showLabels ? <span className="hidden md:inline">Share</span> : null}
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
