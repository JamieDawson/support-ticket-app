// backend/src/graph/analysisGraph.ts
import { StateGraph, Annotation } from "@langchain/langgraph";
import { analyzeTicket } from "../analyzeTicket";
import { pool } from "../db";

/* ---------- Types ---------- */

const GraphStateDefinition = {
  ticketIds: Annotation<number[]>(),
  analysisRunId: Annotation<number>(),
  tickets: Annotation<any[]>(),
  analyzedTickets: Annotation<any[]>(),
};

type GraphState = {
  ticketIds: number[];
  analysisRunId?: number;
  tickets?: any[];
  analyzedTickets?: any[];
};

/* ---------- Nodes ---------- */

// Node 1: Fetch tickets from database
async function fetchTickets(state: GraphState): Promise<Partial<GraphState>> {
  let query = "SELECT * FROM tickets";
  const params: any[] = [];

  if (state.ticketIds && state.ticketIds.length > 0) {
    const placeholders = state.ticketIds.map((_, i) => `$${i + 1}`).join(", ");
    query += ` WHERE id IN (${placeholders})`;
    params.push(...state.ticketIds);
  }

  const result = await pool.query(query, params);
  return { tickets: result.rows };
}

// Node 2: Analyze tickets (categorize and prioritize)
async function analyzeTickets(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.tickets) return {};

  const analyzedTickets = state.tickets.map((ticket) => {
    const analysis = analyzeTicket(
      ticket.title || "",
      ticket.description || ""
    );
    return {
      ...ticket,
      priority: analysis.priority,
      category: analysis.category,
    };
  });

  return { analyzedTickets };
}

// Node 3: Write analysis results to database
async function writeAnalysis(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.analyzedTickets || !state.analysisRunId) return {};

  // Update tickets table with priority and category
  for (const ticket of state.analyzedTickets) {
    await pool.query(
      `UPDATE tickets SET priority = $1, category = $2 WHERE id = $3`,
      [ticket.priority, ticket.category, ticket.id]
    );
  }

  // Insert into ticket_analysis table
  const analysisValues: any[] = [];
  const placeholders: string[] = [];

  state.analyzedTickets.forEach((ticket, i) => {
    placeholders.push(
      `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, ${
        i * 5 + 5
      })`
    );
    analysisValues.push(
      state.analysisRunId,
      ticket.id,
      ticket.category,
      ticket.priority,
      null // notes
    );
  });

  if (placeholders.length > 0) {
    const query = `
      INSERT INTO ticket_analysis 
        (analysis_run_id, ticket_id, category, priority, notes)
      VALUES ${placeholders.join(",")}
      RETURNING *;
    `;
    await pool.query(query, analysisValues);
  }

  return {};
}

/* ---------- Graph ---------- */

const graph = new StateGraph(GraphStateDefinition)
  .addNode("fetchTickets", fetchTickets)
  .addNode("analyze", analyzeTickets)
  .addNode("writeAnalysis", writeAnalysis)
  .addEdge("fetchTickets", "analyze")
  .addEdge("analyze", "writeAnalysis")
  .setEntryPoint("fetchTickets");

export const analysisGraph = graph.compile();
