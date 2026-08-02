import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_POST_IMAGES } from "@/lib/postMedia";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { cn } from "@/lib/utils";

const MAX_BODY = 5000;
const WARN_AT = 4800;

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type FeedComposerProps = {
  user: PublicUser;
  onPosted: () => void;
  onError: (message: string) => void;
};

function nextImageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FeedComposer({ user, onPosted, onError }: FeedComposerProps) {
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [pickError, setPickError] = useState("");
  const busyRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const profilePath = `/u/${user.username || "me"}`;

  const trimmed = body.trim();
  const canPost = Boolean(trimmed || selectedImages.length > 0);
  const nearLimit = body.length >= WARN_AT;
  const atImageCap = selectedImages.length >= MAX_POST_IMAGES;

  function clearImages() {
    selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setSelectedImages([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function collapseIfEmpty() {
    if (!trimmed && selectedImages.length === 0) setExpanded(false);
  }

  function onPickImages(fileList: FileList | null) {
    if (!fileList?.length) return;
    setPickError("");
    const incoming = Array.from(fileList);
    const remaining = MAX_POST_IMAGES - selectedImages.length;
    if (remaining <= 0) {
      setPickError(`Maximum ${MAX_POST_IMAGES} photos per post.`);
      return;
    }

    const accepted = incoming.slice(0, remaining);
    if (incoming.length > remaining) {
      setPickError(`Only ${remaining} more photo${remaining === 1 ? "" : "s"} can be added (max ${MAX_POST_IMAGES}).`);
    }

    setSelectedImages((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: nextImageId(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    setExpanded(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(id: string) {
    setSelectedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
    setPickError("");
  }

  function moveImage(id: string, direction: -1 | 1) {
    setSelectedImages((prev) => {
      const index = prev.findIndex((img) => img.id === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current || !canPost) return;
    busyRef.current = true;
    setBusy(true);
    onError("");
    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const uploads = await Promise.all(
          selectedImages.map((img) => api.upload<{ url: string }>("/api/uploads", img.file))
        );
        imageUrls = uploads.map((up) => up.url);
      }
      await api.post("/api/posts", {
        body: trimmed || " ",
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
      });
      setBody("");
      clearImages();
      setPickError("");
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

          {pickError && <p className="text-xs text-destructive">{pickError}</p>}

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
                multiple
                className="sr-only"
                onChange={(e) => onPickImages(e.target.files)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                disabled={atImageCap}
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

      {selectedImages.length > 0 && (
        <section
          className="feed-composer-photos border-t border-border/60 px-4 pb-3 pt-3"
          aria-label="Selected photos"
        >
          <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/15">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/25 px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-foreground/80">Photos</p>
              <p className="text-xs text-muted-foreground">
                {selectedImages.length} of {MAX_POST_IMAGES}
              </p>
            </div>
            <ul className="feed-composer-photos-list max-h-72 divide-y divide-border/50 overflow-y-auto overscroll-y-contain">
              {selectedImages.map((img, index) => (
                <li key={img.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold ring-1 ring-border/70"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/60 sm:h-[4.5rem] sm:w-[4.5rem]">
                    <img
                      src={img.previewUrl}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground/90">
                      {img.file.name || `Photo ${index + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {index === 0 ? "Cover photo" : `Slide ${index + 1}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {selectedImages.length > 1 && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          aria-label={`Move photo ${index + 1} up`}
                          disabled={index === 0}
                          onClick={() => moveImage(img.id, -1)}
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          aria-label={`Move photo ${index + 1} down`}
                          disabled={index === selectedImages.length - 1}
                          onClick={() => moveImage(img.id, 1)}
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() => removeImage(img.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </form>
  );
}
