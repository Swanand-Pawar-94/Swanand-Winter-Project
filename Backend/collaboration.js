/**
 * Collaborative Sync Manager
 * Handles real-time synchronization of sticky notes across multiple clients
 */

class CollaborativeSyncManager {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    this.activeSessions = new Map(); // userId -> session info
    this.noteTimestamps = new Map(); // Prevent conflicts with last-write-wins
    this.setupSocketEvents();
  }

  /**
   * Setup Socket.io event handlers
   */
  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log(`[Collab] User connected: ${socket.id}`);

      // User joins collaboration session
      socket.on('user-join', (data) => {
        this.handleUserJoin(socket, data);
      });

      // Note created on client side
      socket.on('note-create', (data) => {
        this.handleNoteCreate(socket, data);
      });

      // Note content/position updated
      socket.on('note-update', (data) => {
        this.handleNoteUpdate(socket, data);
      });

      // Note deleted
      socket.on('note-delete', (data) => {
        this.handleNoteDelete(socket, data);
      });

      // User cursor position for awareness
      socket.on('cursor-move', (data) => {
        this.handleCursorMove(socket, data);
      });

      // Request full sync (for new clients)
      socket.on('request-sync', () => {
        this.handleSyncRequest(socket);
      });

      // User leaves
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket);
      });
    });
  }

  /**
   * Handle user joining the session
   */
  handleUserJoin(socket, data) {
    const sessionId = data.sessionId || socket.id;
    const userId = data.userId || socket.id;
    const userName = data.userName || `User ${socket.id.substring(0, 5)}`;

    this.activeSessions.set(socket.id, {
      userId,
      userName,
      sessionId,
      joinedAt: Date.now(),
      socketId: socket.id,
      cursorX: 0,
      cursorY: 0
    });

    // Broadcast to all clients that a user joined
    this.io.emit('user-joined', {
      socketId: socket.id,
      userId,
      userName,
      activeUsers: Array.from(this.activeSessions.values())
    });

    console.log(`[Collab] ${userName} (${socket.id}) joined. Active users: ${this.activeSessions.size}`);

    // Send sync data to the new user
    this.handleSyncRequest(socket);
  }

  /**
   * Handle note creation
   */
  handleNoteCreate(socket, noteData) {
    const { id, content, x, y, width, height, color, timestamp } = noteData;

    // Store timestamp for conflict resolution
    this.noteTimestamps.set(id, timestamp);

    // Broadcast to all clients (including sender for confirmation)
    this.io.emit('note-created', {
      id,
      content,
      x,
      y,
      width,
      height,
      color,
      timestamp,
      createdBy: this.activeSessions.get(socket.id)?.userName || 'Anonymous'
    });

    console.log(`[Collab] Note created: ${id}`);
  }

  /**
   * Handle note update with conflict resolution
   */
  handleNoteUpdate(socket, noteData) {
    const { id, content, x, y, width, height, color, timestamp } = noteData;

    // Conflict resolution: last-write-wins based on timestamp
    const lastTimestamp = this.noteTimestamps.get(id);
    if (lastTimestamp && timestamp < lastTimestamp) {
      console.log(`[Collab] Update rejected for ${id} (stale timestamp)`);
      return; // Ignore stale updates
    }

    // Update timestamp
    this.noteTimestamps.set(id, timestamp);

    // Broadcast update to all clients
    this.io.emit('note-updated', {
      id,
      content,
      x,
      y,
      width,
      height,
      color,
      timestamp,
      updatedBy: this.activeSessions.get(socket.id)?.userName || 'Anonymous'
    });

    console.log(`[Collab] Note updated: ${id}`);
  }

  /**
   * Handle note deletion
   */
  handleNoteDelete(socket, noteData) {
    const { id, timestamp } = noteData;

    // Conflict resolution
    const lastTimestamp = this.noteTimestamps.get(id);
    if (lastTimestamp && timestamp < lastTimestamp) {
      console.log(`[Collab] Delete rejected for ${id} (stale timestamp)`);
      return;
    }

    // Remove timestamp tracking
    this.noteTimestamps.delete(id);

    // Broadcast deletion to all clients
    this.io.emit('note-deleted', {
      id,
      timestamp,
      deletedBy: this.activeSessions.get(socket.id)?.userName || 'Anonymous'
    });

    console.log(`[Collab] Note deleted: ${id}`);
  }

  /**
   * Handle cursor movement for presence awareness
   */
  handleCursorMove(socket, data) {
    const { x, y } = data;
    const session = this.activeSessions.get(socket.id);
    
    if (session) {
      session.cursorX = x;
      session.cursorY = y;

      // Broadcast cursor position to all other clients (throttled)
      socket.broadcast.emit('user-cursor', {
        userId: socket.id,
        userName: session.userName,
        x,
        y
      });
    }
  }

  /**
   * Handle full sync request
   */
  handleSyncRequest(socket) {
    // Query database for all current notes
    this.db.all(
      'SELECT * FROM stickynotes ORDER BY timestamp DESC',
      [],
      (err, rows) => {
        if (err) {
          console.error('[Collab] Sync error:', err);
          return;
        }

        // Send full state to requesting client
        socket.emit('sync-state', {
          notes: rows || [],
          activeUsers: Array.from(this.activeSessions.values()),
          timestamp: Date.now()
        });

        console.log(`[Collab] Synced ${rows?.length || 0} notes to ${socket.id}`);
      }
    );
  }

  /**
   * Handle user disconnect
   */
  handleUserDisconnect(socket) {
    const session = this.activeSessions.get(socket.id);
    if (session) {
      this.activeSessions.delete(socket.id);
      
      // Broadcast user left event
      this.io.emit('user-left', {
        socketId: socket.id,
        userName: session.userName,
        activeUsers: Array.from(this.activeSessions.values())
      });

      console.log(`[Collab] ${session.userName} disconnected. Active users: ${this.activeSessions.size}`);
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionCount() {
    return this.activeSessions.size;
  }

  /**
   * Get active users list
   */
  getActiveUsers() {
    return Array.from(this.activeSessions.values());
  }
}

module.exports = CollaborativeSyncManager;
