import React, { useState, useEffect } from 'react';
import './App.css';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import AnalysisResults from './components/AnalysisResults';

// API base URL - use environment variable or default to localhost for local dev
// In Docker, this should be set to http://backend:3001 or http://localhost:3001
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [tickets, setTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tickets`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  // Create a new ticket
  const handleCreateTicket = async (ticket) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([ticket]),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      const newTickets = await response.json();
      setTickets([...tickets, ...newTickets]);
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Analyze selected tickets
  const handleAnalyze = async () => {
    if (selectedTickets.length === 0) {
      alert('Please select at least one ticket to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketIds: selectedTickets,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze tickets');
      }

      const data = await response.json();
      setAnalysisResults(data);
      
      // Refresh tickets to get updated priority/category
      await fetchTickets();
      
      // Clear selection
      setSelectedTickets([]);
    } catch (error) {
      console.error('Error analyzing tickets:', error);
      alert('Failed to analyze tickets. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle ticket selection
  const toggleTicketSelection = (ticketId) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Support Ticket Analyst</h1>
      </header>
      
      <main className="App-main">
        <div className="container">
          <section className="ticket-form-section">
            <h2>Create New Ticket</h2>
            <TicketForm onSubmit={handleCreateTicket} loading={loading} />
          </section>

          <section className="ticket-list-section">
            <div className="section-header">
              <h2>Tickets</h2>
              {selectedTickets.length > 0 && (
                <button 
                  className="analyze-button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : `Analyze Selected (${selectedTickets.length})`}
                </button>
              )}
            </div>
            <TicketList
              tickets={tickets}
              selectedTickets={selectedTickets}
              onToggleSelection={toggleTicketSelection}
            />
          </section>

          {analysisResults && (
            <section className="analysis-results-section">
              <h2>Latest Analysis Results</h2>
              <AnalysisResults data={analysisResults} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

