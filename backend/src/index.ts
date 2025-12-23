import "dotenv/config";
import express from "express";
import { pool } from "./db";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON
app.use(express.json());

// POST /api/tickets
app.post("/api/tickets", async (req, res) => {
  console.log("POST /api/tickets");
  const tickets = req.body; // expecting [{ title, description }, ...]

  if (!Array.isArray(tickets)) {
    return res.status(400).json({ error: "Body must be an array of tickets" });
  }

  try {
    // Prepare a multi-row INSERT
    const values: any[] = [];
    const placeholders = tickets
      .map((ticket, i) => {
        const idx = i * 2;
        values.push(ticket.title, ticket.description);
        return `($${idx + 1}, $${idx + 2})`;
      })
      .join(",");

    const query = `INSERT INTO tickets (title, description) VALUES ${placeholders} RETURNING *`;
    const result = await pool.query(query, values);

    res.status(201).json(result.rows);
  } catch (err) {
    console.error("Failed to insert tickets:", err);
    res.status(500).json({ error: "DB insertion failed" });
  }
});

// Test DB connection on start
async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("DB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
}

start();
