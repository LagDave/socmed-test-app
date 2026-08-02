import type { RefObject } from "react";
import { MessageCircle } from "lucide-react";
import type { CommentView, PublicUser, ReactionSummary } from "@/api/types";
import { CommentComposer } from "@/components/CommentComposer";
import { CommentItem } from "@/components/CommentItem";
import type { CommentThread } from "@/lib/groupComments";

type CommentsSectionProps = {
  comments: CommentView[];
  threads: CommentThread[];
  orphans: CommentView[];
  user: PublicUser | null;
  busy: boolean;
  replyTo: CommentView | null;
  onCommentSubmit: (input: { text: string; file: File | null }) => Promise<void>;
  onReplySubmit: (input: { text: string; file: File | null }) => Promise<void>;
  onStartReply: (comment: CommentView) => void;
  onClearReply: () => void;
  onDeleteComment: (comment: CommentView, kind: "comment" | "reply") => void;
  onReactionSummaryChange: (commentId: string, summary: ReactionSummary) => void;
  sectionRef?: RefObject<HTMLDivElement | null>;
  sectionId?: string;
  title?: string;
  composerAutoFocus?: boolean;
};

export function CommentsSection({
  comments,
  threads,
  orphans,
  user,
  busy,
  replyTo,
  onCommentSubmit,
  onReplySubmit,
  onStartReply,
  onClearReply,
  onDeleteComment,
  onReactionSummaryChange,
  sectionRef,
  sectionId = "comments",
  title = "Comments",
  composerAutoFocus = false,
}: CommentsSectionProps) {
  const countLabel = comments.length === 1 ? "1 comment" : `${comments.length} comments`;

  return (
    <section id={sectionId} ref={sectionRef} className="feed-card overflow-hidden">
      <div className="border-b border-border/70 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {comments.length > 0 && (
            <span className="text-sm text-muted-foreground">· {countLabel}</span>
          )}
        </div>
      </div>

      {user && !replyTo && (
        <div className="border-b border-border/70 px-4 py-3">
          <CommentComposer user={user} busy={busy} onSubmit={onCommentSubmit} autoFocus={composerAutoFocus} />
        </div>
      )}

      <div className="px-4 py-4">
        {comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-canvas/30 px-4 py-8 text-center">
            <p className="text-sm font-medium">No comments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user ? "Start the conversation above." : "Sign in to join the conversation."}
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            {threads.map(({ parent, replies }) => (
              <li key={parent.id} className="comment-thread">
                <CommentItem
                  comment={parent}
                  currentUserId={user?.id}
                  onReply={user ? () => onStartReply(parent) : undefined}
                  onDelete={() => onDeleteComment(parent, "comment")}
                  onReactionSummaryChange={(summary) => onReactionSummaryChange(parent.id, summary)}
                />

                {replies.length > 0 && (
                  <ul className="comment-replies mt-3 space-y-3">
                    {replies.map((reply) => (
                      <li key={reply.id}>
                        <CommentItem
                          comment={reply}
                          currentUserId={user?.id}
                          isReply
                          onDelete={() => onDeleteComment(reply, "reply")}
                          onReactionSummaryChange={(summary) =>
                            onReactionSummaryChange(reply.id, summary)
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {user && replyTo?.id === parent.id && (
                  <div className="comment-replies mt-3">
                    <CommentComposer
                      user={user}
                      compact
                      busy={busy}
                      autoFocus
                      placeholder="Write a reply…"
                      submitLabel="Reply"
                      replyingTo={{ displayName: replyTo.author.displayName }}
                      onCancel={onClearReply}
                      onSubmit={onReplySubmit}
                    />
                  </div>
                )}
              </li>
            ))}

            {orphans.map((orphan) => (
              <li key={orphan.id}>
                <CommentItem
                  comment={orphan}
                  currentUserId={user?.id}
                  isReply
                  onDelete={() => onDeleteComment(orphan, "reply")}
                  onReactionSummaryChange={(summary) => onReactionSummaryChange(orphan.id, summary)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
