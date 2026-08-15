import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FriendsRequestFormProps = {
  onSubmit: (username: string) => Promise<void>;
  open: boolean;
  onClose: () => void;
};

export function FriendsRequestForm({ onSubmit, open, onClose }: FriendsRequestFormProps) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = username.trim();
    if (!value || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await onSubmit(value);
      setUsername("");
      onClose();
    } catch {
      // Parent surfaces the error message.
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <form id="friends-request-search" onSubmit={handleSubmit} className="friends-request-search" aria-label="Search people">
      <Input
        ref={inputRef}
        className="h-10 flex-1"
        placeholder="Search by username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
        required
        aria-label="Username"
      />
      <Button
        type="submit"
        size="sm"
        className="shrink-0"
        disabled={busy || !username.trim()}
      >
        {busy ? "Sending…" : "Send Request"}
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label="Close search" onClick={onClose}>
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
