import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("friendships", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_a").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.uuid("user_b").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.uuid("requester_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.enum("status", ["pending", "accepted", "declined"], {
      useNative: true,
      enumName: "friendship_status",
    }).notNullable().defaultTo("pending");
    t.timestamps(true, true);
    t.unique(["user_a", "user_b"]);
    t.index(["requester_id"]);
    t.index(["status"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("friendships");
  await knex.raw("DROP TYPE IF EXISTS friendship_status");
}
