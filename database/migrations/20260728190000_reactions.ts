import type { Knex } from "knex";

/** Already applied on shared local DB from another branch; stub keeps Migrator happy. */
export async function up(_knex: Knex): Promise<void> {}

export async function down(_knex: Knex): Promise<void> {}
