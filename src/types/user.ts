export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  createdAt: Date;
  isOnline?: boolean;
  lastActiveAt?: Date | null;
};

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  feed_seen_at?: Date | null;
  last_active_at?: Date | null;
  created_at: Date;
  updated_at: Date;
};

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url,
    createdAt: row.created_at,
  };
}
