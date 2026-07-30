import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("posts", "shared_from_post_id");
  if (hasColumn) return;

  await knex.schema.alterTable("posts", (t) => {
    t.uuid("shared_from_post_id")
      .nullable()
      .references("id")
      .inTable("posts")
      .onDelete("SET NULL");
    t.index(["shared_from_post_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("posts", "shared_from_post_id");
  if (!hasColumn) return;

  await knex.schema.alterTable("posts", (t) => {
    t.dropIndex(["shared_from_post_id"]);
    t.dropColumn("shared_from_post_id");
  });
}
