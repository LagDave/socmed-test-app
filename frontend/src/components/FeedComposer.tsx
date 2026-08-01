import { useId, useRef, useState, type FocusEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Loader2, X } from "lucide-react";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { cn } from "@/lib/utils";

const MAX_BODY = 5000;
const WARN_AT = 4800;
const MAX_PHOTOS = 10;
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|heic|heif|bmp|svg)$/i;

const textareaClass =
  "min-w-0 flex-1 resize-none border-0 bg-transparent px-0 text-[15px] leading-6 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground";

function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXT_RE.test(file.name);
}

type PendingImage = {
  id: string;
  file: File;
  preview: string;
};

type FeedComposerProps = {
  user: PublicUser;
  onPosted: () => void;
  onError: (message: string) => void;
};

export function FeedComposer({ user, onPosted, onError }: FeedComposerProps) {
  const fileInputId = useId();
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [pickingPhotos, setPickingPhotos] = useState(false);
  const busyRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef(body);
  const imagesRef = useRef(images);
  const profilePath = `/u/${user.username || "me"}`;

  bodyRef.current = body;
  imagesRef.current = images;

  const trimmed = body.trim();
  const canPost = Boolean(trimmed || images.length > 0);
  const nearLimit = body.length >= WARN_AT;
  const atPhotoLimit = images.length >= MAX_PHOTOS;
  const readyToPost = canPost && !busy;
  const photosDisabled = atPhotoLimit || busy;

  function clearImages() {
    for (const img of imagesRef.current) URL.revokeObjectURL(img.preview);
    setImages([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleTextareaBlur(_e: FocusEvent<HTMLTextAreaElement>) {
    // File picker opens with no relatedTarget — defer so we don't collapse mid-pick.
    window.setTimeout(() => {
      const active = document.activeElement;
      if (composerRef.current?.contains(active)) return;
      if (!bodyRef.current.trim() && imagesRef.current.length === 0) {
        setExpanded(false);
      }
    }, 0);
  }

  function onPickImages(fileList: FileList | null) {
    setPickingPhotos(false);
    if (!fileList?.length) return;

    const incoming = Array.from(fileList).filter(isImageFile);
    if (incoming.length === 0) return;

    setImages((prev) => {
      const slotsLeft = MAX_PHOTOS - prev.length;
      if (slotsLeft <= 0) return prev;

      const picked = incoming.slice(0, slotsLeft).map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));

      return picked.length > 0 ? [...prev, ...picked] : prev;
    });
    setExpanded(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== id);
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
      if (images.length > 0) {
        const uploads = await Promise.all(
          images.map((img) => api.upload<{ url: string }>("/api/uploads", img.file))
        );
        imageUrls = uploads.map((up) => up.url);
      }
      await api.post("/api/posts", {
        body: trimmed || " ",
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      setBody("");
      clearImages();
      setExpanded(false);
      onPosted();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const postButton = (
    <Button
      type="submit"
      size="sm"
      className={cn("feed-composer-post-btn", readyToPost && "feed-composer-post-btn-ready")}
      disabled={busy || !canPost}
      aria-busy={busy}
    >
      {busy ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          {expanded ? "Posting…" : "…"}
        </>
      ) : (
        "Post"
      )}
    </Button>
  );

  const photosButtonContent = (
    <>
      {pickingPhotos ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <ImagePlus className="h-4 w-4" aria-hidden="true" />
      )}
      {pickingPhotos
        ? "Opening…"
        : images.length > 0
          ? `Add photos (${images.length}/${MAX_PHOTOS})`
          : "Photos"}
    </>
  );

  const photosButtonClass = cn(
    "feed-composer-photos-btn inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
    images.length > 0 && "feed-composer-photos-btn-active",
    pickingPhotos && "feed-composer-photos-btn-picking",
    photosDisabled && "pointer-events-none opacity-50"
  );

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "feed-card feed-composer overflow-hidden transition-[box-shadow,border-color] duration-200",
        expanded && "feed-composer-expanded",
        readyToPost && "feed-composer-ready",
        images.length > 0 && "feed-composer-has-photos"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Link
          to={profilePath}
          className="shrink-0 pt-0.5 ring-offset-background transition-opacity hover:opacity-90"
          aria-label="Your profile"
        >
          <ProfileAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
        </Link>

        <div ref={composerRef} className="min-w-0 flex-1 space-y-3">
          <div
            className={cn(
              !expanded && "feed-composer-track",
              expanded && "feed-composer-expanded-field space-y-0"
            )}
          >
            <Textarea
              placeholder="What's on your mind?"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
              onFocus={() => setExpanded(true)}
              onBlur={handleTextareaBlur}
              onKeyDown={submitOnEnter}
              rows={expanded ? 3 : 1}
              maxLength={MAX_BODY}
              className={cn(
                textareaClass,
                expanded ? "min-h-[4.5rem] py-0" : undefined
              )}
            />
            {!expanded && postButton}
          </div>

          {expanded && images.length > 0 && (
            <div className="feed-composer-previews space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {images.length === 1 ? "1 photo attached" : `${images.length} photos attached`}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="feed-composer-preview-tile relative aspect-square overflow-hidden rounded-xl border border-border/70"
                  >
                    <img
                      src={img.preview}
                      alt="Selected attachment preview"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full shadow-md"
                      aria-label="Remove photo"
                      onClick={() => removeImage(img.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expanded && !canPost && !busy && (
            <p className="text-xs text-muted-foreground">Write something or add photos to post.</p>
          )}

          {expanded && (
            <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
              <div className="flex items-center gap-1">
                <input
                  id={fileInputId}
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onClick={() => {
                    if (fileRef.current) fileRef.current.value = "";
                    setPickingPhotos(true);
                  }}
                  onChange={(e) => onPickImages(e.target.files)}
                />
                {photosDisabled ? (
                  <span className={photosButtonClass} aria-disabled="true">
                    {photosButtonContent}
                  </span>
                ) : (
                  <label htmlFor={fileInputId} className={cn(photosButtonClass, "cursor-pointer")}>
                    {photosButtonContent}
                  </label>
                )}
              </div>

              <div className="flex items-center gap-3">
                {readyToPost && images.length > 0 && !nearLimit && (
                  <span className="feed-composer-ready-hint text-xs font-medium">Ready</span>
                )}
                {nearLimit && (
                  <span className="text-xs text-muted-foreground">
                    {MAX_BODY - body.length} left
                  </span>
                )}
                {postButton}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
