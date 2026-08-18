import type { Knex } from "knex";

function normalizeImageUrls(value: unknown): string[] {
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
      return [];
    }
  }
  return [];
}

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("posts", "image_urls");
  if (!hasColumn) return;

  const posts = await knex("posts").select("id", "image_url", "image_urls").whereNotNull("image_urls");

  for (const post of posts) {
    const urls = normalizeImageUrls(post.image_urls);
    if (urls.length === 0) continue;

    for (let sortOrder = 0; sortOrder < urls.length; sortOrder++) {
      const url = urls[sortOrder];
      const existing = await knex("post_images")
        .where({ post_id: post.id, sort_order: sortOrder })
        .first();
      if (!existing) {
        await knex("post_images").insert({
          post_id: post.id,
          url,
          sort_order: sortOrder,
        });
      }
    }
  }

  await knex.schema.alterTable("posts", (t) => {
    t.dropColumn("image_urls");
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("posts", "image_urls");
  if (hasColumn) return;

  await knex.schema.alterTable("posts", (t) => {
    t.jsonb("image_urls").nullable();
  });

  const posts = await knex("post_images")
    .select("post_id")
    .groupBy("post_id");

  for (const { post_id: postId } of posts) {
    const rows = await knex("post_images")
      .where({ post_id: postId })
      .orderBy("sort_order", "asc");
    const urls = rows.map((row: { url: string }) => row.url);
    await knex("posts")
      .where({ id: postId })
      .update({
        image_urls: knex.raw("?::jsonb", [JSON.stringify(urls)]),
        image_url: urls[0] ?? null,
      });
  }
}
