import React, { useState } from 'react';
import './TicketForm.css';

function TicketForm({ onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    onSubmit({ title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="ticket-form">
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter ticket title"
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter ticket description"
          rows="4"
          disabled={loading}
          required
        />
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Creating...' : 'Add Ticket'}
      </button>
    </form>
  );
}

export default TicketForm;

