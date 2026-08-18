import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("message_pins", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("message_id").notNullable().references("id").inTable("messages").onDelete("CASCADE");
    table
      .uuid("conversation_id")
      .notNullable()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    table.uuid("pinned_by").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.timestamp("pinned_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["message_id"]);
    table.index(["conversation_id", "pinned_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("message_pins");
}
