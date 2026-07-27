import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { PostView } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function FeedPage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api.get<{ posts: PostView[] }>("/api/feed");
    setPosts(data.posts);
  }

  useEffect(() => {
    if (!user) return;
    void load().catch((e: Error) => setError(e.message));
  }, [user]);

  async function onCompose(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const up = await api.upload<{ url: string }>("/api/uploads", imageFile);
        imageUrl = up.url;
      }
      await api.post("/api/posts", { body, imageUrl });
      setBody("");
      setImageFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!user) {
    return (
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Socmed</h1>
        <p className="text-muted-foreground">Sign in to see your feed.</p>
        <Button asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Feed</h1>
        <p className="text-sm text-muted-foreground">You and your mutuals.</p>
      </div>

      <form onSubmit={onCompose} className="space-y-3 border border-border bg-background p-4">
        <Textarea
          placeholder="What's happening?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        {error && <p className="text-sm">{error}</p>}
        <Button type="submit" disabled={busy}>
          Post
        </Button>
      </form>

      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="border-b border-border pb-4">
            <div className="flex items-baseline justify-between gap-2">
              <Link className="font-medium underline-offset-2 hover:underline" to={`/u/${p.author.username || p.author.id}`}>
                {p.author.displayName}
                {p.author.username ? ` @${p.author.username}` : ""}
              </Link>
              <time className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</time>
            </div>
            <Link to={`/posts/${p.id}`} className="mt-2 block whitespace-pre-wrap">
              {p.body}
            </Link>
            {p.imageUrl && (
              <img src={p.imageUrl} alt="" className="mt-3 max-h-96 w-full object-cover border border-border" />
            )}
          </li>
        ))}
        {posts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet.</p>}
      </ul>
    </section>
  );
}
