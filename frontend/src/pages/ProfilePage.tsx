import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, MoreHorizontal } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function ProfileAvatar({
  displayName,
  avatarUrl,
  size = "lg",
}: {
  displayName: string;
  avatarUrl: string | null;
  size?: "lg" | "md";
}) {
  const dim = size === "lg" ? "h-24 w-24 text-3xl" : "h-16 w-16 text-xl";
  const letter = displayName.trim().slice(0, 1).toUpperCase() || "?";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full border border-border object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-semibold text-foreground shadow-sm`}
      aria-hidden="true"
    >
      {letter}
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold tracking-wide text-foreground">
      {children}
    </label>
  );
}

type ProfileMenuProps = {
  hasAvatar: boolean;
  onRemoveAvatar: () => void;
  onViewProfile: () => void;
  onCopyLink: () => void;
};

function ProfileOverflowMenu({
  hasAvatar,
  onRemoveAvatar,
  onViewProfile,
  onCopyLink,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={rootRef} className="relative ml-auto shrink-0 self-start">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Profile options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="size-5" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-56 overflow-hidden rounded-xl border border-border bg-card py-1 text-card-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <button
            type="button"
            role="menuitem"
            disabled={!hasAvatar}
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => run(onRemoveAvatar)}
          >
            Remove Profile Picture
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-accent"
            onClick={() => run(onViewProfile)}
          >
            View Profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-accent"
            onClick={() =>
              run(() => {
                void navigate("/settings");
              })
            }
          >
            Account Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-accent"
            onClick={() =>
              run(() => {
                void onCopyLink();
              })
            }
          >
            Copy Profile Link
          </button>
        </div>
      )}
    </div>
  );
}

export function ProfilePage() {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: me, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuNotice, setMenuNotice] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);

  const isSelf = Boolean(me && profile && me.id === profile.id);
  const isPublicPreview = searchParams.get("view") === "public";
  const showEditor = isSelf && !isPublicPreview;

  useEffect(() => {
    if (!username) return;
    void api
      .get<{ user: PublicUser }>(`/api/users/${username}`)
      .then((d) => {
        setProfile(d.user);
        setDisplayName(d.user.displayName);
        setBio(d.user.bio || "");
        setEditUsername(d.user.username || "");
        setAvatarFileName(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [username]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
    setError(null);
    setAvatarFileName(file.name);
    try {
      const data = await api.upload<{ url: string; user: PublicUser }>("/api/uploads", file, "avatar");
      setProfile(data.user);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function removeAvatar() {
    setError(null);
    setMenuNotice(null);
    try {
      const data = await api.patch<{ user: PublicUser }>("/api/me/profile", { avatarUrl: null });
      setProfile(data.user);
      setUser(data.user);
      setAvatarFileName(null);
      setMenuNotice("Profile picture removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove picture");
    }
  }

  async function copyProfileLink() {
    if (!profile?.username) return;
    const url = `${window.location.origin}/u/${profile.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setMenuNotice("Profile link copied");
    } catch {
      setError("Could not copy link");
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

  if (!profile) {
    return <p className="text-sm text-muted-foreground">{error || "Loading…"}</p>;
  }

  const handle = profile.username ? `@${profile.username}` : "@no-username";
  const profilePath = profile.username ? `/u/${profile.username}` : "/u/me";

  return (
    <div className="soft-page-canvas -mx-4 space-y-4 rounded-2xl px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="flex items-center gap-5 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_6px_18px_rgba(0,0,0,0.4)]">
          <ProfileAvatar displayName={profile.displayName} avatarUrl={profile.avatarUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{profile.displayName}</h1>
            <p className="mt-0.5 truncate text-sm font-normal text-muted-foreground">{handle}</p>
            {(profile.bio && !showEditor) && (
              <p className="mt-3 max-w-prose text-sm text-foreground/90">{profile.bio}</p>
            )}
            {!isSelf && profile.username && (
              <Button type="button" className="mt-4" onClick={() => void sendFriendRequest()}>
                Add friend
              </Button>
            )}
            {isSelf && isPublicPreview && (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  searchParams.delete("view");
                  setSearchParams(searchParams, { replace: true });
                }}
              >
                Back to edit
              </Button>
            )}
          </div>
          {isSelf && (
            <ProfileOverflowMenu
              hasAvatar={Boolean(profile.avatarUrl)}
              onRemoveAvatar={() => void removeAvatar()}
              onViewProfile={() => {
                setSearchParams({ view: "public" }, { replace: true });
                setMenuNotice(null);
              }}
              onCopyLink={() => void copyProfileLink()}
            />
          )}
        </header>

        {(menuNotice || (error && !showEditor)) && (
          <p className="text-sm text-muted-foreground">{menuNotice || error}</p>
        )}

        {showEditor && (
          <form
            onSubmit={onSave}
            className="space-y-5 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_6px_18px_rgba(0,0,0,0.4)]"
          >
            <div>
              <h2 className="text-lg font-bold tracking-tight">Edit Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Update how you appear across SocMed.</p>
            </div>

            <div>
              <FieldLabel htmlFor="profile-display-name">Full Name</FieldLabel>
              <Input
                id="profile-display-name"
                className="h-12 px-4"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="profile-username">Username</FieldLabel>
              <Input
                id="profile-username"
                className="h-12 px-4"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
              <Textarea
                id="profile-bio"
                className="min-h-32 resize-y px-4 py-3.5 text-base leading-relaxed"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people a little about yourself"
              />
            </div>

            <div>
              <FieldLabel htmlFor="profile-avatar">Profile Picture</FieldLabel>
              <input
                ref={fileInputRef}
                id="profile-avatar"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => void onAvatar(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-10 text-center transition-colors hover:border-foreground/30 hover:bg-secondary/70"
              >
                <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card">
                  <Camera className="size-5 text-muted-foreground" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">Upload Profile Picture</span>
                <span className="text-xs text-muted-foreground">
                  {avatarFileName || "PNG or JPG · click to choose a file"}
                </span>
              </button>
            </div>

            {error && <p className="text-sm text-muted-foreground">{error}</p>}

            <Button type="submit" size="lg" className="mt-1 h-12 w-full rounded-xl px-8 sm:w-auto sm:min-w-44">
              Save
            </Button>
          </form>
        )}

        {isSelf && isPublicPreview && (
          <p className="text-center text-sm text-muted-foreground">
            Public preview · <Link className="underline underline-offset-2" to={profilePath}>Open shareable URL</Link>
          </p>
        )}
      </div>
    </div>
  );
}
