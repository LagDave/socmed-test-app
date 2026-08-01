import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("messages", "delivered_at");
  if (!hasColumn) {
    await knex.schema.alterTable("messages", (t) => {
      t.timestamp("delivered_at", { useTz: true }).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("messages", "delivered_at");
  if (!hasColumn) return;

  await knex.schema.alterTable("messages", (t) => {
    t.dropColumn("delivered_at");
  });
}
