function normalizeImageUrls(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === "string")) {
        return parsed;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function resolvePostImageUrls(row: {
  image_url: string | null;
  image_urls: string[] | null;
}): string[] {
  const fromJson = normalizeImageUrls(row.image_urls);
  if (fromJson && fromJson.length > 0) {
    return fromJson;
  }
  if (row.image_url) return [row.image_url];
  return [];
}
