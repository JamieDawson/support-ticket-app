import "dotenv/config";
import express from "express";
import { pool } from "./db";
import { analyzeTicket } from "./analyzeTicket";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON
app.use(express.json());

// POST /api/tickets
app.post("/api/tickets", async (req, res) => {
  try {
    const tickets = req.body;

    if (!Array.isArray(tickets)) {
      return res.status(400).json({ error: "Request body must be an array" });
    }

    const values: any[] = [];
    const placeholders: string[] = [];

    tickets.forEach((ticket, i) => {
      const { priority, category } = analyzeTicket(ticket.description);

      const baseIndex = i * 4;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
          baseIndex + 4
        })`
      );

      values.push(ticket.title, ticket.description, priority, category);
    });

    const query = `
      INSERT INTO tickets (title, description, priority, category)
      VALUES ${placeholders.join(",")}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert tickets" });
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
