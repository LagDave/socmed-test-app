import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("comments", "post_image_id");
  if (hasColumn) return;

  await knex.schema.alterTable("comments", (t) => {
    t.uuid("post_image_id")
      .nullable()
      .references("id")
      .inTable("post_images")
      .onDelete("CASCADE");
    t.index(["post_image_id", "created_at"]);
    t.index(["post_id", "post_image_id", "parent_id", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("comments", "post_image_id");
  if (!hasColumn) return;

  await knex.schema.alterTable("comments", (t) => {
    t.dropIndex(["post_id", "post_image_id", "parent_id", "created_at"]);
    t.dropIndex(["post_image_id", "created_at"]);
    t.dropColumn("post_image_id");
  });
}
