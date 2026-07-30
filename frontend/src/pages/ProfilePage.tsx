import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Camera, MessageCircle, MoreHorizontal } from "lucide-react";
import { api } from "@/api/client";
import { openConversationWithUsername } from "@/api/messages";
import type { PublicUser } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold tracking-wide text-foreground">
      {children}
    </label>
  );
}

function toAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${window.location.origin}${trimmed}`;
  return trimmed;
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: me, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuNotice, setMenuNotice] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [isMutual, setIsMutual] = useState(false);

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
        setAvatarUrlInput(toAbsoluteUrl(d.user.avatarUrl || ""));
      })
      .catch((e: Error) => setError(e.message));
  }, [username]);

  useEffect(() => {
    if (!me || !profile || me.id === profile.id) {
      setIsMutual(false);
      return;
    }
    let cancelled = false;
    void api
      .get<{ areFriends: boolean }>(`/api/friends/status/${profile.id}`)
      .then((d) => {
        if (!cancelled) setIsMutual(d.areFriends);
      })
      .catch(() => {
        if (!cancelled) setIsMutual(false);
      });
    return () => {
      cancelled = true;
    };
  }, [me, profile]);

  useEffect(() => {
    if (!menuNotice) return;
    const t = window.setTimeout(() => setMenuNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [menuNotice]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const nextAvatarUrl = toAbsoluteUrl(avatarUrlInput) || null;
    const avatarChanged = nextAvatarUrl !== toAbsoluteUrl(profile?.avatarUrl || "");
    try {
      const data = await api.patch<{ user: PublicUser }>("/api/me/profile", {
        displayName,
        username: editUsername,
        bio,
        avatarUrl: nextAvatarUrl,
      });
      setProfile(data.user);
      setUser(data.user);
      setAvatarUrlInput(toAbsoluteUrl(data.user.avatarUrl || ""));
      if (avatarChanged) {
        setMenuNotice("Profile picture updated");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function onAvatarFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      // Upload only — do not attach as avatar until Save
      const data = await api.upload<{ url: string }>("/api/uploads", file);
      setAvatarUrlInput(toAbsoluteUrl(data.url));
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
      setAvatarUrlInput("");
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

  async function openMessage() {
    if (!profile?.username) return;
    setError(null);
    try {
      const id = await openConversationWithUsername(profile.username);
      navigate(`/messages/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open chat");
    }
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">{error || "Loading…"}</p>;
  }

  const handle = profile.username ? `@${profile.username}` : "@no-username";
  const profilePath = profile.username ? `/u/${profile.username}` : "/u/me";

  return (
    <section className="space-y-4">
        <header className="feed-card flex items-center gap-5 p-5 text-card-foreground">
          <ProfileAvatar displayName={profile.displayName} avatarUrl={profile.avatarUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{profile.displayName}</h1>
            <p className="mt-0.5 truncate text-sm font-normal text-muted-foreground">{handle}</p>
            {(profile.bio && !showEditor) && (
              <p className="mt-3 max-w-prose text-sm text-foreground/90">{profile.bio}</p>
            )}
            {!isSelf && profile.username && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!isMutual && (
                  <Button type="button" onClick={() => void sendFriendRequest()}>
                    Add friend
                  </Button>
                )}
                {isMutual && (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`Message ${profile.displayName}`}
                    title="Message"
                    onClick={() => void openMessage()}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
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

        {error && !showEditor && (
          <p className="px-1 text-sm text-muted-foreground">{error}</p>
        )}

        {showEditor && (
          <form
            onSubmit={onSave}
            className="feed-card space-y-5 p-5 text-card-foreground"
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
              <FieldLabel htmlFor="profile-avatar-url">Profile Picture</FieldLabel>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void onAvatarFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Choose profile picture"
                  title="Choose photo"
                >
                  {avatarUrlInput.trim() ? (
                    <img
                      src={avatarUrlInput.trim()}
                      alt=""
                      className="size-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground">
                      {(displayName.trim().slice(0, 1) || "?").toUpperCase()}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Camera className="size-5 text-white" aria-hidden="true" />
                  </span>
                </button>
                <Input
                  id="profile-avatar-url"
                  className="h-12 flex-1 px-4"
                  type="url"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  aria-label="Profile picture URL"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Click the photo to upload, or paste an image URL.</p>
            </div>

            {error && <p className="text-sm text-muted-foreground">{error}</p>}

            <Button type="submit" size="lg" className="mt-1 h-12 w-full rounded-xl px-8 sm:w-auto sm:min-w-44">
              Save
            </Button>
          </form>
        )}

        {isSelf && isPublicPreview && (
          <p className="px-1 text-center text-sm text-muted-foreground">
            Public preview · <Link className="underline underline-offset-2" to={profilePath}>Open shareable URL</Link>
          </p>
        )}

      {menuNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        >
          {menuNotice}
        </div>
      )}
    </section>
  );
}
