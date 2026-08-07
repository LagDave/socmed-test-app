import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("messages", "edited_at");
  if (!hasColumn) {
    await knex.schema.alterTable("messages", (table) => {
      table.timestamp("edited_at", { useTz: true }).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("messages", "edited_at");
  if (!hasColumn) return;

  await knex.schema.alterTable("messages", (table) => {
    table.dropColumn("edited_at");
  });
}
