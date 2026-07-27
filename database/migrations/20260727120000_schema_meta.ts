import type { Knex } from "knex";

/** Scaffold smoke migration — domain tables land in later plans. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("schema_meta", (t) => {
    t.increments("id").primary();
    t.string("key").notNullable().unique();
    t.string("value").notNullable();
    t.timestamps(true, true);
  });
  await knex("schema_meta").insert({ key: "app", value: "socmed-test-app" });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("schema_meta");
}
