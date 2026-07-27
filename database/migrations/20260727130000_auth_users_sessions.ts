import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("email", 255).notNullable().unique();
    t.string("password_hash", 255).notNullable();
    t.string("display_name", 100).notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("sessions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("token_hash", 128).notNullable().unique();
    t.timestamp("expires_at").notNullable();
    t.timestamps(true, true);
    t.index(["user_id"]);
    t.index(["expires_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("sessions");
  await knex.schema.dropTableIfExists("users");
}
