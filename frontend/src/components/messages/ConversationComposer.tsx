import type { FormEvent, KeyboardEvent, RefObject } from "react";
import { ImagePlus, SendHorizontal, X } from "lucide-react";
import type { PublicUser } from "@/api/types";
import { MessageComposerEmojiPicker } from "@/components/MessageComposerEmojiPicker";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ReplyPreview = {
  name: string;
  snippet: string;
  imageUrl: string | null;
};

type ConversationComposerProps = {
  user: PublicUser | null;
  body: string;
  editingMessageId: string | null;
  editingMessageHasImage: boolean;
  composeBusy: boolean;
  replyPreview: ReplyPreview | null;
  themed: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: (event: FormEvent) => void;
  onBodyChange: (body: string) => void;
  onStopTyping: () => void;
  onComposeKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onAttachImage: (file: File | null) => void;
  onPickEmoji: (emoji: string) => void;
  onCancelEdit: () => void;
  onCancelReply: () => void;
};

export function ConversationComposer({
  user,
  body,
  editingMessageId,
  editingMessageHasImage,
  composeBusy,
  replyPreview,
  themed,
  fileRef,
  textareaRef,
  onSubmit,
  onBodyChange,
  onStopTyping,
  onComposeKeyDown,
  onAttachImage,
  onPickEmoji,
  onCancelEdit,
  onCancelReply,
}: ConversationComposerProps) {
  const isSendDisabled =
    composeBusy || (editingMessageId ? !editingMessageHasImage && !body.trim() : !body.trim());

  return (
    <form onSubmit={onSubmit} className="border-t border-border bg-card px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
      {editingMessageId && (
        <div className="mb-2 flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <span>Editing message</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={composeBusy}
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
        </div>
      )}
      {replyPreview && (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="text-muted-foreground">
              Replying to <span className="font-medium text-foreground">{replyPreview.name}</span>
              {" · "}
              <span className="text-foreground/90">{replyPreview.snippet}</span>
            </p>
            {replyPreview.imageUrl && (
              <div className="user-media-stage mt-2 h-10 w-10 rounded">
                <img src={replyPreview.imageUrl} alt="" className="user-media-thumbnail rounded" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Cancel reply"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div
        className={cn(
          "messages-composer-track flex items-end gap-2 rounded-full px-2 py-1.5",
          themed && "border-transparent bg-transparent shadow-none"
        )}
        style={
          themed
            ? { backgroundColor: "color-mix(in srgb, var(--chat-accent) 18%, transparent)" }
            : undefined
        }
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => onAttachImage(event.target.files?.[0] ?? null)}
        />
        {user && (
          <ProfileAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
        )}
        <div className="flex shrink-0 items-center -space-x-1">
          {!editingMessageId && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Attach image"
                disabled={composeBusy}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <MessageComposerEmojiPicker disabled={composeBusy} onPick={onPickEmoji} />
            </>
          )}
        </div>
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          onBlur={onStopTyping}
          onKeyDown={onComposeKeyDown}
          placeholder={editingMessageId ? "Edit message" : "Type a message"}
          aria-label={editingMessageId ? "Edit message" : "Message"}
          rows={1}
          disabled={composeBusy}
          className="max-h-32 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-6 shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          aria-label={editingMessageId ? "Save edit" : "Send"}
          disabled={isSendDisabled}
          style={
            themed
              ? { backgroundColor: "var(--chat-accent)", color: "var(--chat-accent-fg)" }
              : undefined
          }
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
