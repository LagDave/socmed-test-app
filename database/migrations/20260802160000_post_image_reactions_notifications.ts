import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasReactionImage = await knex.schema.hasColumn("reactions", "post_image_id");
  if (!hasReactionImage) {
    await knex.schema.alterTable("reactions", (t) => {
      t.uuid("post_image_id")
        .nullable()
        .references("id")
        .inTable("post_images")
        .onDelete("CASCADE");
      t.index(["post_image_id"]);
    });

    await knex.raw(`
      ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_check;
      ALTER TABLE reactions ADD CONSTRAINT reactions_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL AND post_image_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL AND post_image_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NULL AND post_image_id IS NOT NULL)
      )
    `);

    await knex.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS reactions_user_post_image_unique
      ON reactions (user_id, post_image_id)
      WHERE post_image_id IS NOT NULL
    `);
  }

  const hasNotificationImage = await knex.schema.hasColumn("notifications", "post_image_id");
  if (!hasNotificationImage) {
    await knex.schema.alterTable("notifications", (t) => {
      t.uuid("post_image_id")
        .nullable()
        .references("id")
        .inTable("post_images")
        .onDelete("CASCADE");
      t.index(["post_image_id"]);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasNotificationImage = await knex.schema.hasColumn("notifications", "post_image_id");
  if (hasNotificationImage) {
    await knex.schema.alterTable("notifications", (t) => {
      t.dropIndex(["post_image_id"]);
      t.dropColumn("post_image_id");
    });
  }

  const hasReactionImage = await knex.schema.hasColumn("reactions", "post_image_id");
  if (hasReactionImage) {
    await knex.raw("DROP INDEX IF EXISTS reactions_user_post_image_unique");
    await knex.raw(`
      ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_target_check;
      ALTER TABLE reactions ADD CONSTRAINT reactions_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)
      )
    `);
    await knex.schema.alterTable("reactions", (t) => {
      t.dropIndex(["post_image_id"]);
      t.dropColumn("post_image_id");
    });
  }
}
