import { useEffect, useId, useRef, useState } from "react";
import { Share2, Sparkles, X } from "lucide-react";
import type { PostView, PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { SharePostPreview } from "@/components/SharedPostEmbed";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_CAPTION = 5000;
const WARN_AT = 4800;

type SharePostDialogProps = {
  open: boolean;
  post: PostView | null;
  user: PublicUser;
  busy?: boolean;
  error?: string | null;
  onConfirm: (caption: string) => void;
  onCancel: () => void;
};

export function SharePostDialog({
  open,
  post,
  user,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: SharePostDialogProps) {
  const titleId = useId();
  const captionId = useId();
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const onCancelRef = useRef(onCancel);
  const confirmLockRef = useRef(false);
  const [caption, setCaption] = useState("");

  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) {
      setCaption("");
      confirmLockRef.current = false;
      return;
    }
    captionRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancelRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, busy]);

  useEffect(() => {
    if (!open || !busy) confirmLockRef.current = false;
  }, [open, busy]);

  if (!open || !post) return null;

  const nearLimit = caption.length >= WARN_AT;
  const hasCaption = caption.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Dismiss"
        className="modal-backdrop absolute inset-0"
        disabled={busy}
        onClick={() => onCancelRef.current()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="share-dialog-panel animate-modal-enter relative z-10 flex max-h-[min(92vh,720px)] w-full flex-col overflow-hidden sm:max-w-[30rem]"
      >
        <div className="share-dialog-header">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="share-dialog-header-icon" aria-hidden="true">
              <Share2 className="size-4" />
            </span>
            <h2 id={titleId} className="truncate text-[1.0625rem] font-semibold tracking-tight">
              Share post
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="share-dialog-close"
            aria-label="Close"
            disabled={busy}
            onClick={() => onCancelRef.current()}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="share-dialog-body">
          <div className="share-dialog-composer">
            <ProfileAvatar
              displayName={user.displayName}
              avatarUrl={user.avatarUrl}
              size="sm"
              className="mt-0.5 shrink-0 ring-2 ring-background"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">
                {user.displayName}
              </p>
              <label htmlFor={captionId} className="sr-only">
                Say something about this post
              </label>
              <Textarea
                ref={captionRef}
                id={captionId}
                className="share-dialog-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption…"
                disabled={busy}
                maxLength={MAX_CAPTION}
              />
              {!hasCaption && (
                <p className="share-dialog-hint">
                  <Sparkles className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
                  Add a caption or share as-is
                </p>
              )}
            </div>
          </div>

          <div className="share-dialog-preview-wrap">
            <p className="share-dialog-preview-label">Original post</p>
            <SharePostPreview post={post} />
          </div>

          {error && (
            <p className="share-dialog-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="share-dialog-footer">
          <p className="share-dialog-footer-meta">
            {nearLimit
              ? `${MAX_CAPTION - caption.length} characters left`
              : "Optional caption · posts to your friends feed"}
          </p>
          <div className="share-dialog-footer-actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="share-dialog-btn-cancel"
              disabled={busy}
              onClick={() => onCancelRef.current()}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="share-dialog-btn-submit"
              disabled={busy}
              onClick={() => {
                if (busy || confirmLockRef.current) return;
                confirmLockRef.current = true;
                onConfirm(caption.trim());
              }}
            >
              {busy ? "Sharing…" : "Share post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
