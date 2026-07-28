import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { CommentView, PostView } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
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
      title={new Date(createdAt).toLocaleString()}
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
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { threads, orphans } = useMemo(() => groupComments(comments), [comments]);

  async function load() {
    if (!id) return;
    const p = await api.get<{ post: PostView }>(`/api/posts/${id}`);
    const c = await api.get<{ comments: CommentView[] }>(`/api/posts/${id}/comments`);
    setPost(p.post);
    setComments(c.comments);
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
    setPendingDelete(null);
    void load().catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!replyTo) return;
    replyTextareaRef.current?.focus();
    replyTextareaRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [replyTo]);

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
    if (!id) return false;
    const text = input.text.trim();
    if (!text) return false;
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
  }

  async function onComment(e: FormEvent) {
    e.preventDefault();
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
    if (!replyTo) return;
    try {
      const ok = await submitComment({ text: replyBody, file: replyImageFile, parentId: replyTo.id });
      if (ok) clearReply();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function confirmPendingDelete() {
    if (!pendingDelete) return;
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

  return (
    <section className="space-y-6">
      <Link to="/" className="text-sm underline">
        ← Feed
      </Link>
      <article className="space-y-2 border-b border-border pb-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium">
            {post.author.displayName}
            {post.author.username ? ` @${post.author.username}` : ""}
          </p>
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
        <p className="whitespace-pre-wrap text-lg">{post.body}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="" className="max-h-96 w-full object-cover border border-border" />
        )}
      </article>

      <div>
        <h2 className="text-lg font-semibold">Comments</h2>
        <ul className="mt-3 space-y-3">
          {threads.map(({ parent, replies }) => (
            <li key={parent.id} className="border-b border-border pb-3">
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
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {user?.id === parent.author.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete({ type: "comment", comment: parent, kind: "comment" })}
                    >
                      Delete
                    </Button>
                  )}
                  {user && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startReply(parent)}
                    >
                      Reply
                    </Button>
                  )}
                </div>
              </div>
              {replies.length > 0 && (
                <ul className="mt-3 space-y-3 border-l border-border pl-6">
                  {replies.map((reply) => (
                    <li key={reply.id}>
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
                <form onSubmit={onReply} className="mt-3 space-y-3 border-l border-border pl-6">
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
                  <Button type="submit">Reply</Button>
                </form>
              )}
            </li>
          ))}
          {orphans.map((orphan) => (
            <li key={orphan.id} className="border-b border-border pb-3">
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
      </div>

      {user && (
        <form onSubmit={onComment} className="space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={submitOnEnter}
            placeholder="Write a comment"
            required
          />
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          <Button type="submit">Comment</Button>
        </form>
      )}

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
