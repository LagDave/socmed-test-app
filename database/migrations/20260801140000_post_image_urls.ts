import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("posts", "image_urls");
  if (hasColumn) return;

  await knex.schema.alterTable("posts", (t) => {
    t.jsonb("image_urls").nullable();
  });

  await knex.raw(`
    UPDATE posts
    SET image_urls = jsonb_build_array(image_url)
    WHERE image_url IS NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("posts", "image_urls");
  if (!hasColumn) return;

  await knex.schema.alterTable("posts", (t) => {
    t.dropColumn("image_urls");
  });
}
