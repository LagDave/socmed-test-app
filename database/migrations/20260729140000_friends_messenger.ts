import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("conversations", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_a").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.uuid("user_b").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.timestamp("user_a_last_read_at", { useTz: true }).nullable();
    t.timestamp("user_b_last_read_at", { useTz: true }).nullable();
    t.timestamp("last_message_at", { useTz: true }).nullable();
    t.timestamps(true, true);
    t.unique(["user_a", "user_b"]);
    t.index(["last_message_at"]);
  });

  await knex.schema.createTable("messages", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("conversation_id")
      .notNullable()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    t.uuid("sender_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.text("body").nullable();
    t.string("image_url", 500).nullable();
    t.timestamp("unsent_at", { useTz: true }).nullable();
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(["conversation_id", "created_at"]);
    t.index(["sender_id"]);
  });

  await knex.schema.createTable("message_reactions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("message_id").notNullable().references("id").inTable("messages").onDelete("CASCADE");
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("emoji", 32).notNullable();
    t.timestamps(true, true);
    t.unique(["message_id", "user_id"]);
    t.index(["message_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("message_reactions");
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("conversations");
}
