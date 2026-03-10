/**
 * Client-side Collaborative Sync
 * Synchronizes sticky notes in real-time with other users
 */

class CollaborativeSync {
  constructor(app) {
    this.app = app;
    this.socket = null;
    this.userId = this.generateUserId();
    this.userName = localStorage.getItem('userName') || `User ${this.userId.substring(0, 5)}`;
    this.sessionId = this.generateSessionId();
    this.remoteUsers = new Map(); // userId -> user info
    this.remoteCursors = new Map(); // userId -> cursor position
    this.isConnected = false;
    this.pendingUpdates = []; // Queue for updates while disconnected
    this.lastUpdateTimestamps = new Map(); // Track update times for conflict resolution
    
    this.init();
  }

  /**
   * Initialize connection and listeners
   */
  init() {
    // Load socket.io client library
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
    script.onload = () => {
      this.connect();
    };
    document.head.appendChild(script);
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    this.socket = io();

    // Connection established
    this.socket.on('connect', () => {
      console.log(`[Collab] Connected to server: ${this.socket.id}`);
      this.isConnected = true;

      // Join collaboration session
      this.socket.emit('user-join', {
        userId: this.userId,
        userName: this.userName,
        sessionId: this.sessionId
      });

      // Flush pending updates
      this.flushPendingUpdates();
    });

    // Listen for other users joining
    this.socket.on('user-joined', (data) => {
      console.log(`[Collab] User joined: ${data.userName}`);
      this.updateRemoteUsers(data.activeUsers);
      this.showPresenceNotification(`${data.userName} joined`, 'success');
    });

    // Listen for user leaving
    this.socket.on('user-left', (data) => {
      console.log(`[Collab] User left: ${data.userName}`);
      this.remoteUsers.delete(data.socketId);
      this.remoteCursors.delete(data.socketId);
      this.updateRemoteUsers(data.activeUsers);
      this.showPresenceNotification(`${data.userName} left`, 'info');
      this.removeCursorIndicator(data.socketId);
    });

    // Receive initial sync state
    this.socket.on('sync-state', (data) => {
      console.log(`[Collab] Received sync state with ${data.notes.length} notes`);
      this.handleSyncState(data);
    });

    // Listen for remote note creation
    this.socket.on('note-created', (data) => {
      if (this.socket.id !== this.socket.id) { // Not from self
        console.log(`[Collab] Remote note created: ${data.id}`);
        this.handleRemoteNoteCreate(data);
      }
    });

    // Listen for remote note updates
    this.socket.on('note-updated', (data) => {
      console.log(`[Collab] Remote note updated: ${data.id}`);
      this.handleRemoteNoteUpdate(data);
    });

    // Listen for remote note deletion
    this.socket.on('note-deleted', (data) => {
      console.log(`[Collab] Remote note deleted: ${data.id}`);
      this.handleRemoteNoteDelete(data);
    });

    // Listen for remote cursor positions
    this.socket.on('user-cursor', (data) => {
      this.handleRemoteCursor(data);
    });

    // Connection lost
    this.socket.on('disconnect', () => {
      console.log('[Collab] Disconnected from server');
      this.isConnected = false;
      this.showPresenceNotification('Connection lost. Changes will sync when reconnected.', 'warning');
    });

    // Request full sync
    this.socket.emit('request-sync');
  }

  /**
   * Update remote users list and show presence
   */
  updateRemoteUsers(activeUsers) {
    this.remoteUsers.clear();
    activeUsers.forEach(user => {
      if (user.socketId !== this.socket.id) {
        this.remoteUsers.set(user.socketId, user);
      }
    });
    this.updatePresenceIndicator();
  }

  /**
   * Handle initial sync state from server
   */
  handleSyncState(data) {
    // Don't load notes from sync - they're loaded from API
    // This is just for awareness of active users
    this.updateRemoteUsers(data.activeUsers);
  }

