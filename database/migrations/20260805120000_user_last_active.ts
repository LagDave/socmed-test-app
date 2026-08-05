import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasLastActiveAt = await knex.schema.hasColumn("users", "last_active_at");
  if (!hasLastActiveAt) {
    await knex.schema.alterTable("users", (t) => {
      t.timestamp("last_active_at", { useTz: true }).nullable();
    });
  }

  await knex.raw(
    "CREATE INDEX IF NOT EXISTS conversations_user_b_index ON conversations (user_b)"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP INDEX IF EXISTS conversations_user_b_index");

  const hasLastActiveAt = await knex.schema.hasColumn("users", "last_active_at");
  if (hasLastActiveAt) {
    await knex.schema.alterTable("users", (t) => {
      t.dropColumn("last_active_at");
    });
  }
}
