import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageSquare, Reply, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE = {
  md: {
    btn: "h-9 w-9",
    icon: "h-[1.125rem] w-[1.125rem]",
    badge: "min-w-[1.125rem] h-[1.125rem] text-[10px]",
    label: "text-[11px] -bottom-4",
    gap: "gap-2",
  },
  sm: {
    btn: "h-6 w-6",
    icon: "h-3.5 w-3.5",
    badge: "min-w-4 h-4 text-[9px]",
    label: "text-[10px] -bottom-3.5",
    gap: "gap-1.5",
  },
} as const;

type ReactionBarChildProps = {
  actions?: ReactNode;
  className?: string;
};

type PostActionRowProps = {
  children: ReactNode;
  size?: keyof typeof SIZE;
  className?: string;
  showLabels?: boolean;
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

type PostActionIconProps = {
  label: string;
  size: keyof typeof SIZE;
  busy?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  to?: string;
  children: ReactNode;
  showLabels?: boolean;
  badge?: number;
};

function PostActionIcon({
  label,
  size,
  busy = false,
  disabled = false,
  onClick,
  to,
  children,
  showLabels = false,
  badge = 0,
}: PostActionIconProps) {
  const s = SIZE[size];
  const shellClass =
    "inline-flex items-center rounded-full border border-border/80 bg-background p-px transition-shadow hover:shadow-sm";

  const innerClass = cn(
    "group relative inline-flex items-center justify-center rounded-full transition-colors hover:bg-accent",
    showLabels ? "h-9 w-9 md:h-9 md:w-auto md:gap-2 md:px-3.5" : s.btn,
    (busy || disabled) && "pointer-events-none opacity-70"
  );

  const iconContent = busy ? (
    <Loader2 className={cn(s.icon, "animate-spin text-muted-foreground")} aria-hidden="true" />
  ) : (
    children
  );

  const labelContent = showLabels ? (
    <span className="hidden text-sm font-medium text-muted-foreground md:inline">{label}</span>
  ) : (
    <span
      className={cn(
        "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-muted-foreground",
        s.label,
        "opacity-0 transition-opacity group-hover:opacity-100"
      )}
    >
      {label}
    </span>
  );

  if (to) {
    return (
      <div className={shellClass}>
        <Link to={to} aria-label={label} className={innerClass}>
          {iconContent}
          <CommentCountBadge count={badge} className={s.badge} />
          {labelContent}
        </Link>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <button
        type="button"
        aria-label={label}
        disabled={busy || disabled}
        className={innerClass}
        onClick={onClick}
      >
        {iconContent}
        <CommentCountBadge count={badge} className={s.badge} />
        {labelContent}
      </button>
    </div>
  );
}

export function PostActionRow({
  children,
  size = "md",
  className,
  showLabels = false,
  commentTo,
  commentCount = 0,
  onCommentClick,
  onShare,
  shareBusy = false,
  showShare = false,
  shareDisabled = false,
}: PostActionRowProps) {
  const s = SIZE[size];

  const commentControl =
    commentTo || onCommentClick ? (
      <PostActionIcon
        label={showLabels ? "Comment" : "Comments"}
        size={size}
        showLabels={showLabels}
        to={commentTo}
        onClick={onCommentClick}
        badge={commentCount}
      >
        <MessageSquare className={s.icon} aria-hidden="true" />
      </PostActionIcon>
    ) : null;

  const shareControl =
    onShare || showShare ? (
      <PostActionIcon
        label="Share"
        size={size}
        showLabels={showLabels}
        busy={shareBusy}
        disabled={shareDisabled || !onShare}
        onClick={onShare}
      >
        <Share2 className={s.icon} aria-hidden="true" />
      </PostActionIcon>
    ) : null;

  const leftActions = (
    <div className={cn("inline-flex flex-wrap items-center", s.gap)}>
      {commentControl}
      {shareControl}
    </div>
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
    <div className="inline-flex items-center rounded-full border border-border/80 bg-background p-px">
      <button
        type="button"
        aria-label="Reply"
        className={cn(
          "group relative inline-flex items-center justify-center rounded-full transition-colors hover:bg-accent",
          s.btn,
          className
        )}
        onClick={onClick}
      >
        <Reply className={s.icon} aria-hidden="true" />
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-muted-foreground",
            s.label,
            "opacity-0 transition-opacity group-hover:opacity-100"
          )}
        >
          Reply
        </span>
      </button>
    </div>
  );
}
