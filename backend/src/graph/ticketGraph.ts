// backend/src/graph/ticketGraph.ts
import { StateGraph, Annotation } from "@langchain/langgraph";
import { analyzeTicket } from "../analyzeTicket";
import { pool } from "../db";

/* ---------- Types ---------- */

const GraphStateDefinition = {
  tickets: Annotation<Ticket[]>(),
  analyzedTickets: Annotation<TicketWithAnalysis[]>(),
};

export type Ticket = {
  title: string;
  description: string;
};

export type TicketWithAnalysis = Ticket & {
  priority: string;
  category: string;
};

type GraphState = {
  tickets: Ticket[];
  analyzedTickets?: TicketWithAnalysis[];
};

/* ---------- Nodes ---------- */

// Node 1: Analyze tickets
async function analyzeTickets(state: GraphState): Promise<Partial<GraphState>> {
  const analyzedTickets = state.tickets.map((ticket) => {
    const analysis = analyzeTicket(ticket.description);

    return {
      ...ticket,
      ...analysis,
    };
  });

  return { analyzedTickets };
}

// Node 2: Write to DB
async function writeTickets(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.analyzedTickets) return {};

  const values: any[] = [];
  const placeholders: string[] = [];

  state.analyzedTickets.forEach((t, i) => {
    const base = i * 4;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`
    );
    values.push(t.title, t.description, t.priority, t.category);
  });

  const query = `
      INSERT INTO tickets (title, description, priority, category)
      VALUES ${placeholders.join(",")}
      RETURNING *;
    `;

  const result = await pool.query(query, values);

  return { analyzedTickets: result.rows };
}

/* ---------- Graph ---------- */

const graph = new StateGraph(GraphStateDefinition)
  .addNode("analyze", analyzeTickets)
  .addNode("write", writeTickets)
  .addEdge("analyze", "write")
  .setEntryPoint("analyze");

export const ticketGraph = graph.compile();
