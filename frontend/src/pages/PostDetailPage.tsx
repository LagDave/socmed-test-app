import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { CommentView, PostView, ReactionSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PostActionRow, ReplyActionButton } from "@/components/PostActionRow";
import { ReactionBar } from "@/components/ReactionBar";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatRelativeTime";
import { canSharePost, shareAttributionLabel } from "@/lib/sharePost";
import { submitOnEnter } from "@/lib/submitOnEnter";

type CommentThread = { parent: CommentView; replies: CommentView[] };

type PendingDelete =
  | { type: "post" }
  | { type: "comment"; comment: CommentView; kind: "comment" | "reply" };

function CommentTimestamp({ createdAt }: { createdAt: string }) {
  return (
    <time
      className="shrink-0 text-xs font-normal text-muted-foreground"
      dateTime={createdAt}
      title={formatAbsoluteTime(createdAt) || undefined}
    >
      {formatRelativeTime(createdAt)}
    </time>
  );
}

function groupComments(comments: CommentView[]): { threads: CommentThread[]; orphans: CommentView[] } {
  const parents = comments.filter((c) => !c.parentId);
  const parentIds = new Set(parents.map((p) => p.id));
  const byParent = new Map<string, CommentView[]>();
  const orphans: CommentView[] = [];

  for (const c of comments) {
    if (!c.parentId) continue;
    if (!parentIds.has(c.parentId)) {
      orphans.push(c);
      continue;
    }
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }

  return {
    threads: parents.map((parent) => ({
      parent,
      replies: byParent.get(parent.id) ?? [],
    })),
    orphans,
  };
}

