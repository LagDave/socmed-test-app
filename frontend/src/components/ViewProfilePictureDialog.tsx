import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Dismiss"
        className="image-viewer-backdrop modal-backdrop absolute inset-0"
        onClick={() => onCloseRef.current()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-modal-enter relative z-10 flex max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex-col items-center"
      >
        <div className="relative">
          <button
            ref={closeRef}
            type="button"
            aria-label="Close profile picture"
            className="absolute right-3 top-3 z-10 grid size-7 place-items-center text-white mix-blend-difference transition-opacity hover:opacity-70 focus-visible:outline-none"
            onClick={() => onCloseRef.current()}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <div className="relative flex justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-[min(72vw,18rem)] rounded-full object-cover sm:size-[min(58vw,20rem)]"
              />
            ) : (
              <ProfileAvatar
                displayName={displayName}
                avatarUrl={null}
                size="xl"
                className="size-[min(72vw,18rem)] text-6xl sm:size-[min(58vw,20rem)]"
              />
            )}
          </div>
        </div>
        <h2 id={titleId} className="sr-only">
          {displayName}&apos;s profile picture
        </h2>
      </div>
    </div>,
    document.body,
  );
}
