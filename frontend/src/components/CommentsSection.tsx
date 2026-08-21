import type { RefObject } from "react";
import { MessageSquare } from "lucide-react";
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
  composerRef?: RefObject<HTMLDivElement | null>;
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
  composerRef,
  sectionId = "comments",
  title = "Comments",
  composerAutoFocus = false,
}: CommentsSectionProps) {
  const countLabel = comments.length === 1 ? "1 comment" : `${comments.length} comments`;

  return (
    <section id={sectionId} ref={sectionRef} className="feed-card overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3" aria-label={title}>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
            <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </span>
          {comments.length > 0 ? (
            <span className="font-medium text-foreground">{countLabel}</span>
          ) : (
            <span className="text-muted-foreground">Be the first to comment</span>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {comments.length === 0 ? (
          <div className="comment-empty-state">
            <span className="comment-empty-icon" aria-hidden="true">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">No comments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user ? "Start the conversation below." : "Sign in to join the conversation."}
            </p>
          </div>
        ) : (
          <ul className="space-y-6">
            {threads.map(({ parent, replies }) => (
              <li key={parent.id} className="comment-thread">
                <CommentItem
                  comment={parent}
                  currentUserId={user?.id}
                  onReply={user ? () => onStartReply(parent) : undefined}
                  onDelete={() => onDeleteComment(parent, "comment")}
                  onReactionSummaryChange={(summary) => onReactionSummaryChange(parent.id, summary)}
                />

                {(replies.length > 0 || (user && replyTo?.id === parent.id)) && (
                  <div className="comment-replies-block">
                    {replies.length > 0 && (
                      <ul className="comment-replies space-y-4">
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
                      <div className="comment-reply-composer">
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

      {user && !replyTo && (
        <div ref={composerRef} className="border-t border-border/60 bg-canvas/20 px-4 py-3.5">
          <CommentComposer
            user={user}
            busy={busy}
            onSubmit={onCommentSubmit}
            autoFocus={composerAutoFocus}
          />
        </div>
      )}
    </section>
  );
}
