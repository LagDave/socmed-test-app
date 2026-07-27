import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { CommentView, PostView } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

function groupComments(comments: CommentView[]): { parent: CommentView; replies: CommentView[] }[] {
  const parents = comments.filter((c) => !c.parentId);
  const byParent = new Map<string, CommentView[]>();
  for (const c of comments) {
    if (!c.parentId) continue;
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }
  return parents.map((parent) => ({
    parent,
    replies: byParent.get(parent.id) ?? [],
  }));
}

export function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<CommentView | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyImageFile, setReplyImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const threads = useMemo(() => groupComments(comments), [comments]);

  async function load() {
    if (!id) return;
    const p = await api.get<{ post: PostView }>(`/api/posts/${id}`);
    const c = await api.get<{ comments: CommentView[] }>(`/api/posts/${id}/comments`);
    setPost(p.post);
    setComments(c.comments);
  }

  useEffect(() => {
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

  async function onComment(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const up = await api.upload<{ url: string }>("/api/uploads", imageFile);
        imageUrl = up.url;
      }
      await api.post(`/api/posts/${id}/comments`, {
        body,
        imageUrl,
        parentId: null,
      });
      setBody("");
      setImageFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!id || !replyTo) return;
    try {
      let imageUrl: string | null = null;
      if (replyImageFile) {
        const up = await api.upload<{ url: string }>("/api/uploads", replyImageFile);
        imageUrl = up.url;
      }
      await api.post(`/api/posts/${id}/comments`, {
        body: replyBody,
        imageUrl,
        parentId: replyTo.id,
      });
      clearReply();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  if (!post) return <p className="text-sm text-muted-foreground">{error || "Loading…"}</p>;

  return (
    <section className="space-y-6">
      <Link to="/" className="text-sm underline">
        ← Feed
      </Link>
      <article className="space-y-2 border-b border-border pb-6">
        <p className="font-medium">
          {post.author.displayName}
          {post.author.username ? ` @${post.author.username}` : ""}
        </p>
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
                  <p className="text-sm font-medium">{parent.author.displayName}</p>
                  <p className="whitespace-pre-wrap">{parent.body}</p>
                  {parent.imageUrl && (
                    <img src={parent.imageUrl} alt="" className="mt-2 max-h-64 border border-border" />
                  )}
                </div>
                {user && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => startReply(parent)}
                  >
                    Reply
                  </Button>
                )}
              </div>
              {replies.length > 0 && (
                <ul className="mt-3 space-y-3 border-l border-border pl-6">
                  {replies.map((reply) => (
                    <li key={reply.id}>
                      <p className="text-sm font-medium">{reply.author.displayName}</p>
                      <p className="whitespace-pre-wrap">{reply.body}</p>
                      {reply.imageUrl && (
                        <img src={reply.imageUrl} alt="" className="mt-2 max-h-64 border border-border" />
                      )}
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
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </ul>
      </div>

      {user && (
        <form onSubmit={onComment} className="space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment"
            required
          />
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          <Button type="submit">Comment</Button>
        </form>
      )}

      {error && <p className="text-sm text-muted-foreground">{error}</p>}
    </section>
  );
}
