import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { cn } from "@/lib/utils";

const MAX_BODY = 2000;
const WARN_AT = 1900;

type CommentComposerProps = {
  user: PublicUser;
  placeholder?: string;
  submitLabel?: string;
  busy?: boolean;
  replyingTo?: { displayName: string } | null;
  onCancel?: () => void;
  onSubmit: (input: { text: string; file: File | null }) => Promise<void>;
  autoFocus?: boolean;
  compact?: boolean;
};

export function CommentComposer({
  user,
  placeholder = "Write a comment…",
  submitLabel = "Comment",
  busy = false,
  replyingTo = null,
  onCancel,
  onSubmit,
  autoFocus = false,
  compact = false,
}: CommentComposerProps) {
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(Boolean(replyingTo || autoFocus));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const profilePath = `/u/${user.username || "me"}`;

  const trimmed = body.trim();
  const canSubmit = Boolean(trimmed || imageFile);
  const nearLimit = body.length >= WARN_AT;
  const disabled = busy || submitting;

  useEffect(() => {
    if (!autoFocus && !replyingTo) return;
    textareaRef.current?.focus();
  }, [autoFocus, replyingTo]);

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function resetForm() {
    setBody("");
    clearImage();
    if (!replyingTo) setExpanded(false);
  }

  function onPickImage(file: File | null) {
    clearImage();
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExpanded(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled || !canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({ text: trimmed, file: imageFile });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "comment-composer overflow-hidden rounded-xl border border-border/70 bg-canvas/40 transition-shadow duration-200",
        expanded && "comment-composer-expanded ring-1 ring-border/60",
        compact && "bg-canvas/25"
      )}
    >
      {replyingTo && (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 text-sm text-muted-foreground">
          <span>
            Replying to{" "}
            <span className="font-medium text-foreground">{replyingTo.displayName}</span>
          </span>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 px-3 py-3">
        <Link to={profilePath} className="shrink-0 pt-0.5" aria-label="Your profile">
          <ProfileAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
        </Link>

        <div className="min-w-0 flex-1 space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
            onFocus={() => setExpanded(true)}
            onKeyDown={submitOnEnter}
            rows={expanded ? 3 : 1}
            maxLength={MAX_BODY}
            className={cn(
              "min-w-0 resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-6 shadow-none focus-visible:ring-0",
              expanded ? "min-h-[4rem]" : "min-h-9"
            )}
          />

          {imagePreview && (
            <div className="relative inline-block max-w-full">
              <img
                src={imagePreview}
                alt="Selected attachment preview"
                className="max-h-44 rounded-lg border border-border object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 rounded-full shadow-md"
                aria-label="Remove photo"
                onClick={clearImage}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {expanded && (
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-muted-foreground"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  Photo
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {nearLimit && (
                  <span className="text-xs text-muted-foreground">{MAX_BODY - body.length} left</span>
                )}
                <Button type="submit" size="sm" disabled={disabled || !canSubmit}>
                  {submitting ? "Sending…" : submitLabel}
                </Button>
              </div>
            </div>
          )}
        </div>

        {!expanded && (
          <Button
            type="submit"
            size="sm"
            className="shrink-0 self-center"
            disabled={disabled || !canSubmit}
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