  /**
   * Handle remote note creation
   */
  handleRemoteNoteCreate(data) {
    const { id, content, x, y, width, height, color, timestamp } = data;
    
    // Check if note already exists locally
    const existingNote = this.app.stickyNotes.find(n => n.id === id);
    if (existingNote) {
      return; // Already created locally
    }

    // Create remote note
    const noteElement = this.createRemoteNoteElement({
      id, content, x, y, width, height, color
    });

    this.app.canvas.appendChild(noteElement);
    this.app.stickyNotes.push({ id, content, x, y, width, height, color });
    this.lastUpdateTimestamps.set(id, timestamp);

    console.log(`[Collab] Remote note created and displayed: ${id}`);
  }

  /**
   * Handle remote note update
   */
  handleRemoteNoteUpdate(data) {
    const { id, content, x, y, width, height, color, timestamp } = data;

    // Check timestamp for conflict resolution
    const lastTimestamp = this.lastUpdateTimestamps.get(id);
    if (lastTimestamp && timestamp < lastTimestamp) {
      return; // Ignore stale updates
    }

    const noteElement = document.querySelector(`[data-id="${id}"]`);
    if (!noteElement) {
      return; // Note not found
    }

    // Update visual position
    noteElement.style.left = x + 'px';
    noteElement.style.top = y + 'px';
    noteElement.style.width = width + 'px';
    noteElement.style.height = height + 'px';
    noteElement.style.backgroundColor = color;

    // Update textarea if not in edit mode
    if (document.activeElement !== noteElement.querySelector('textarea')) {
      const textarea = noteElement.querySelector('textarea');
      if (textarea) {
        textarea.value = content;
      }
    }

    // Update app state
    const note = this.app.stickyNotes.find(n => n.id === id);
    if (note) {
      note.content = content;
      note.x = x;
      note.y = y;
      note.width = width;
      note.height = height;
      note.color = color;
    }

    this.lastUpdateTimestamps.set(id, timestamp);
    console.log(`[Collab] Remote note updated: ${id}`);
  }

  /**
   * Handle remote note deletion
   */
  handleRemoteNoteDelete(data) {
    const { id } = data;

    const noteElement = document.querySelector(`[data-id="${id}"]`);
    if (noteElement) {
      noteElement.remove();
    }

    // Remove from app state
    this.app.stickyNotes = this.app.stickyNotes.filter(n => n.id !== id);
    this.lastUpdateTimestamps.delete(id);

    console.log(`[Collab] Remote note deleted: ${id}`);
  }

  /**
   * Handle remote cursor position
   */
  handleRemoteCursor(data) {
    const { userId, userName, x, y } = data;

    // Update cursor tracking
    this.remoteCursors.set(userId, { x, y, userName });

    // Show cursor indicator
    this.showCursorIndicator(userId, userName, x, y);
  }

  /**
   * Emit note creation to other clients
   */
  emitNoteCreate(noteData) {
    if (!this.isConnected) {
      this.pendingUpdates.push({ type: 'create', data: noteData });
      return;
    }

    this.socket.emit('note-create', {
      ...noteData,
      timestamp: Date.now()
    });
  }

  /**
   * Emit note update to other clients
   */
  emitNoteUpdate(noteData) {
    if (!this.isConnected) {
      this.pendingUpdates.push({ type: 'update', data: noteData });
      return;
    }

    this.socket.emit('note-update', {
      ...noteData,
      timestamp: Date.now()
    });
  }

  /**
   * Emit note deletion to other clients
   */
  emitNoteDelete(noteId) {
    if (!this.isConnected) {
      this.pendingUpdates.push({ type: 'delete', data: { id: noteId } });
      return;
    }

    this.socket.emit('note-delete', {
      id: noteId,
      timestamp: Date.now()
    });
  }

  /**
   * Emit cursor position
   */
  emitCursorPosition(x, y) {
    if (this.isConnected) {
      this.socket.emit('cursor-move', { x, y });
    }
  }

