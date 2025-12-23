import "dotenv/config";
import express from "express";
import { pool } from "./db";
import { analyzeTicket } from "./analyzeTicket";
import { ticketGraph } from "./graph/ticketGraph";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON
app.use(express.json());

// POST /api/tickets
app.post("/api/tickets", async (req, res) => {
  try {
    const tickets = req.body;

    const result = await ticketGraph.invoke({
      tickets,
    });

    res.json(result.analyzedTickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process tickets" });
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
