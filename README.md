# Support Ticket Analyst

A simple app to analyze support tickets - categorize them and assign priorities. Built with React, Node.js, PostgreSQL, and Docker.

## Quick Start

### What You Need

- Docker Desktop installed and running

### Setup

1. **Create the environment file**

   - Go to the `backend` folder
   - Create a file named `.env`
   - Paste this in:
     ```
     POSTGRES_HOST=postgres
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=postgres
     POSTGRES_DB=support_db
     POSTGRES_PORT=5432
     PORT=3001
     ```

2. **Start everything**

   ```bash
   docker compose up --build
   ```

   Wait a couple minutes for everything to start up. You'll know it's ready when you see "Server running on http://localhost:3001" and "webpack compiled successfully".

3. **Open the app**
   - Go to http://localhost:3000 in your browser
   - Create a ticket, then analyze it!

## How It Works

- **Create tickets** with a title and description
- **Select tickets** you want to analyze
- **Click "Analyze Selected"** to get priority (high/low) and category (billing/general)
- **View results** showing the analysis summary and breakdown

## Testing Examples

Here are some ticket examples to test different combinations:

**High Priority + Billing:**

- Title: `Urgent billing issue`
- Description: `I need help with my bill immediately`

**High Priority + General:**

- Title: `Urgent bug fix needed`
- Description: `The app crashes when I click login`

**Low Priority + Billing:**

- Title: `Billing question`
- Description: `Can you explain my invoice from last month?`

**Low Priority + General:**

- Title: `Minor UI bug`
- Description: `Button alignment is slightly off on mobile`

**Testing Tips:**

- "urgent" anywhere (title or description) = HIGH priority
- "billing" anywhere (title or description) = billing category
- No "urgent" = LOW priority
- No "billing" = general category

## API Endpoints

- `POST /api/tickets` - Create tickets (body: array of `{title, description}`)
- `GET /api/tickets` - Get all tickets
- `POST /api/analyze` - Analyze tickets (body: optional `{ticketIds: [1,2,3]}`)
- `GET /api/analysis/latest` - Get latest analysis results

## Tech Stack

- Frontend: React
- Backend: Node.js/TypeScript, Express
- Database: PostgreSQL
- Agent: LangGraph (structure exists, currently using direct calls for simplicity)

## Notes

- The analysis uses keyword matching (not a real LLM) - looks for "urgent" for high priority, "billing" for billing category
- LangGraph agent structure is in `backend/src/graph/analysisGraph.ts` but not fully integrated yet
- Database schema auto-creates on first run via `init.sql`

## Stopping the App

Press `Ctrl+C` in the terminal, then run:

```bash
docker compose down
```
