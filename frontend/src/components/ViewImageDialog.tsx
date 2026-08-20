import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ViewImageDialogProps = {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
};

const CLOSE_BUTTON_SAMPLE_RATIO = 0.14;
const LIGHT_BACKGROUND_LUMINANCE = 0.55;
const DEFAULT_CLOSE_BUTTON_CLASS = "text-white mix-blend-difference";

function getCloseButtonColorClass(image: HTMLImageElement) {
  try {
    const canvas = document.createElement("canvas");
    const sampleWidth = Math.max(1, Math.round(image.naturalWidth * CLOSE_BUTTON_SAMPLE_RATIO));
    const sampleHeight = Math.max(1, Math.round(image.naturalHeight * CLOSE_BUTTON_SAMPLE_RATIO));
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return DEFAULT_CLOSE_BUTTON_CLASS;

    context.drawImage(
      image,
      image.naturalWidth - sampleWidth,
      0,
      sampleWidth,
      sampleHeight,
      0,
      0,
      sampleWidth,
      sampleHeight,
    );
    const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let luminance = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      luminance += (pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722) / 255;
    }

    return luminance / (pixels.length / 4) > LIGHT_BACKGROUND_LUMINANCE ? "text-black" : "text-white";
  } catch {
    return DEFAULT_CLOSE_BUTTON_CLASS;
  }
}

export function ViewImageDialog({ open, imageUrl, onClose }: ViewImageDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [closeButtonColorClass, setCloseButtonColorClass] = useState(DEFAULT_CLOSE_BUTTON_CLASS);
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

  useEffect(() => {
    setCloseButtonColorClass(DEFAULT_CLOSE_BUTTON_CLASS);
  }, [imageUrl]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        aria-label="Dismiss"
        className="image-viewer-backdrop modal-backdrop absolute inset-0"
        onClick={() => onCloseRef.current()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        className="animate-modal-enter relative z-10 flex max-h-[64dvh] max-w-[80vw] items-center justify-center sm:max-h-[min(72dvh,28rem)] sm:max-w-[min(90vw,28rem)]"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close image preview"
          className={`absolute right-2 top-2 z-10 grid size-6 place-items-center ${closeButtonColorClass} transition-opacity hover:opacity-70 focus-visible:outline-none`}
          onClick={() => onCloseRef.current()}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <img
          src={imageUrl}
          alt=""
          onLoad={(event) => setCloseButtonColorClass(getCloseButtonColorClass(event.currentTarget))}
          className="block max-h-[64dvh] max-w-[80vw] object-contain sm:max-h-[min(72dvh,28rem)] sm:max-w-[min(90vw,28rem)]"
        />
      </div>
    </div>,
    document.body,
  );
}
