import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("messages", "reply_to_message_id");
  if (!hasColumn) {
    await knex.schema.alterTable("messages", (t) => {
      t.uuid("reply_to_message_id")
        .nullable()
        .references("id")
        .inTable("messages")
        .onDelete("SET NULL");
    });
  }

  const hasIndex = await knex.schema.hasTable("messages").then(async (exists) => {
    if (!exists) return false;
    const result = await knex.raw<{ rows: Array<{ indexname: string }> }>(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'messages' AND indexname = 'messages_conversation_id_reply_to_message_id_index'`
    );
    return result.rows.length > 0;
  });
  if (!hasIndex) {
    await knex.schema.alterTable("messages", (t) => {
      t.index(["conversation_id", "reply_to_message_id"]);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("messages", "reply_to_message_id");
  if (!hasColumn) return;

  await knex.schema.alterTable("messages", (t) => {
    t.dropIndex(["conversation_id", "reply_to_message_id"]);
    t.dropColumn("reply_to_message_id");
  });
}
