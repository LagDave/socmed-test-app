export function resolvePostImageUrls(row: {
  image_url: string | null;
  image_urls: string[] | null;
}): string[] {
  if (Array.isArray(row.image_urls) && row.image_urls.length > 0) {
    return row.image_urls;
  }
  if (row.image_url) return [row.image_url];
  return [];
}
