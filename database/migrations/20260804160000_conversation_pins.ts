import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("conversation_pins", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("conversation_id")
      .notNullable()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.timestamp("pinned_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(["conversation_id", "user_id"]);
    t.index(["user_id", "pinned_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("conversation_pins");
}
