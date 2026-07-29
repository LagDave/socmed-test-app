import type { Knex } from "knex";

const COMPOSITE_INDEX = "comments_post_id_parent_id_created_at_index";
const LEGACY_PARENT_INDEX = "comments_parent_id_index";

async function indexExists(knex: Knex, indexName: string): Promise<boolean> {
  const result = await knex.raw<{ rows: Array<{ exists: boolean }> }>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_indexes
       WHERE schemaname = 'public'
         AND tablename = 'comments'
         AND indexname = ?
     ) AS exists`,
    [indexName]
  );
  return Boolean(result.rows[0]?.exists);
}

export async function up(knex: Knex): Promise<void> {
  const hasParentId = await knex.schema.hasColumn("comments", "parent_id");
  if (!hasParentId) {
    await knex.schema.alterTable("comments", (t) => {
      t.uuid("parent_id")
        .nullable()
        .references("id")
        .inTable("comments")
        .onDelete("CASCADE");
    });
  }

  // Prod drift: a lone parent_id index was added outside this migration.
  if (await indexExists(knex, LEGACY_PARENT_INDEX)) {
    await knex.raw(`DROP INDEX IF EXISTS ${LEGACY_PARENT_INDEX}`);
  }

  if (!(await indexExists(knex, COMPOSITE_INDEX))) {
    await knex.schema.alterTable("comments", (t) => {
      t.index(["post_id", "parent_id", "created_at"]);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasParentId = await knex.schema.hasColumn("comments", "parent_id");
  if (!hasParentId) {
    return;
  }

  if (await indexExists(knex, COMPOSITE_INDEX)) {
    await knex.schema.alterTable("comments", (t) => {
      t.dropIndex(["post_id", "parent_id", "created_at"]);
    });
  }

  await knex.schema.alterTable("comments", (t) => {
    t.dropColumn("parent_id");
  });
}
