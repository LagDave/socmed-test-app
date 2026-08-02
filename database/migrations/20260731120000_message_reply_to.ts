import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("messages", "reply_to_message_id");
  if (hasColumn) return;

  await knex.schema.alterTable("messages", (t) => {
    t.uuid("reply_to_message_id")
      .nullable()
      .references("id")
      .inTable("messages")
      .onDelete("SET NULL");
    t.index(["conversation_id", "reply_to_message_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("messages", "reply_to_message_id");
  if (!hasColumn) return;

  await knex.schema.alterTable("messages", (t) => {
    t.dropIndex(["conversation_id", "reply_to_message_id"]);
    t.dropColumn("reply_to_message_id");
  });
}
