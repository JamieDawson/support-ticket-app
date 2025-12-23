CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  summary TEXT
);

CREATE TABLE IF NOT EXISTS ticket_analysis (
  id SERIAL PRIMARY KEY,
  analysis_run_id INTEGER REFERENCES analysis_runs(id) ON DELETE CASCADE,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  category TEXT,
  priority TEXT,
  notes TEXT
);
