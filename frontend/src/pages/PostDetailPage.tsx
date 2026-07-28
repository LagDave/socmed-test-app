import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { CommentView, PostView } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<CommentView | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        parentId: replyTo?.id ?? null,
      });
      setBody("");
      setImageFile(null);
      setReplyTo(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, CommentView[]>>((acc, c) => {
    if (!c.parentId) return acc;
    (acc[c.parentId] ||= []).push(c);
    return acc;
  }, {});

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
          <img src={post.imageUrl} alt="" className="max-h-96 w-full border border-border object-cover" />
        )}
      </article>

      <div>
        <h2 className="text-lg font-semibold">Comments</h2>
        <ul className="mt-3 space-y-3">
          {topLevel.map((c) => (
            <li key={c.id} className="border-b border-border pb-3">
              <p className="text-sm font-medium">{c.author.displayName}</p>
              <p className="whitespace-pre-wrap">{c.body}</p>
              {c.imageUrl && <img src={c.imageUrl} alt="" className="mt-2 max-h-64 border border-border" />}
              {user && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1 px-0"
                  onClick={() => setReplyTo(c)}
                >
                  Reply
                </Button>
              )}
              {(repliesByParent[c.id] || []).map((r) => (
                <div key={r.id} className="mt-3 ml-4 border-l border-border pl-3">
                  <p className="text-sm font-medium">{r.author.displayName}</p>
                  <p className="whitespace-pre-wrap">{r.body}</p>
                  {r.imageUrl && (
                    <img src={r.imageUrl} alt="" className="mt-2 max-h-64 border border-border" />
                  )}
                </div>
              ))}
            </li>
          ))}
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </ul>
      </div>

      {user && (
        <form onSubmit={onComment} className="space-y-3">
          {replyTo && (
            <p className="text-sm text-muted-foreground">
              Replying to {replyTo.author.displayName}{" "}
              <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </p>
          )}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={replyTo ? "Write a reply" : "Write a comment"}
            required
          />
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          <Button type="submit">{replyTo ? "Reply" : "Comment"}</Button>
        </form>
      )}
      {error && <p className="text-sm text-muted-foreground">{error}</p>}
    </section>
  );
}
