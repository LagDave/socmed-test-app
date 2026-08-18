import type { CommentView, PostImageView, PostView } from "@/api/types";
import { emptyReactionSummary } from "@/lib/reactions";

export const MAX_POST_IMAGES = 10;

export function postMediaUrls(post: Pick<PostView, "imageUrl" | "imageUrls">): string[] {
  if (post.imageUrls?.length) return post.imageUrls;
  if (post.imageUrl) return [post.imageUrl];
  return [];
}

export function postMediaImages(post: Pick<PostView, "imageUrl" | "imageUrls" | "images">): PostImageView[] {
  if (post.images?.length) {
    return [...post.images].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const urls = postMediaUrls(post);
  return urls.map((url, sortOrder) => ({
    id: "",
    url,
    sortOrder,
    commentCount: 0,
    reactionSummary: emptyReactionSummary(),
  }));
}

export function postPhotoCommentsPath(postId: string, postImageId: string): string {
  return `/posts/${postId}/photos/${postImageId}`;
}

export function commentsForPostImage(
  comments: CommentView[],
  postImageId: string | null
): CommentView[] {
  return comments.filter((c) => (c.postImageId ?? null) === postImageId);
}
