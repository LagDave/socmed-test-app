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
    label: "text-[11px] -bottom-4",
    gap: "gap-2",
  },
  sm: {
    btn: "h-6 w-6",
    icon: "h-3.5 w-3.5",
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
  /** Feed: navigate to post comments. */
  commentTo?: string;
  /** Detail: scroll / focus comments. */
  onCommentClick?: () => void;
  /** Friends' original posts only — omit to hide Share. */
  onShare?: () => void;
  shareBusy?: boolean;
};

type PostActionIconProps = {
  label: string;
  size: keyof typeof SIZE;
  busy?: boolean;
  onClick?: () => void;
  to?: string;
  children: ReactNode;
};

function PostActionIcon({ label, size, busy = false, onClick, to, children }: PostActionIconProps) {
  const s = SIZE[size];
  const shellClass =
    "inline-flex items-center rounded-full border border-border/80 bg-background p-px transition-shadow hover:shadow-sm";

  const innerClass = cn(
    "group relative inline-flex items-center justify-center rounded-full transition-colors hover:bg-accent",
    s.btn,
    busy && "pointer-events-none opacity-70"
  );

  const iconContent = busy ? (
    <Loader2 className={cn(s.icon, "animate-spin text-muted-foreground")} aria-hidden="true" />
  ) : (
    children
  );

  const hoverLabel = (
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
          {hoverLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <button
        type="button"
        aria-label={label}
        disabled={busy}
        className={innerClass}
        onClick={onClick}
      >
        {iconContent}
        {hoverLabel}
      </button>
    </div>
  );
}

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

  const commentControl =
    commentTo || onCommentClick ? (
      <PostActionIcon
        label="Comments"
        size={size}
        to={commentTo}
        onClick={onCommentClick}
      >
        <MessageSquare className={s.icon} aria-hidden="true" />
      </PostActionIcon>
    ) : null;

  const shareControl = onShare ? (
    <PostActionIcon label="Share" size={size} busy={shareBusy} onClick={onShare}>
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
