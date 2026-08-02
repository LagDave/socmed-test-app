export function postImageUrls(post: {
  imageUrl: string | null;
  imageUrls?: string[] | null;
}): string[] {
  if (post.imageUrls?.length) return post.imageUrls;
  if (post.imageUrl) return [post.imageUrl];
  return [];
}
