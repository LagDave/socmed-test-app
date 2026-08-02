import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversations", (t) => {
    t.timestamp("user_a_hidden_at", { useTz: true }).nullable();
    t.timestamp("user_b_hidden_at", { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("conversations", (t) => {
    t.dropColumn("user_a_hidden_at");
    t.dropColumn("user_b_hidden_at");
  });
}
