import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("message_user_deletions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("message_id")
      .notNullable()
      .references("id")
      .inTable("messages")
      .onDelete("CASCADE");
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.timestamp("deleted_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(["message_id", "user_id"]);
    t.index(["user_id", "message_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("message_user_deletions");
}
