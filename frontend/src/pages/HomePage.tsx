import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Health = { status: string; service: string; time: string };

export function HomePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(async (r) => {
        const json = await r.json();
        if (!json.success) throw new Error(json.error?.message || "Health failed");
        setHealth(json.data);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Socmed</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Black-and-white social feed. Auth, posts, comments, and friends land next.
        </p>
      </div>
      <div className="border border-border bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">API</p>
        {error && <p className="mt-2 text-sm">{error}</p>}
        {health && (
          <p className="mt-2 font-mono text-sm">
            {health.service} · {health.status} · {health.time}
          </p>
        )}
        {!health && !error && <p className="mt-2 text-sm text-muted-foreground">Checking…</p>}
      </div>
      <Button asChild>
        <a href="/login">Continue</a>
      </Button>
    </section>
  );
}
