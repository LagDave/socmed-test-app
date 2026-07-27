import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("comments", (t) => {
    t.uuid("parent_id")
      .nullable()
      .references("id")
      .inTable("comments")
      .onDelete("CASCADE");
    t.index(["post_id", "parent_id", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("comments", (t) => {
    t.dropIndex(["post_id", "parent_id", "created_at"]);
    t.dropColumn("parent_id");
  });
}
