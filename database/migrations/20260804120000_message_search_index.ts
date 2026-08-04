import type { Knex } from "knex";

const MESSAGE_SEARCH_INDEX = "messages_search_body_trgm_index";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ${MESSAGE_SEARCH_INDEX}
    ON messages USING gin (body gin_trgm_ops)
    WHERE body IS NOT NULL AND unsent_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${MESSAGE_SEARCH_INDEX}`);
}
