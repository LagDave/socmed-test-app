import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const connection = process.env.DATABASE_URL || {
  host: process.env.PGHOST || "127.0.0.1",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "socmed",
  password: process.env.PGPASSWORD || "socmed",
  database: process.env.PGDATABASE || "socmed_dev",
};

const shared: Knex.Config = {
  client: "pg",
  connection,
  migrations: {
    directory: "./database/migrations",
    extension: "ts",
  },
  seeds: {
    directory: "./database/seeds",
  },
};

const config: { [key: string]: Knex.Config } = {
  development: shared,
  production: shared,
};

export default config;
