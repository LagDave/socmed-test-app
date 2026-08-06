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
    action: "h-9 min-w-9 gap-1.5 px-2.5",
    icon: "h-[1.125rem] w-[1.125rem]",
    label: "text-[11px] -bottom-4",
    gap: "gap-2",
  },
  sm: {
    btn: "h-6 w-6",
    action: "h-6 min-w-6 gap-1 px-1.5",
    icon: "h-3.5 w-3.5",
    label: "text-[10px] -bottom-3.5",
    gap: "gap-1.5",
  },
} as const;

const MAX_DISPLAY_COUNT = 99;

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
  shareCount?: number;
  onCommentClick?: () => void;
  onShare?: () => void;
  shareBusy?: boolean;
  showShare?: boolean;
  shareDisabled?: boolean;
};

function ActionCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="text-xs font-semibold tabular-nums text-muted-foreground" aria-hidden="true">
      {count > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : count}
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
  count?: number;
};

function PostActionIcon({
  label,
  size,
  busy = false,
  disabled = false,
  onClick,
  to,
  children,
  count = 0,
}: PostActionIconProps) {
  const s = SIZE[size];
  const shellClass =
    "inline-flex items-center rounded-full border border-border/80 bg-background p-px transition-shadow hover:shadow-sm";

  const innerClass = cn(
    "group relative inline-flex items-center justify-center rounded-full transition-colors hover:bg-accent",
    s.action,
    (busy || disabled) && "pointer-events-none opacity-70"
  );

  const iconContent = busy ? (
    <Loader2 className={cn(s.icon, "animate-spin text-muted-foreground")} aria-hidden="true" />
  ) : (
    children
  );

  const tooltip = (
    <span
      className={cn(
        "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-muted-foreground",
        s.label,
        "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      )}
    >
      {label}
    </span>
  );
  const accessibleLabel = count > 0 ? `${label}, ${count}` : label;

  if (to) {
    return (
      <div className={shellClass}>
        <Link to={to} aria-label={accessibleLabel} className={innerClass}>
          {iconContent}
          <ActionCount count={count} />
          {tooltip}
        </Link>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <button
        type="button"
        aria-label={accessibleLabel}
        disabled={busy || disabled}
        className={innerClass}
        onClick={onClick}
      >
        {iconContent}
        <ActionCount count={count} />
        {tooltip}
      </button>
    </div>
  );
}

export function PostActionRow({
  children,
  size = "md",
  className,
  commentTo,
  commentCount = 0,
  shareCount = 0,
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
        label="Comment"
        size={size}
        to={commentTo}
        onClick={onCommentClick}
        count={commentCount}
      >
        <MessageSquare className={s.icon} aria-hidden="true" />
      </PostActionIcon>
    ) : null;

  const shareControl =
    onShare || showShare ? (
      <PostActionIcon
        label="Share"
        size={size}
        busy={shareBusy}
        disabled={shareDisabled || !onShare}
        onClick={onShare}
        count={shareCount}
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
