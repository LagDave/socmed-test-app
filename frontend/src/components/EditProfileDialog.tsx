import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Camera, ChevronDown, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { cn } from "@/lib/utils";

type EditProfileDialogProps = {
  open: boolean;
  displayName: string;
  username: string;
  bio: string;
  avatarUrlInput: string;
  coverUrlInput: string;
  showAvatarCaption: boolean;
  showCoverCaption: boolean;
  avatarPostCaption: string;
  coverPostCaption: string;
  error: string | null;
  busy?: boolean;
  onDisplayNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onAvatarUrlChange: (value: string) => void;
  onCoverUrlChange: (value: string) => void;
  onAvatarPostCaptionChange: (value: string) => void;
  onCoverPostCaptionChange: (value: string) => void;
  onAvatarFile: (file: File | null) => void;
  onCoverFile: (file: File | null) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
};

const fieldClassName =
  "h-11 min-w-0 rounded-lg border-input bg-background px-3.5 text-[15px] shadow-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/25 focus-visible:ring-offset-0";

const textareaClassName =
  "min-w-0 rounded-lg border-input bg-background px-3.5 py-3 text-[15px] leading-relaxed shadow-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/25 focus-visible:ring-offset-0";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

export function EditProfileDialog({
  open,
  displayName,
  username,
  bio,
  avatarUrlInput,
  coverUrlInput,
  showAvatarCaption,
  showCoverCaption,
  avatarPostCaption,
  coverPostCaption,
  error,
  busy = false,
  onDisplayNameChange,
  onUsernameChange,
  onBioChange,
  onAvatarUrlChange,
  onCoverUrlChange,
  onAvatarPostCaptionChange,
  onCoverPostCaptionChange,
  onAvatarFile,
  onCoverFile,
  onSubmit,
  onCancel,
}: EditProfileDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const [showUrlFields, setShowUrlFields] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowUrlFields(false);
      return;
    }
    displayNameRef.current?.focus({ preventScroll: true });

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

  const previewUrl = avatarUrlInput.trim() || null;
  const coverPreviewUrl = coverUrlInput.trim() || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Dismiss"
        className="modal-backdrop absolute inset-0"
        disabled={busy}
        onClick={() => onCancelRef.current()}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="modal-panel animate-modal-enter relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-md flex-col overflow-hidden"
        onSubmit={onSubmit}
      >
        <div className="shrink-0 border-b border-border/70 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            Edit profile
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
            Update your photos and profile details.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative h-28 shrink-0 overflow-hidden sm:h-32">
            <button
              type="button"
              disabled={busy}
              onClick={() => coverFileInputRef.current?.click()}
              className="group relative block size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-label="Choose cover photo"
            >
              {coverPreviewUrl ? (
                <img src={coverPreviewUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="profile-cover size-full" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
                  <ImageIcon className="size-3.5" aria-hidden="true" />
                  Change cover
                </span>
              </span>
            </button>
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => onCoverFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="relative px-5 pb-1">
            <div className="absolute left-5 top-0 z-10 -translate-y-1/2">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(e) => onAvatarFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => avatarFileInputRef.current?.click()}
                className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Choose profile picture"
              >
                <ProfileAvatar
                  displayName={displayName}
                  avatarUrl={previewUrl}
                  size="lg"
                  className="bg-card shadow-md ring-4 ring-card"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="size-5 text-white" aria-hidden="true" />
                </span>
              </button>
            </div>

            <div className="space-y-4 px-5 pb-5 pt-14">
              {showCoverCaption && (
                <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <FieldLabel htmlFor="edit-profile-cover-caption">Cover caption</FieldLabel>
                    <span className="text-xs tabular-nums text-muted-foreground">{coverPostCaption.length}/500</span>
                  </div>
                  <Textarea
                    id="edit-profile-cover-caption"
                    className={cn(textareaClassName, "min-h-20 resize-none")}
                    value={coverPostCaption}
                    onChange={(e) => onCoverPostCaptionChange(e.target.value)}
                    placeholder="Say something about your new cover…"
                    disabled={busy}
                    maxLength={500}
                  />
                </div>
              )}

              {showAvatarCaption && (
                <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <FieldLabel htmlFor="edit-profile-avatar-caption">Profile picture caption</FieldLabel>
                    <span className="text-xs tabular-nums text-muted-foreground">{avatarPostCaption.length}/500</span>
                  </div>
                  <Textarea
                    id="edit-profile-avatar-caption"
                    className={cn(textareaClassName, "min-h-20 resize-none")}
                    value={avatarPostCaption}
                    onChange={(e) => onAvatarPostCaptionChange(e.target.value)}
                    placeholder="Say something about your new photo…"
                    disabled={busy}
                    maxLength={500}
                  />
                </div>
              )}

              <div>
                <FieldLabel htmlFor="edit-profile-display-name">Full name</FieldLabel>
                <Input
                  ref={displayNameRef}
                  id="edit-profile-display-name"
                  className={fieldClassName}
                  value={displayName}
                  onChange={(e) => onDisplayNameChange(e.target.value)}
                  placeholder="Your name"
                  required
                  disabled={busy}
                />
              </div>

              <div>
                <FieldLabel htmlFor="edit-profile-username">Username</FieldLabel>
                <Input
                  id="edit-profile-username"
                  className={fieldClassName}
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  placeholder="username"
                  required
                  disabled={busy}
                />
              </div>

              <div>
                <FieldLabel htmlFor="edit-profile-bio">Bio</FieldLabel>
                <Textarea
                  id="edit-profile-bio"
                  className={cn(textareaClassName, "min-h-28 resize-y")}
                  value={bio}
                  onChange={(e) => onBioChange(e.target.value)}
                  placeholder="Tell people a little about yourself"
                  disabled={busy}
                />
              </div>

              <div className="border-t border-border/70 pt-1">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                  aria-expanded={showUrlFields}
                  onClick={() => setShowUrlFields((v) => !v)}
                >
                  <span>Paste image URL instead</span>
                  <ChevronDown
                    className={cn("size-4 shrink-0 transition-transform", showUrlFields && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>
                {showUrlFields && (
                  <div className="space-y-3 pb-1 pt-2">
                    <div>
                      <FieldLabel htmlFor="edit-profile-cover-url">Cover photo URL</FieldLabel>
                      <Input
                        id="edit-profile-cover-url"
                        className={fieldClassName}
                        type="url"
                        value={coverUrlInput}
                        onChange={(e) => onCoverUrlChange(e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        disabled={busy}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="edit-profile-avatar-url">Profile picture URL</FieldLabel>
                      <Input
                        id="edit-profile-avatar-url"
                        className={fieldClassName}
                        type="url"
                        value={avatarUrlInput}
                        onChange={(e) => onAvatarUrlChange(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        disabled={busy}
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border/70 bg-card px-5 py-4">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onCancelRef.current()}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
