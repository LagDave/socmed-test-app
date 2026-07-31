import { useRef, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FriendsRequestFormProps = {
  onSubmit: (username: string) => Promise<void>;
};

export function FriendsRequestForm({ onSubmit }: FriendsRequestFormProps) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = username.trim();
    if (!value || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await onSubmit(value);
      setUsername("");
    } catch {
      // Parent surfaces the error message.
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="feed-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <UserPlus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <Input
          className="h-11 flex-1 text-base"
          placeholder="Add by username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          aria-label="Username"
        />
      </div>
      <Button type="submit" size="lg" className="h-11 shrink-0 px-6" disabled={busy || !username.trim()}>
        {busy ? "Sending…" : "Send Request"}
      </Button>
    </form>
  );
}
