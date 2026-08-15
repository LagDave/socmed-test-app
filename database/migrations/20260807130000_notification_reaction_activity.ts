import type { Knex } from "knex";

const REACTION_POST_INDEX = "notifications_reaction_post_unique";
const REACTION_COMMENT_INDEX = "notifications_reaction_comment_unique";
const REACTION_PHOTO_INDEX = "notifications_reaction_photo_unique";

export async function up(knex: Knex): Promise<void> {
  const hasReactionEmoji = await knex.schema.hasColumn("notifications", "reaction_emoji");
  if (!hasReactionEmoji) {
    await knex.schema.alterTable("notifications", (table) => {
      table.specificType("reaction_emoji", "reaction_emoji").nullable();
    });
  }

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS ${REACTION_POST_INDEX}
    ON notifications (recipient_id, actor_id, type, post_id)
    WHERE type = 'reaction_on_post' AND post_id IS NOT NULL
  `);
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS ${REACTION_COMMENT_INDEX}
    ON notifications (recipient_id, actor_id, type, comment_id)
    WHERE type = 'reaction_on_comment' AND comment_id IS NOT NULL
  `);
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS ${REACTION_PHOTO_INDEX}
    ON notifications (recipient_id, actor_id, type, post_image_id)
    WHERE type = 'reaction_on_photo' AND post_image_id IS NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${REACTION_POST_INDEX}`);
  await knex.raw(`DROP INDEX IF EXISTS ${REACTION_COMMENT_INDEX}`);
  await knex.raw(`DROP INDEX IF EXISTS ${REACTION_PHOTO_INDEX}`);

  const hasReactionEmoji = await knex.schema.hasColumn("notifications", "reaction_emoji");
  if (hasReactionEmoji) {
    await knex.schema.alterTable("notifications", (table) => {
      table.dropColumn("reaction_emoji");
    });
  }
}
