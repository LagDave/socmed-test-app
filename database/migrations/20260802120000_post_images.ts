import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("post_images");
  if (!hasTable) {
    await knex.schema.createTable("post_images", (t) => {
      t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      t.uuid("post_id").notNullable().references("id").inTable("posts").onDelete("CASCADE");
      t.string("url", 500).notNullable();
      t.smallint("sort_order").notNullable();
      t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      t.unique(["post_id", "sort_order"]);
      t.index(["post_id", "sort_order"]);
    });
  }

  const postsWithImage = await knex("posts")
    .select("id", "image_url")
    .whereNotNull("image_url");

  for (const post of postsWithImage) {
    const existing = await knex("post_images").where({ post_id: post.id, sort_order: 0 }).first();
    if (!existing) {
      await knex("post_images").insert({
        post_id: post.id,
        url: post.image_url,
        sort_order: 0,
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("post_images");
  if (!hasTable) return;
  await knex.schema.dropTable("post_images");
}
