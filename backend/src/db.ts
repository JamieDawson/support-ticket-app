import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "postgres",
  user: process.env.POSTGRES_USER ?? "postgres",
  password: process.env.POSTGRES_PASSWORD ?? "postgres",
  database: process.env.POSTGRES_DB ?? "support_db",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
});
