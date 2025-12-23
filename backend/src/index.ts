import "dotenv/config";
import { pool } from "./db";

async function start() {
  try {
    const result = await pool.query("SELECT 1");
    console.log("DB connected:", result.rows);
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
}

start();
