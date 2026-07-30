import type { PostView } from "@/api/types";

export function canSharePost(viewerId: string, post: PostView): boolean {
  return post.author.id !== viewerId && !post.sharedFromPostId;
}

export function shareAttributionLabel(
  viewerId: string | undefined,
  post: PostView
): string | null {
  if (!post.sharedFromPostId) return null;
  const sharerIsViewer = viewerId === post.author.id;
  const sharer = sharerIsViewer ? "You" : post.author.displayName;
  const originalName = post.sharedFrom?.author.displayName ?? "someone";
  return `${sharer} shared ${originalName}'s post`;
}
