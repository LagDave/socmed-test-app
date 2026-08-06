import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("conversation_pins", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("conversation_id").notNullable().references("id").inTable("conversations").onDelete("CASCADE");
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.timestamp("pinned_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["conversation_id", "user_id"]);
    table.index(["user_id", "pinned_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("conversation_pins");
}
