const API_BASE_URL = 'http://localhost:5000/api';

class HistoryApp {
  constructor() {
    this.historyContainer = document.getElementById('stickyNotesHistory');
    this.deleteHistoryBtn = document.getElementById('deleteHistoryBtn');
    this.backToCanvasBtn = document.getElementById('backToCanvas');

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadStickyNotesHistory();
  }

  setupEventListeners() {
    this.deleteHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all sticky notes? This action cannot be undone.')) {
        this.deleteAllHistory();
      }
    });

    this.backToCanvasBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  async loadStickyNotesHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/stickynotes`);
      if (response.ok) {
        const notes = await response.json();
        this.renderHistory(notes);
      }
    } catch (error) {
      console.error('Error loading sticky notes history:', error);
      this.historyContainer.innerHTML = '<p class="error">Error loading confessions. Please try again later.</p>';
    }
  }

  renderHistory(notes) {
    if (notes.length === 0) {
      this.historyContainer.innerHTML = '<p class="no-confessions">No confessions yet. Be the first to share!</p>';
      return;
    }

    // Sort by creation date (newest first)
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    this.historyContainer.innerHTML = '';

    notes.forEach(note => {
      const noteElement = this.createHistoryNoteElement(note);
      this.historyContainer.appendChild(noteElement);
    });
  }

  createHistoryNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = `history-note ${note.color}`;

    const content = note.content || '(Empty confession)';
    const timestamp = new Date(note.timestamp).toLocaleString();

    noteDiv.innerHTML = `
      <div class="history-note-content">${this.escapeHtml(content)}</div>
      <div class="history-note-meta">
        <span class="history-note-date">${timestamp}</span>
        <button class="delete-note-btn" data-id="${note.id}">Delete</button>
      </div>
    `;

    // Add delete functionality
    const deleteBtn = noteDiv.querySelector('.delete-note-btn');
    deleteBtn.addEventListener('click', () => {
      if (confirm('Delete this confession?')) {
        this.deleteNote(note.id);
      }
    });

    return noteDiv;
  }

  async deleteNote(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/stickynotes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.loadStickyNotesHistory(); // Reload the history
      } else {
        alert('Error deleting confession. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting confession. Please try again.');
    }
  }

  async deleteAllHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/stickynotes`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.loadStickyNotesHistory(); // Reload the history
      } else {
        alert('Error deleting all confessions. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting all history:', error);
      alert('Error deleting all confessions. Please try again.');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the history app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HistoryApp();
});