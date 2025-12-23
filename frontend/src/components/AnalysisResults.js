import React from 'react';
import './AnalysisResults.css';

function AnalysisResults({ data }) {
  if (!data || !data.ticketAnalysis) {
    return <p>No analysis results available.</p>;
  }

  return (
    <div className="analysis-results">
      {data.analysisRun && (
        <div className="analysis-summary">
          <h3>Summary</h3>
          <p>{data.analysisRun.summary}</p>
          <p className="analysis-date">
            Analyzed on: {new Date(data.analysisRun.created_at).toLocaleString()}
          </p>
        </div>
      )}

      <div className="ticket-analysis-list">
        <h3>Ticket Analysis</h3>
        {data.ticketAnalysis.map((analysis) => (
          <div key={analysis.id} className="analysis-item">
            <div className="analysis-header">
              <h4>{analysis.title}</h4>
              <div className="analysis-badges">
                <span className={`priority-badge priority-${analysis.priority}`}>
                  {analysis.priority}
                </span>
                <span className="category-badge">{analysis.category}</span>
              </div>
            </div>
            <p className="analysis-description">{analysis.description}</p>
            {analysis.notes && (
              <div className="analysis-notes">
                <strong>Notes:</strong> {analysis.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalysisResults;