  /**
   * Flush pending updates when reconnected
   */
  flushPendingUpdates() {
    console.log(`[Collab] Flushing ${this.pendingUpdates.length} pending updates`);
    
    this.pendingUpdates.forEach(update => {
      switch (update.type) {
        case 'create':
          this.socket.emit('note-create', { ...update.data, timestamp: Date.now() });
          break;
        case 'update':
          this.socket.emit('note-update', { ...update.data, timestamp: Date.now() });
          break;
        case 'delete':
          this.socket.emit('note-delete', { ...update.data, timestamp: Date.now() });
          break;
      }
    });

    this.pendingUpdates = [];
  }

  /**
   * Create remote note element from data
   */
  createRemoteNoteElement(noteData) {
    const { id, content, x, y, width, height, color } = noteData;

    const noteElement = document.createElement('div');
    noteElement.className = 'sticky-note';
    noteElement.dataset.id = id;
    noteElement.style.left = x + 'px';
    noteElement.style.top = y + 'px';
    noteElement.style.width = width + 'px';
    noteElement.style.height = height + 'px';
    noteElement.style.backgroundColor = color;
    noteElement.style.opacity = '0.9';

    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.border = 'none';
    textarea.style.padding = '5px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.resize = 'none';
    textarea.style.fontFamily = 'Arial, sans-serif';
    textarea.style.fontSize = '14px';
    textarea.style.color = '#333';
    textarea.disabled = true; // Remote notes are read-only
    textarea.style.opacity = '0.8';

    noteElement.appendChild(textarea);
    return noteElement;
  }

  /**
   * Show cursor indicator for remote user
   */
  showCursorIndicator(userId, userName, x, y) {
    let cursor = document.getElementById(`cursor-${userId}`);

    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = `cursor-${userId}`;
      cursor.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 999;
        font-size: 12px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        white-space: nowrap;
      `;
      document.body.appendChild(cursor);
    }

    cursor.style.left = x + 'px';
    cursor.style.top = (y - 20) + 'px';
    cursor.textContent = userName;

    // Add cursor arrow
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: fixed;
      width: 2px;
      height: 12px;
      background: rgba(100,150,255,0.8);
      pointer-events: none;
      z-index: 998;
    `;
    arrow.style.left = x + 'px';
    arrow.style.top = (y - 12) + 'px';
    document.body.appendChild(arrow);

    // Clean up arrow after timeout
    setTimeout(() => arrow.remove(), 100);
  }

  /**
   * Remove cursor indicator
   */
  removeCursorIndicator(userId) {
    const cursor = document.getElementById(`cursor-${userId}`);
    if (cursor) {
      cursor.remove();
    }
  }

  /**
   * Update presence indicator
   */
  updatePresenceIndicator() {
    let presenceBar = document.getElementById('presence-bar');

    if (!presenceBar) {
      presenceBar = document.createElement('div');
      presenceBar.id = 'presence-bar';
      presenceBar.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 10px;
        background: rgba(255,255,255,0.95);
        border: 2px solid #4287f5;
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
      document.body.appendChild(presenceBar);
    }

    const activeCount = this.remoteUsers.size + 1; // +1 for current user
    const users = Array.from(this.remoteUsers.values()).map(u => u.userName);

    presenceBar.innerHTML = `
      <div><strong>👥 Active Users (${activeCount})</strong></div>
      <div style="margin-top: 5px; color: green;">● You</div>
      ${users.map(name => `<div style="color: blue;">● ${name}</div>`).join('')}
    `;
  }

  /**
   * Show presence notification
   */
  showPresenceNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
      success: '#4caf50',
      warning: '#ff9800',
      info: '#2196f3'
    };

    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 10px;
      background: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Generate unique user ID
   */
  generateUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}

// Initialize collaboration when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof app !== 'undefined') {
        window.collaborativeSync = new CollaborativeSync(app);
      }
    }, 500);
  });
} else {
  if (typeof app !== 'undefined') {
    window.collaborativeSync = new CollaborativeSync(app);
  }
}
