import React from 'react';
import './AnalysisResults.css';

function AnalysisResults({ data }) {
  if (!data || !data.ticketAnalysis) {
    return <p>No analysis results available.</p>;
  }

  // Calculate statistics from ticket analysis
  const priorityCounts = {
    high: 0,
    medium: 0,
    low: 0,
  };

  const categoryCounts = {
    billing: 0,
    general: 0,
  };

  data.ticketAnalysis.forEach((analysis) => {
    if (analysis.priority) {
      const priority = analysis.priority.toLowerCase();
      if (priorityCounts.hasOwnProperty(priority)) {
        priorityCounts[priority]++;
      }
    }
    if (analysis.category) {
      const category = analysis.category.toLowerCase();
      if (categoryCounts.hasOwnProperty(category)) {
        categoryCounts[category]++;
      }
    }
  });

  return (
    <div className="analysis-results">
      {data.analysisRun && (
        <div className="analysis-summary">
          <h3>Summary</h3>
          <p className="summary-text">{data.analysisRun.summary}</p>
          
          <div className="summary-stats">
            <div className="stats-section">
              <h4>Priority Breakdown</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">High Priority:</span>
                  <span className="stat-value">{priorityCounts.high}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Medium Priority:</span>
                  <span className="stat-value">{priorityCounts.medium}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Low Priority:</span>
                  <span className="stat-value">{priorityCounts.low}</span>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h4>Category Breakdown</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Billing:</span>
                  <span className="stat-value">{categoryCounts.billing}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">General:</span>
                  <span className="stat-value">{categoryCounts.general}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="analysis-date">
            Analyzed on: {new Date(data.analysisRun.created_at).toLocaleString()}
          </p>
        </div>
      )}

      <div className="ticket-analysis-list">
        <h3>Ticket Analysis ({data.ticketAnalysis.length} tickets)</h3>
        {data.ticketAnalysis.length === 0 ? (
          <p className="no-analysis">No ticket analysis available.</p>
        ) : (
          data.ticketAnalysis.map((analysis) => (
            <div key={analysis.id} className="analysis-item">
              <div className="analysis-header">
                <h4>{analysis.title || `Ticket #${analysis.ticket_id}`}</h4>
                <div className="analysis-badges">
                  {analysis.priority && (
                    <span className={`priority-badge priority-${analysis.priority}`}>
                      {analysis.priority}
                    </span>
                  )}
                  {analysis.category && (
                    <span className="category-badge">{analysis.category}</span>
                  )}
                </div>
              </div>
              {analysis.description && (
                <p className="analysis-description">{analysis.description}</p>
              )}
              {analysis.notes && (
                <div className="analysis-notes">
                  <strong>Notes:</strong> {analysis.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AnalysisResults;

