import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn("conversations", "theme_log"))) {
    await knex.schema.alterTable("conversations", (t) => {
      t.jsonb("theme_log").notNullable().defaultTo("[]");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("conversations", "theme_log")) {
    await knex.schema.alterTable("conversations", (t) => {
      t.dropColumn("theme_log");
    });
  }
}
