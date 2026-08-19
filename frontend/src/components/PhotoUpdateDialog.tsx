import { useEffect, useId, useRef } from "react";
import { ImageIcon, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PhotoUpdateDialogProps = {
  open: boolean;
  kind: "avatar" | "cover";
  previewUrl: string;
  caption: string;
  error?: string | null;
  busy?: boolean;
  onCaptionChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PhotoUpdateDialog({
  open,
  kind,
  previewUrl,
  caption,
  error = null,
  busy = false,
  onCaptionChange,
  onConfirm,
  onCancel,
}: PhotoUpdateDialogProps) {
  const titleId = useId();
  const captionId = useId();
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const isAvatar = kind === "avatar";
  const title = isAvatar ? "New profile picture" : "New cover photo";
  const subtitle = isAvatar
    ? "Add an optional caption for your timeline post."
    : "Share a caption with your cover photo update.";

  useEffect(() => {
    if (!open) return;
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
        className={cn(
          "modal-panel animate-modal-enter relative z-10 w-full overflow-hidden",
          isAvatar ? "max-w-md" : "max-w-lg"
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            isAvatar
              ? "bg-gradient-to-b from-muted/80 to-card px-6 pb-8 pt-7"
              : "bg-muted/40"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm ring-1 ring-border/60">
              {isAvatar ? <UserRound className="size-4" aria-hidden="true" /> : <ImageIcon className="size-4" aria-hidden="true" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <div className={cn("mt-6", isAvatar ? "flex justify-center" : "px-6 pb-6")}>
            {isAvatar ? (
              <div className="relative">
                <div
                  className="absolute -inset-3 rounded-full bg-gradient-to-br from-foreground/8 via-transparent to-foreground/4 blur-sm"
                  aria-hidden="true"
                />
                <img
                  src={previewUrl}
                  alt=""
                  className="relative size-36 rounded-full object-cover shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-4 ring-card sm:size-40"
                />
              </div>
            ) : (
              <div className="user-media-stage overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-border/60">
                <img src={previewUrl} alt="" className="user-media-thumbnail h-44 sm:h-52" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor={captionId} className="profile-section-label mb-0">
                Caption
              </label>
              <span className="text-xs tabular-nums text-muted-foreground">{caption.length}/500</span>
            </div>
            <Textarea
              ref={captionRef}
              id={captionId}
              className="min-h-[5.5rem] resize-none rounded-xl border-border/80 bg-background px-4 py-3 text-[15px] leading-relaxed shadow-inner"
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder={
                isAvatar
                  ? "Feeling cute, might delete later…"
                  : "New vibe, same me."
              }
              disabled={busy}
              maxLength={500}
            />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
              Leave blank to post the default update message.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-border/80 bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
            <Button type="button" variant="outline" disabled={busy} onClick={() => onCancelRef.current()}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={onConfirm}>
              {busy ? "Posting…" : "Post update"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
