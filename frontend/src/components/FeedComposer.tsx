import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { cn } from "@/lib/utils";

const MAX_BODY = 5000;
const WARN_AT = 4800;

type FeedComposerProps = {
  user: PublicUser;
  onPosted: () => void;
  onError: (message: string) => void;
};

export function FeedComposer({ user, onPosted, onError }: FeedComposerProps) {
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const busyRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const profilePath = `/u/${user.username || "me"}`;

  const trimmed = body.trim();
  const canPost = Boolean(trimmed || imageFile);
  const nearLimit = body.length >= WARN_AT;

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function collapseIfEmpty() {
    if (!trimmed && !imageFile) setExpanded(false);
  }

  function onPickImage(file: File | null) {
    clearImage();
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExpanded(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current || !canPost) return;
    busyRef.current = true;
    setBusy(true);
    onError("");
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const up = await api.upload<{ url: string }>("/api/uploads", imageFile);
        imageUrl = up.url;
      }
      await api.post("/api/posts", { body: trimmed || " ", imageUrl });
      setBody("");
      clearImage();
      setExpanded(false);
      onPosted();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "feed-card feed-composer overflow-hidden transition-shadow duration-200",
        expanded && "feed-composer-expanded ring-1 ring-border/80"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Link to={profilePath} className="shrink-0 pt-0.5" aria-label="Your profile">
          <ProfileAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
        </Link>

        <div className="min-w-0 flex-1 space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
            onFocus={() => setExpanded(true)}
            onBlur={collapseIfEmpty}
            onKeyDown={submitOnEnter}
            rows={expanded ? 3 : 1}
            maxLength={MAX_BODY}
            className={cn(
              "min-w-0 resize-none border-0 bg-transparent px-0 py-1.5 text-[15px] leading-6 shadow-none focus-visible:ring-0",
              expanded ? "min-h-[4.5rem]" : "min-h-10"
            )}
          />

          {imagePreview && (
            <div className="relative inline-block max-w-full">
              <img
                src={imagePreview}
                alt="Selected attachment preview"
                className="max-h-56 rounded-xl border border-border object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-md"
                aria-label="Remove photo"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div
            className={cn(
              "flex items-center justify-between gap-2 border-t border-border/60 pt-3",
              !expanded && "hidden"
            )}
          >
            <div className="flex items-center gap-1">
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
                className="gap-1.5 text-muted-foreground"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                Photo
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {nearLimit && (
                <span className="text-xs text-muted-foreground">
                  {MAX_BODY - body.length} left
                </span>
              )}
              <Button type="submit" size="sm" disabled={busy || !canPost}>
                {busy ? "Posting…" : "Post"}
              </Button>
            </div>
          </div>
        </div>

        {!expanded && (
          <Button type="submit" size="sm" className="shrink-0 self-center" disabled={busy || !canPost}>
            Post
          </Button>
        )}
      </div>
    </form>
  );
}
