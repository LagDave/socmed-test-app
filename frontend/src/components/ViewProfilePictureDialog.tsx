import { useEffect, useId, useRef } from "react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";

type ViewProfilePictureDialogProps = {
  open: boolean;
  displayName: string;
  avatarUrl: string | null;
  onClose: () => void;
};

export function ViewProfilePictureDialog({
  open,
  displayName,
  avatarUrl,
  onClose,
}: ViewProfilePictureDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Dismiss"
        className="modal-backdrop absolute inset-0"
        onClick={() => onCloseRef.current()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-panel animate-modal-enter relative z-10 w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-b from-muted/70 to-card px-6 pb-8 pt-6 text-center">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {displayName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Profile picture</p>
          <div className="mt-6 flex justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-44 rounded-full object-cover shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-4 ring-card sm:size-48"
              />
            ) : (
              <ProfileAvatar displayName={displayName} avatarUrl={null} size="xl" className="ring-4 ring-card shadow-lg" />
            )}
          </div>
          {!avatarUrl && (
            <p className="mt-4 text-sm text-muted-foreground">No profile picture set.</p>
          )}
        </div>
        <div className="flex justify-end border-t border-border/70 px-5 py-4">
          <Button ref={closeRef} type="button" variant="outline" onClick={() => onCloseRef.current()}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
