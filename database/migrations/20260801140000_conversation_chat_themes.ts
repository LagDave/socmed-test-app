import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversations", (t) => {
    t.jsonb("theme").nullable();
    t.timestamp("theme_updated_at", { useTz: true }).nullable();
    t.uuid("theme_updated_by").nullable().references("id").inTable("users").onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversations", (t) => {
    t.dropColumn("theme");
    t.dropColumn("theme_updated_at");
    t.dropColumn("theme_updated_by");
  });
}
