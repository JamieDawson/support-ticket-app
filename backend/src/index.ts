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

// POST /api/analyze
app.post("/api/analyze", async (req, res) => {
  try {
    const { ticketIds } = req.body; // optional array of IDs

    // 1. Fetch tickets
    let ticketsQuery = "SELECT * FROM tickets";
    const params: any[] = [];
    if (ticketIds && ticketIds.length) {
      ticketsQuery += ` WHERE id = ANY($1)`;
      params.push(ticketIds);
    }
    const ticketsResult = await pool.query(ticketsQuery, params);
    const tickets = ticketsResult.rows;

    if (tickets.length === 0) {
      return res.status(400).json({ error: "No tickets found" });
    }

    // 2. Create analysis run
    const runResult = await pool.query(
      `INSERT INTO analysis_runs (created_at, summary) VALUES (NOW(), $1) RETURNING *`,
      [`Analyzed ${tickets.length} ticket(s)`]
    );
    const analysisRun = runResult.rows[0];

    // 3. Analyze each ticket & insert into ticket_analysis
    const analysisValues: any[] = [];
    const placeholders: string[] = [];

    tickets.forEach((ticket, i) => {
      const { priority, category } = analyzeTicket(ticket.description);
      placeholders.push(
        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${
          i * 5 + 5
        })`
      );
      analysisValues.push(
        analysisRun.id,
        ticket.id,
        category,
        priority,
        null // notes optional, keep null for now
      );
    });

    const analysisQuery = `
      INSERT INTO ticket_analysis 
        (analysis_run_id, ticket_id, category, priority, notes)
      VALUES ${placeholders.join(",")}
      RETURNING *;
    `;

    const analysisResult = await pool.query(analysisQuery, analysisValues);

    res.json({
      analysisRun,
      ticketAnalysis: analysisResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to run analysis" });
  }
});

// GET /api/analysis/latest
app.get("/api/analysis/latest", async (req, res) => {
  try {
    const latestRunResult = await pool.query(
      `SELECT * FROM analysis_runs ORDER BY created_at DESC LIMIT 1`
    );
    const latestRun = latestRunResult.rows[0];
    if (!latestRun) return res.json({ analysisRun: null, ticketAnalysis: [] });

    const ticketAnalysisResult = await pool.query(
      `SELECT ta.*, t.title, t.description
       FROM ticket_analysis ta
       JOIN tickets t ON t.id = ta.ticket_id
       WHERE ta.analysis_run_id = $1`,
      [latestRun.id]
    );

    res.json({
      analysisRun: latestRun,
      ticketAnalysis: ticketAnalysisResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch latest analysis" });
  }
});

// Test DB connection on start
//Avoids the connection happening too fast which can cause an issue for Docker.
async function start() {
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await pool.query("SELECT 1");
      console.log("DB connected");

      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
      return; // success, exit the loop
    } catch (err) {
      retries++;
      console.log(
        `DB not ready yet. Retrying in 2s... (${retries}/${maxRetries})`
      );
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  console.error("DB connection failed after max retries");
  process.exit(1);
}

start();
