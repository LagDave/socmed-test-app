import { useEffect, useId, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold tracking-wide text-foreground">
      {children}
    </label>
  );
}

type EditProfileDialogProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  displayName: string;
  username: string;
  bio: string;
  onDisplayNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSave: (event: FormEvent) => void;
  onCancel: () => void;
};

export function EditProfileDialog({
  open,
  busy = false,
  error,
  displayName,
  username,
  bio,
  onDisplayNameChange,
  onUsernameChange,
  onBioChange,
  onSave,
  onCancel,
}: EditProfileDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
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
        onSubmit={onSave}
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          Edit Profile
        </h2>
        <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
          Update how you appear across SocMed.
        </p>

        <div className="mt-5 space-y-4">
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
          <Button type="submit" disabled={busy} className="min-w-24">
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
