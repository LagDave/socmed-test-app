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
    <form
      onSubmit={handleSubmit}
      className="friends-add-strip flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="friends-add-input-track">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
          <UserPlus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <Input
          className="h-10 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          placeholder="Add by username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          aria-label="Username"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-11 shrink-0 rounded-full px-6"
        disabled={busy || !username.trim()}
      >
        {busy ? "Sending…" : "Send Request"}
      </Button>
    </form>
  );
}
