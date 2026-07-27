import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("posts", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("author_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.text("body").notNullable();
    t.string("image_url", 500).nullable();
    t.timestamps(true, true);
    t.index(["created_at"]);
    t.index(["author_id", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("posts");
}
