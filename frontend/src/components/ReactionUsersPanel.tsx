import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { ReactionEmoji, ReactionUserView } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ReactionIcon } from "@/components/ReactionIcon";
import { reactionOption } from "@/lib/reactionOptions";
import { cn } from "@/lib/utils";

type ReactionUsersPanelProps = {
  postImageId: string;
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  className?: string;
};

export function ReactionUsersPanel({
  postImageId,
  open,
  onClose,
  anchorRef,
  className,
}: ReactionUsersPanelProps) {
  const [reactors, setReactors] = useState<ReactionUserView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    void api
      .get<{ reactors: ReactionUserView[] }>(`/api/post-images/${postImageId}/reactions/users`)
      .then((data) => setReactors(data.reactors))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, postImageId]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const grouped = reactors.reduce<Partial<Record<ReactionEmoji, ReactionUserView[]>>>(
    (acc, row) => {
      const bucket = acc[row.emoji] ?? [];
      bucket.push(row);
      acc[row.emoji] = bucket;
      return acc;
    },
    {}
  );

  return (
    <div
      ref={panelRef}
      className={cn(
        "reaction-users-panel absolute bottom-full right-0 z-30 mb-2 w-72 overflow-hidden rounded-xl border border-border/80 bg-card shadow-lg",
        className
      )}
      role="dialog"
      aria-label="People who reacted"
    >
      <div className="border-b border-border/60 bg-muted/20 px-3 py-2.5">
        <p className="text-sm font-semibold text-foreground">Reactions</p>
      </div>
      <div className="max-h-64 overflow-y-auto overscroll-y-contain p-2">
        {loading ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="px-2 py-3 text-sm text-destructive">{error}</p>
        ) : reactors.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No reactions yet.</p>
        ) : (
          (Object.keys(grouped) as ReactionEmoji[]).map((emoji) => (
            <section key={emoji} className="mb-2 last:mb-0">
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground">
                <ReactionIcon emoji={emoji} className="text-base" />
                {reactionOption(emoji).label}
              </div>
              <ul className="space-y-0.5">
                {(grouped[emoji] ?? []).map(({ user }) => (
                  <li key={`${emoji}-${user.id}`}>
                    <Link
                      to={`/u/${user.username || user.id}`}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
                      onClick={onClose}
                    >
                      <ProfileAvatar
                        displayName={user.displayName}
                        avatarUrl={user.avatarUrl}
                        size="sm"
                      />
                      <span className="min-w-0 truncate text-sm font-medium">{user.displayName}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
