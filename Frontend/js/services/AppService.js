/**
 * AppService - Centralized service for all API calls and data management
 * Singleton pattern - only one instance
 */
class AppService {
  constructor() {
    if (AppService.instance) {
      return AppService.instance;
    }
    
    this.baseUrl = '/api';
    this.stickyNotes = [];
    this.confessions = [];
    AppService.instance = this;
  }

  /**
   * Fetch all sticky notes from backend
   */
  async fetchStickyNotes() {
    try {
      const response = await fetch(`${this.baseUrl}/stickynotes`);
      if (!response.ok) throw new Error('Failed to fetch sticky notes');
      
      this.stickyNotes = await response.json();
      console.log('Fetched sticky notes:', this.stickyNotes.length);
      return this.stickyNotes;
    } catch (error) {
      console.error('Error fetching sticky notes:', error);
      return [];
    }
  }

  /**
   * Create a new sticky note
   */
  async createStickyNote(data) {
    try {
      const response = await fetch(`${this.baseUrl}/stickynotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to create sticky note');
      
      const note = await response.json();
      this.stickyNotes.push(note);
      console.log('Created sticky note:', note.id);
      return note;
    } catch (error) {
      console.error('Error creating sticky note:', error);
      throw error;
    }
  }

  /**
   * Update sticky note
   */
  async updateStickyNote(id, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/stickynotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update sticky note');
      
      const updated = await response.json();
      
      // Update local cache
      const index = this.stickyNotes.findIndex(n => n.id === id);
      if (index !== -1) {
        this.stickyNotes[index] = { ...this.stickyNotes[index], ...updates };
      }
      
      console.log(`Updated sticky note ${id}:`, updates);
      return updated;
    } catch (error) {
      console.error('Error updating sticky note:', error);
      throw error;
    }
  }

  /**
   * Delete sticky note
   */
  async deleteStickyNote(id) {
    try {
      const response = await fetch(`${this.baseUrl}/stickynotes/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete sticky note');
      
      this.stickyNotes = this.stickyNotes.filter(n => n.id !== id);
      console.log('Deleted sticky note:', id);
      return true;
    } catch (error) {
      console.error('Error deleting sticky note:', error);
      throw error;
    }
  }

  /**
   * Fetch all confessions
   */
  async fetchConfessions() {
    try {
      const response = await fetch(`${this.baseUrl}/confessions`);
      if (!response.ok) throw new Error('Failed to fetch confessions');
      
      this.confessions = await response.json();
      console.log('Fetched confessions:', this.confessions.length);
      return this.confessions;
    } catch (error) {
      console.error('Error fetching confessions:', error);
      return [];
    }
  }

  /**
   * Create a new confession
   */
  async createConfession(data) {
    try {
      const response = await fetch(`${this.baseUrl}/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to create confession');
      
      const confession = await response.json();
      this.confessions.push(confession);
      console.log('Created confession:', confession.id);
      return confession;
    } catch (error) {
      console.error('Error creating confession:', error);
      throw error;
    }
  }

  /**
   * Get sticky note by ID
   */
  getStickyNoteById(id) {
    return this.stickyNotes.find(n => n.id === id);
  }

  /**
   * Get confessions for sticky note ID
   */
  getConfessionsForNote(noteId) {
    return this.confessions.filter(c => c.stickyNoteId === noteId);
  }

  /**
   * Check if note has confession
   */
  noteHasConfession(noteId) {
    return this.confessions.some(c => c.stickyNoteId === noteId);
  }
}

// Singleton instance
window.AppService = new AppService();
