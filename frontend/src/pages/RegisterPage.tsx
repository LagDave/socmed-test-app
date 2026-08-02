import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockNotificationSounds } from "@/lib/notificationSounds";

export function RegisterPage() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    unlockNotificationSounds();
    setBusy(true);
    setError(null);
    try {
      const data = await api.post<{ user: PublicUser }>("/api/auth/register", {
        email,
        password,
        displayName,
        username: username || undefined,
      });
      setUser(data.user);
      nav("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Join the feed.</p>
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          type="password"
          placeholder="Password (min 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && <p className="text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating…" : "Register"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Have an account?{" "}
        <Link className="underline" to="/login">
          Sign in
        </Link>
      </p>
    </section>
  );
}
