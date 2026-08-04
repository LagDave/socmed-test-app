import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("message_pins", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("message_id").notNullable().references("id").inTable("messages").onDelete("CASCADE");
    t.uuid("conversation_id")
      .notNullable()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    t.uuid("pinned_by").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.timestamp("pinned_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(["message_id"]);
    t.index(["conversation_id", "pinned_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("message_pins");
}
