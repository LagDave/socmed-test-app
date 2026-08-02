import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn("conversations", "theme"))) {
    await knex.schema.alterTable("conversations", (t) => {
      t.jsonb("theme").nullable();
    });
  }
  if (!(await knex.schema.hasColumn("conversations", "theme_updated_at"))) {
    await knex.schema.alterTable("conversations", (t) => {
      t.timestamp("theme_updated_at", { useTz: true }).nullable();
    });
  }
  if (!(await knex.schema.hasColumn("conversations", "theme_updated_by"))) {
    await knex.schema.alterTable("conversations", (t) => {
      t.uuid("theme_updated_by")
        .nullable()
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("conversations", "theme_updated_by")) {
    await knex.schema.alterTable("conversations", (t) => {
      t.dropColumn("theme_updated_by");
    });
  }
  if (await knex.schema.hasColumn("conversations", "theme_updated_at")) {
    await knex.schema.alterTable("conversations", (t) => {
      t.dropColumn("theme_updated_at");
    });
  }
  if (await knex.schema.hasColumn("conversations", "theme")) {
    await knex.schema.alterTable("conversations", (t) => {
      t.dropColumn("theme");
    });
  }
}
