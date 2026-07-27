import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProfilePage() {
  const { username } = useParams();
  const { user: me, setUser } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editUsername, setEditUsername] = useState("");

  const isSelf = Boolean(me && profile && me.id === profile.id);

  useEffect(() => {
    if (!username) return;
    void api
      .get<{ user: PublicUser }>(`/api/users/${username}`)
      .then((d) => {
        setProfile(d.user);
        setDisplayName(d.user.displayName);
        setBio(d.user.bio || "");
        setEditUsername(d.user.username || "");
      })
      .catch((e: Error) => setError(e.message));
  }, [username]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    try {
      const data = await api.patch<{ user: PublicUser }>("/api/me/profile", {
        displayName,
        username: editUsername,
        bio,
      });
      setProfile(data.user);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function onAvatar(file: File | null) {
    if (!file) return;
    try {
      const data = await api.upload<{ url: string; user: PublicUser }>("/api/uploads", file, "avatar");
      setProfile(data.user);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function sendFriendRequest() {
    if (!profile?.username) return;
    try {
      await api.post("/api/friends/request", { username: profile.username });
      alert("Request sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  if (!profile) return <p className="text-sm text-muted-foreground">{error || "Loading…"}</p>;

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-4">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="h-20 w-20 object-cover border border-border" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center border border-border bg-secondary text-xl font-semibold">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{profile.displayName}</h1>
          <p className="text-muted-foreground">@{profile.username || "no-username"}</p>
          {profile.bio && <p className="mt-2 max-w-prose">{profile.bio}</p>}
        </div>
      </div>

      {!isSelf && profile.username && (
        <Button type="button" onClick={() => void sendFriendRequest()}>
          Add friend
        </Button>
      )}

      {isSelf && (
        <form onSubmit={onSave} className="space-y-3 border border-border p-4">
          <h2 className="font-semibold">Edit profile</h2>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />
          <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Username" />
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
          <Input type="file" accept="image/*" onChange={(e) => void onAvatar(e.target.files?.[0] || null)} />
          {error && <p className="text-sm">{error}</p>}
          <Button type="submit">Save</Button>
        </form>
      )}
    </section>
  );
}
