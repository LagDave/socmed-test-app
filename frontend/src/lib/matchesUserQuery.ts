import type { PublicUser } from "@/api/types";

export function matchesUserQuery(user: PublicUser, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = user.displayName.toLowerCase();
  const username = (user.username ?? "").toLowerCase();
  return name.includes(q) || username.includes(q);
}
