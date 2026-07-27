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
      await api.post(`/api/posts/${id}/comments`, { body, imageUrl });
      setBody("");
      setImageFile(null);
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
        {post.imageUrl && <img src={post.imageUrl} alt="" className="max-h-96 w-full object-cover border border-border" />}
      </article>

      <div>
        <h2 className="text-lg font-semibold">Comments</h2>
        <ul className="mt-3 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-border pb-3">
              <p className="text-sm font-medium">{c.author.displayName}</p>
              <p className="whitespace-pre-wrap">{c.body}</p>
              {c.imageUrl && <img src={c.imageUrl} alt="" className="mt-2 max-h-64 border border-border" />}
            </li>
          ))}
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </ul>
      </div>

      {user && (
        <form onSubmit={onComment} className="space-y-3">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment" required />
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          <Button type="submit">Comment</Button>
        </form>
      )}
    </section>
  );
}
