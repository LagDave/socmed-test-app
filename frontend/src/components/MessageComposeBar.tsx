import type { KeyboardEvent, RefObject } from "react";
import { ImagePlus, SendHorizontal } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitOnEnter } from "@/lib/submitOnEnter";

export const messageComposeTextareaClassName =
  "max-h-32 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-6 shadow-none focus-visible:ring-0";

type ComposeUser = {
  displayName: string;
  avatarUrl: string | null;
};

export function MessageComposeBar({
  value,
  onChange,
  user,
  disabled = false,
  placeholder = "Message",
  ariaLabel = "Message",
  showAttach = false,
  onAttachClick,
  submitDisabled = false,
  submitAriaLabel = "Send",
  onTextareaKeyDown,
  autoFocus = false,
  textareaRef,
}: {
  value: string;
  onChange: (value: string) => void;
  user: ComposeUser | null;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  showAttach?: boolean;
  onAttachClick?: () => void;
  submitDisabled?: boolean;
  submitAriaLabel?: string;
  onTextareaKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  autoFocus?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    onTextareaKeyDown?.(e);
    if (e.defaultPrevented) return;
    submitOnEnter(e);
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl bg-secondary/50 px-2 py-1.5">
      {user && (
        <ProfileAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
      )}
      {showAttach && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Attach image"
          disabled={disabled}
          onClick={onAttachClick}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
      )}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        rows={1}
        disabled={disabled}
        className={messageComposeTextareaClassName}
        autoFocus={autoFocus}
      />
      <Button
        type="submit"
        size="icon"
        className="shrink-0"
        aria-label={submitAriaLabel}
        disabled={disabled || submitDisabled}
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** @internal exported for tests if needed */
export type MessageComposeBarProps = Parameters<typeof MessageComposeBar>[0];
