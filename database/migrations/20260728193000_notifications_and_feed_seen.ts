import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasFeedSeen = await knex.schema.hasColumn("users", "feed_seen_at");
  if (!hasFeedSeen) {
    await knex.schema.alterTable("users", (t) => {
      t.timestamp("feed_seen_at", { useTz: true }).nullable();
    });
  }

  const hasParent = await knex.schema.hasColumn("comments", "parent_id");
  if (!hasParent) {
    await knex.schema.alterTable("comments", (t) => {
      t.uuid("parent_id").nullable().references("id").inTable("comments").onDelete("CASCADE");
      t.index(["parent_id"]);
    });
  }

  const hasNotifications = await knex.schema.hasTable("notifications");
  if (!hasNotifications) {
    await knex.schema.createTable("notifications", (t) => {
      t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
      t.uuid("recipient_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
      t.uuid("actor_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
      t.string("type", 40).notNullable();
      t.uuid("post_id").nullable().references("id").inTable("posts").onDelete("CASCADE");
      t.uuid("comment_id").nullable().references("id").inTable("comments").onDelete("CASCADE");
      t.uuid("friendship_id").nullable().references("id").inTable("friendships").onDelete("CASCADE");
      t.boolean("is_read").notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.index(["recipient_id", "is_read", "created_at"]);
      t.index(["recipient_id", "type"]);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("notifications");
  const hasParent = await knex.schema.hasColumn("comments", "parent_id");
  if (hasParent) {
    await knex.schema.alterTable("comments", (t) => {
      t.dropIndex(["parent_id"]);
      t.dropColumn("parent_id");
    });
  }
  const hasFeedSeen = await knex.schema.hasColumn("users", "feed_seen_at");
  if (hasFeedSeen) {
    await knex.schema.alterTable("users", (t) => {
      t.dropColumn("feed_seen_at");
    });
  }
}