export function PostDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<CommentView | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyImageFile, setReplyImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [shareBusy, setShareBusy] = useState(false);
  const shareBusyRef = useRef(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  const { threads, orphans } = useMemo(() => groupComments(comments), [comments]);

  async function load() {
    if (!id) return;
    const p = await api.get<{ post: PostView }>(`/api/posts/${id}`);
    const c = await api.get<{ comments: CommentView[] }>(`/api/posts/${id}/comments`);
    setPost(p.post);
    setComments(c.comments);
  }

  function patchPostSummary(reactionSummary: ReactionSummary) {
    setPost((prev) => (prev ? { ...prev, reactionSummary } : prev));
  }

  function patchCommentSummary(commentId: string, reactionSummary: ReactionSummary) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, reactionSummary } : c))
    );
  }

  useEffect(() => {
    setPost(null);
    setComments([]);
    setBody("");
    setImageFile(null);
    setReplyTo(null);
    setReplyBody("");
    setReplyImageFile(null);
    setError(null);
    setShareNotice(null);
    busyRef.current = false;
    setBusy(false);
    shareBusyRef.current = false;
    setShareBusy(false);
    setPendingDelete(null);
    void load().catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!replyTo) return;
    replyTextareaRef.current?.focus();
    replyTextareaRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [replyTo]);

  useEffect(() => {
    if (!post || location.hash !== "#comments") return;
    commentsSectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [post, location.hash]);

  function scrollToComments() {
    commentsSectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function clearReply() {
    setReplyTo(null);
    setReplyBody("");
    setReplyImageFile(null);
  }

  function startReply(comment: CommentView) {
    setReplyTo(comment);
    setReplyBody("");
    setReplyImageFile(null);
  }

  async function submitComment(input: {
    text: string;
    file: File | null;
    parentId: string | null;
  }): Promise<boolean> {
    if (!id || busyRef.current) return false;
    const text = input.text.trim();
    if (!text) return false;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (input.file) {
        const up = await api.upload<{ url: string }>("/api/uploads", input.file);
        imageUrl = up.url;
      }
      await api.post(`/api/posts/${id}/comments`, {
        body: text,
        imageUrl,
        parentId: input.parentId,
      });
      await load();
      return true;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function onComment(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    try {
      const ok = await submitComment({ text: body, file: imageFile, parentId: null });
      if (ok) {
        setBody("");
        setImageFile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!replyTo || busyRef.current) return;
    try {
      const ok = await submitComment({ text: replyBody, file: replyImageFile, parentId: replyTo.id });
      if (ok) clearReply();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onShare() {
    if (!post || shareBusyRef.current) return;
    shareBusyRef.current = true;
    setShareBusy(true);
    setError(null);
    setShareNotice(null);
    try {
      await api.post(`/api/posts/${post.id}/share`);
      setShareNotice("Shared to your feed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      shareBusyRef.current = false;
      setShareBusy(false);
    }
  }

  async function confirmPendingDelete() {
    if (!pendingDelete || deleting || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError(null);
    try {
      if (pendingDelete.type === "post") {
        if (!post) return;
        await api.delete(`/api/posts/${post.id}`);
        setPendingDelete(null);
        navigate("/");
        return;
      }

      const { comment } = pendingDelete;
      await api.delete(`/api/comments/${comment.id}`);
      if (replyTo?.id === comment.id) clearReply();
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  if (!post) return <p className="text-sm text-muted-foreground">{error || "Loading…"}</p>;

  const deleteDialogTitle =
    pendingDelete?.type === "post"
      ? "Delete this post?"
      : pendingDelete?.kind === "reply"
        ? "Delete this reply?"
        : "Delete this comment?";

  const deleteDialogDescription =
    pendingDelete?.type === "post"
      ? "This removes the post and all of its comments."
      : pendingDelete?.kind === "comment"
        ? "This also removes any replies under this comment."
        : undefined;

  const attribution = shareAttributionLabel(user?.id, post);
  const isShare = Boolean(post.sharedFromPostId);

  return (
    <section className="space-y-6">
      <Link to="/" className="text-sm underline">
        ← Feed
      </Link>
      <article className="feed-card space-y-3 p-5">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          {attribution ? (
            <p className="font-medium">{attribution}</p>
          ) : (
            <p className="font-medium">
              {post.author.displayName}
              {post.author.username ? ` @${post.author.username}` : ""}
            </p>
          )}
          {user?.id === post.author.id && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setPendingDelete({ type: "post" })}
            >
              Delete
            </Button>
          )}
        </div>
        {isShare ? (
          <SharedPostEmbed
            sharedFrom={post.sharedFrom}
            className="rounded-lg border border-border/70 bg-canvas/50 px-3 py-3"
          />
        ) : (
          <>
            <p className="whitespace-pre-wrap text-lg">{post.body}</p>
            {post.imageUrl && (
              <img src={post.imageUrl} alt="" className="max-h-96 w-full object-cover border border-border" />
            )}
          </>
        )}
        <PostActionRow
          className="pt-1"
          size="md"
          onCommentClick={scrollToComments}
          onShare={user && canSharePost(user.id, post) ? () => void onShare() : undefined}
          shareBusy={shareBusy}
        >
          <ReactionBar
            size="md"
            targetType="post"
            targetId={post.id}
            summary={post.reactionSummary}
            onSummaryChange={patchPostSummary}
          />
        </PostActionRow>
        {shareNotice && <p className="text-sm text-muted-foreground">{shareNotice}</p>}
      </article>

      <div id="comments" ref={commentsSectionRef} className="feed-card space-y-3 p-5">
        <h2 className="text-lg font-semibold">Comments</h2>
        <ul className="mt-3 space-y-3">
          {threads.map(({ parent, replies }) => (
            <li key={parent.id} className="rounded-lg border border-border/70 bg-canvas/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{parent.author.displayName}</p>
                    <CommentTimestamp createdAt={parent.createdAt} />
                  </div>
                  <p className="whitespace-pre-wrap">{parent.body}</p>
                  {parent.imageUrl && (
                    <img src={parent.imageUrl} alt="" className="mt-2 max-h-64 border border-border" />
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <ReactionBar
                      size="sm"
                      targetType="comment"
                      targetId={parent.id}
                      summary={parent.reactionSummary}
                      onSummaryChange={(reactionSummary) =>
                        patchCommentSummary(parent.id, reactionSummary)
                      }
                    />
                    {user && <ReplyActionButton onClick={() => startReply(parent)} />}
                  </div>
                </div>
                {user?.id === parent.author.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setPendingDelete({ type: "comment", comment: parent, kind: "comment" })}
                  >
                    Delete
                  </Button>
                )}
              </div>
              {replies.length > 0 && (
                <ul className="mt-3 space-y-2 border-l border-border pl-4">
                  {replies.map((reply) => (
                    <li key={reply.id} className="rounded-lg border border-border/60 bg-canvas/40 p-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium">{reply.author.displayName}</p>
                            <CommentTimestamp createdAt={reply.createdAt} />
                          </div>
                          <p className="whitespace-pre-wrap">{reply.body}</p>
                          {reply.imageUrl && (
                            <img src={reply.imageUrl} alt="" className="mt-2 max-h-64 border border-border" />
                          )}
                          <ReactionBar
                            className="mt-2"
                            size="sm"
                            targetType="comment"
                            targetId={reply.id}
                            summary={reply.reactionSummary}
                            onSummaryChange={(reactionSummary) =>
                              patchCommentSummary(reply.id, reactionSummary)
                            }
                          />
                        </div>
                        {user?.id === reply.author.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={() => setPendingDelete({ type: "comment", comment: reply, kind: "reply" })}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {user && replyTo?.id === parent.id && (
                <form onSubmit={onReply} className="mt-3 space-y-3 rounded-lg border border-border/70 bg-canvas/60 p-3">
                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>
                      Replying to{" "}
                      <span className="font-medium text-foreground">{replyTo.author.displayName}</span>
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={clearReply}>
                      Cancel
                    </Button>
                  </div>
                  <Textarea
                    ref={replyTextareaRef}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={submitOnEnter}
                    placeholder="Write a reply"
                    required
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReplyImageFile(e.target.files?.[0] || null)}
                  />
                  <Button type="submit" disabled={busy}>
                    Reply
                  </Button>
                </form>
              )}
            </li>
          ))}
          {orphans.map((orphan) => (
            <li key={orphan.id} className="rounded-lg border border-border/70 bg-canvas/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{orphan.author.displayName}</p>
                    <CommentTimestamp createdAt={orphan.createdAt} />
                  </div>
                  <p className="whitespace-pre-wrap">{orphan.body}</p>
                  {orphan.imageUrl && (
                    <img src={orphan.imageUrl} alt="" className="mt-2 max-h-64 border border-border" />
                  )}
                  <ReactionBar
                    className="mt-2"
                    size="sm"
                    targetType="comment"
                    targetId={orphan.id}
                    summary={orphan.reactionSummary}
                    onSummaryChange={(reactionSummary) =>
                      patchCommentSummary(orphan.id, reactionSummary)
                    }
                  />
                </div>
                {user?.id === orphan.author.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setPendingDelete({ type: "comment", comment: orphan, kind: "reply" })}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </ul>

        {user && (
          <form onSubmit={onComment} className="mt-4 space-y-3 rounded-lg border border-border/70 bg-canvas/60 p-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={submitOnEnter}
              placeholder="Write a comment"
              required
            />
            <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <Button type="submit" disabled={busy}>
              Comment
            </Button>
          </form>
        )}
      </div>

      {error && <p className="text-sm text-muted-foreground">{error}</p>}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={deleteDialogTitle}
        description={deleteDialogDescription}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmPendingDelete()}
      />
    </section>
  );
}
