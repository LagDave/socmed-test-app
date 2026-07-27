import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (t) => {
    t.string("username", 40).nullable().unique();
    t.string("bio", 500).nullable();
    t.string("avatar_url", 500).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (t) => {
    t.dropColumn("username");
    t.dropColumn("bio");
    t.dropColumn("avatar_url");
  });
}
