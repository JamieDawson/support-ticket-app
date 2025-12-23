import React from 'react';
import './TicketList.css';

function TicketList({ tickets, selectedTickets, onToggleSelection }) {
  if (tickets.length === 0) {
    return (
      <div className="empty-state">
        <p>No tickets yet. Create your first ticket above!</p>
      </div>
    );
  }

  return (
    <div className="ticket-list">
      {tickets.map(ticket => (
        <div
          key={ticket.id}
          className={`ticket-item ${selectedTickets.includes(ticket.id) ? 'selected' : ''}`}
          onClick={() => onToggleSelection(ticket.id)}
        >
          <div className="ticket-checkbox">
            <input
              type="checkbox"
              checked={selectedTickets.includes(ticket.id)}
              onChange={() => onToggleSelection(ticket.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="ticket-content">
            <div className="ticket-header">
              <h3 className="ticket-title">{ticket.title}</h3>
              {ticket.priority && (
                <span className={`priority-badge priority-${ticket.priority}`}>
                  {ticket.priority}
                </span>
              )}
              {ticket.category && (
                <span className="category-badge">{ticket.category}</span>
              )}
            </div>
            <p className="ticket-description">
              {ticket.description.length > 150
                ? `${ticket.description.substring(0, 150)}...`
                : ticket.description}
            </p>
            <div className="ticket-meta">
              <span className="ticket-id">ID: {ticket.id}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TicketList;

