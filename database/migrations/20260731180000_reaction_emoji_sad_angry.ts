import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TYPE reaction_emoji ADD VALUE IF NOT EXISTS 'sad'`);
  await knex.raw(`ALTER TYPE reaction_emoji ADD VALUE IF NOT EXISTS 'angry'`);
}

export async function down(_knex: Knex): Promise<void> {
  // PostgreSQL cannot remove enum values without recreating the type.
}
