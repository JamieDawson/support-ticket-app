import "dotenv/config";
import express from "express";
import { pool } from "./db";
import { analyzeTicket } from "./analyzeTicket";
import { analysisGraph } from "./graph/analysisGraph";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware to parse JSON
app.use(express.json());

// GET /api/tickets
app.get("/api/tickets", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tickets ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// POST /api/tickets
app.post("/api/tickets", async (req, res) => {
  try {
    const tickets = req.body; // array of { title: string; description: string }

    if (!Array.isArray(tickets)) {
      return res
        .status(400)
        .json({ error: "Body must be an array of tickets" });
    }

    const values: any[] = [];
    const placeholders: string[] = [];

    tickets.forEach((ticket, i) => {
      const base = i * 2;
      placeholders.push(`($${base + 1}, $${base + 2}, NOW())`);
      values.push(ticket.title, ticket.description);
    });

    const query = `
    INSERT INTO tickets (title, description, created_at)
    VALUES ${placeholders.join(",")}
    RETURNING *;
  `;

    const result = await pool.query(query, values);
    res.json(result.rows);
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
      // Convert to numbers to ensure type consistency
      const numericIds = ticketIds.map((id: any) => Number(id));
      const placeholders = numericIds
        .map((_: any, i: number) => `$${i + 1}`)
        .join(", ");
      ticketsQuery += ` WHERE id IN (${placeholders})`;
      params.push(...numericIds);
      console.log("Query:", ticketsQuery);
      console.log("Params:", params);
    }
    const ticketsResult = await pool.query(ticketsQuery, params);
    const tickets = ticketsResult.rows;
    console.log("Found tickets:", tickets.length);

    if (tickets.length === 0) {
      return res.status(400).json({ error: "No tickets found" });
    }

    // 2. Analyze each ticket first to calculate statistics
    const ticketUpdates: Array<{
      id: number;
      priority: string;
      category: string;
    }> = [];

    tickets.forEach((ticket) => {
      const { priority, category } = analyzeTicket(ticket.title, ticket.description);
      ticketUpdates.push({ id: ticket.id, priority, category });
    });

    // Calculate statistics
    const priorityCounts: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: number } = {};

    ticketUpdates.forEach((update) => {
      priorityCounts[update.priority] =
        (priorityCounts[update.priority] || 0) + 1;
      categoryCounts[update.category] =
        (categoryCounts[update.category] || 0) + 1;
    });

    // Build detailed summary
    const prioritySummary = Object.entries(priorityCounts)
      .map(([priority, count]) => `${count} ${priority}`)
      .join(", ");

    const categorySummary = Object.entries(categoryCounts)
      .map(([category, count]) => `${count} ${category}`)
      .join(", ");

    const summary = `Analyzed ${tickets.length} ticket(s). Priorities: ${prioritySummary}. Categories: ${categorySummary}.`;

    // 3. Create analysis run with detailed summary
    const runResult = await pool.query(
      `INSERT INTO analysis_runs (created_at, summary) VALUES (NOW(), $1) RETURNING *`,
      [summary]
    );
    const analysisRun = runResult.rows[0];

    // 4. Prepare ticket_analysis inserts
    const analysisValues: any[] = [];
    const placeholders: string[] = [];

    ticketUpdates.forEach((update, i) => {
      const ticket = tickets.find((t) => t.id === update.id);
      if (!ticket) return;

      placeholders.push(
        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${
          i * 5 + 5
        })`
      );
      analysisValues.push(
        analysisRun.id,
        ticket.id,
        update.category,
        update.priority,
        null // notes optional, keep null for now
      );
    });

    // 5. Update tickets table with priority and category
    for (const update of ticketUpdates) {
      await pool.query(
        `UPDATE tickets SET priority = $1, category = $2 WHERE id = $3`,
        [update.priority, update.category, update.id]
      );
    }

    const analysisQuery = `
      INSERT INTO ticket_analysis 
        (analysis_run_id, ticket_id, category, priority, notes)
      VALUES ${placeholders.join(",")}
      RETURNING *;
    `;

    const analysisResult = await pool.query(analysisQuery, analysisValues);

    const analyzedTicketIds = analysisResult.rows.map(
      (row: any) => row.ticket_id
    );
    const ticketDetailsResult = await pool.query(
      `SELECT id, title, description FROM tickets WHERE id = ANY($1::int[])`,
      [analyzedTicketIds]
    );

    // Combine analysis with ticket details
    const ticketAnalysisWithDetails = analysisResult.rows.map((analysis) => {
      const ticket = ticketDetailsResult.rows.find(
        (t) => t.id === analysis.ticket_id
      );
      return {
        ...analysis,
        title: ticket?.title || "",
        description: ticket?.description || "",
      };
    });

    // Fetch updated analysis run
    const updatedRunResult = await pool.query(
      `SELECT * FROM analysis_runs WHERE id = $1`,
      [analysisRun.id]
    );

    res.json({
      analysisRun: updatedRunResult.rows[0],
      ticketAnalysis: ticketAnalysisWithDetails,
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
