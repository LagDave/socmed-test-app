import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
}

export async function down(_knex: Knex): Promise<void> {
  // leave extension installed
}
