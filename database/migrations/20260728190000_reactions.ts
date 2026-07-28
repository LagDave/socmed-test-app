import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("reactions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.uuid("post_id").nullable().references("id").inTable("posts").onDelete("CASCADE");
    t.uuid("comment_id").nullable().references("id").inTable("comments").onDelete("CASCADE");
    t.enum("emoji", ["like", "heart", "haha", "wow"], {
      useNative: true,
      enumName: "reaction_emoji",
    }).notNullable();
    t.timestamps(true, true);

    t.check(
      "(post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)"
    );
    t.index(["post_id"]);
    t.index(["comment_id"]);
  });

  await knex.raw(`
    CREATE UNIQUE INDEX reactions_user_post_unique
    ON reactions (user_id, post_id)
    WHERE post_id IS NOT NULL
  `);
  await knex.raw(`
    CREATE UNIQUE INDEX reactions_user_comment_unique
    ON reactions (user_id, comment_id)
    WHERE comment_id IS NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("reactions");
  await knex.raw("DROP TYPE IF EXISTS reaction_emoji");
}
