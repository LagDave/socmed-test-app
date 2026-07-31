import { useEffect, useId, useRef, type FormEvent } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileAvatar } from "@/components/ProfileAvatar";

type EditProfileDialogProps = {
  open: boolean;
  displayName: string;
  username: string;
  bio: string;
  avatarUrlInput: string;
  coverUrlInput: string;
  error: string | null;
  busy?: boolean;
  onDisplayNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onAvatarUrlChange: (value: string) => void;
  onCoverUrlChange: (value: string) => void;
  onAvatarFile: (file: File | null) => void;
  onCoverFile: (file: File | null) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
};

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold tracking-wide text-foreground">
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
  error,
  busy = false,
  onDisplayNameChange,
  onUsernameChange,
  onBioChange,
  onAvatarUrlChange,
  onCoverUrlChange,
  onAvatarFile,
  onCoverFile,
  onSubmit,
  onCancel,
}: EditProfileDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-foreground/40"
        disabled={busy}
        onClick={() => onCancelRef.current()}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto border border-border bg-background p-5 shadow-lg"
        onSubmit={onSubmit}
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          Edit Profile
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">
          Update how you appear across SocMed.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <FieldLabel htmlFor="edit-profile-cover-url">Cover Photo</FieldLabel>
            <div className="space-y-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => coverFileInputRef.current?.click()}
                className="group relative block h-28 w-full overflow-hidden rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Choose cover photo"
                title="Choose cover photo"
              >
                {coverPreviewUrl ? (
                  <img src={coverPreviewUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="profile-cover size-full" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ImageIcon className="size-6 text-white" aria-hidden="true" />
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
              <Input
                id="edit-profile-cover-url"
                className="h-12 px-4"
                type="url"
                value={coverUrlInput}
                onChange={(e) => onCoverUrlChange(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                aria-label="Cover photo URL"
                disabled={busy}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Click the banner to upload, or paste a cover image URL.</p>
          </div>

          <div>
            <FieldLabel htmlFor="edit-profile-avatar-url">Profile Picture</FieldLabel>
            <div className="flex items-center gap-3">
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
                className="group relative shrink-0 overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Choose profile picture"
                title="Choose photo"
              >
                <ProfileAvatar
                  displayName={displayName}
                  avatarUrl={previewUrl}
                  size="md"
                  className="ring-2 ring-border"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="size-5 text-white" aria-hidden="true" />
                </span>
              </button>
              <Input
                id="edit-profile-avatar-url"
                className="h-12 flex-1 px-4"
                type="url"
                value={avatarUrlInput}
                onChange={(e) => onAvatarUrlChange(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                aria-label="Profile picture URL"
                disabled={busy}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Click the photo to upload, or paste an image URL.</p>
          </div>

          <div>
            <FieldLabel htmlFor="edit-profile-display-name">Full Name</FieldLabel>
            <Input
              ref={firstFieldRef}
              id="edit-profile-display-name"
              className="h-12 px-4"
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
              className="h-12 px-4"
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
              className="min-h-32 resize-y px-4 py-3.5 text-base leading-relaxed"
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="Tell people a little about yourself"
              disabled={busy}
            />
          </div>

          {error && <p className="text-sm text-muted-foreground">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onCancelRef.current()}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
