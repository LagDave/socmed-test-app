import type { Knex } from "knex";

const FRIENDSHIP_STATUS_USER_A_INDEX = "friendships_status_user_a_index";
const FRIENDSHIP_STATUS_USER_B_INDEX = "friendships_status_user_b_index";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("friendships", (table) => {
    table.index(["status", "user_a"], FRIENDSHIP_STATUS_USER_A_INDEX);
    table.index(["status", "user_b"], FRIENDSHIP_STATUS_USER_B_INDEX);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("friendships", (table) => {
    table.dropIndex(["status", "user_a"], FRIENDSHIP_STATUS_USER_A_INDEX);
    table.dropIndex(["status", "user_b"], FRIENDSHIP_STATUS_USER_B_INDEX);
  });
}
