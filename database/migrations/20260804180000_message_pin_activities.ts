import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("message_pin_activities", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("conversation_id")
      .notNullable()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    t.uuid("message_id").notNullable().references("id").inTable("messages").onDelete("CASCADE");
    t.uuid("actor_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("action", 16).notNullable();
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(["conversation_id", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("message_pin_activities");
}
