import knex, { type Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const connection = process.env.DATABASE_URL || {
  host: process.env.PGHOST || "127.0.0.1",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "socmed",
  password: process.env.PGPASSWORD || "socmed",
  database: process.env.PGDATABASE || "socmed_dev",
};

export const db: Knex = knex({
  client: "pg",
  connection,
  pool: { min: 0, max: 10 },
});
