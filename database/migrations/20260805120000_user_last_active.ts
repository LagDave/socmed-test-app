import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasLastActiveAt = await knex.schema.hasColumn("users", "last_active_at");
  if (!hasLastActiveAt) {
    await knex.schema.alterTable("users", (t) => {
      t.timestamp("last_active_at", { useTz: true }).nullable();
    });
  }

  await knex.schema.alterTable("conversations", (t) => {
    t.index(["user_b"], "conversations_user_b_index");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversations", (t) => {
    t.dropIndex(["user_b"], "conversations_user_b_index");
  });

  const hasLastActiveAt = await knex.schema.hasColumn("users", "last_active_at");
  if (hasLastActiveAt) {
    await knex.schema.alterTable("users", (t) => {
      t.dropColumn("last_active_at");
    });
  }
}
