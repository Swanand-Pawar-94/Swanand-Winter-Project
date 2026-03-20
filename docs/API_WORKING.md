# Campus Confession Wall - Complete API Working Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Database Schema](#database-schema)
5. [Core API Endpoints](#core-api-endpoints)
6. [Real-Time Collaboration](#real-time-collaboration)
7. [API Request/Response Flow](#api-requestresponse-flow)
8. [User Workflows](#user-workflows)
9. [Error Handling](#error-handling)

---

## System Overview

**Campus Confession Wall** is a web-based collaborative application that allows users to create anonymous sticky notes (confessions) on a shared digital wall. The system supports:

- **Anonymous Posting**: Users can post confessions without identifying themselves
- **Collaborative Canvas**: Multiple users can view and interact with sticky notes in real-time
- **Confession Submissions**: Users can write detailed confessions attached to specific sticky notes
- **Real-Time Synchronization**: Changes are synchronized across all connected clients instantly using WebSocket
- **Persistent Storage**: All data is stored in SQLite database for persistence

### Key Features

| Feature | Description |
|---------|-------------|
| **Sticky Notes** | Draggable, resizable, colorful notes placed on a canvas with custom positioning |
| **Confessions** | Detailed text submissions linked to sticky notes with optional name/email |
| **Real-Time Updates** | All users see changes instantly via Socket.io |
| **Collaborative Awareness** | Users can see who else is currently online |
| **Persistent Data** | All notes and confessions are saved to the database |

---

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (REST API server)
- **Database**: SQLite3 (lightweight, file-based storage)
- **Real-Time**: Socket.io (WebSocket for real-time collaboration)
- **Middleware**: 
  - CORS (Cross-Origin Resource Sharing)
  - Body-Parser (JSON parsing)
  - Dotenv (Environment variables)

### Frontend
- **Architecture**: Modern View Controller (MVVC) Pattern
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3
- **Communication**: 
  - REST API calls (Fetch/AJAX) for CRUD operations
  - WebSocket (Socket.io) for real-time updates

### Server Configuration
- **Port**: 5500 (default, configurable via .env)
- **Base URL**: `http://localhost:5500`
- **API Base Path**: `/api`

---

## Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Browser)                │
│  ┌──────────────────────────────────────────────┐  │
│  │  AppDelegate (Application Coordinator)       │  │
│  │  ├─ CanvasViewController (Display Logic)      │  │
│  │  └─ ConfessionViewController (Form Logic)     │  │
│  │  ├─ StickyNoteView (Rendering)               │  │
│  │  └─ ConfessionModalView (Modal Rendering)    │  │
│  │                                               │  │
│  │  AppService (Singleton API Client)           │  │
│  │  ├─ Sticky Notes Cache                       │  │
│  │  ├─ Confessions Cache                        │  │
│  │  └─ Socket.io Event Handlers                 │  │
│  └──────────────────────────────────────────────┘  │
│                     │                   │           │
│                     ├── HTTP REST ──────┤           │
│                     └─ WebSocket ───────┤           │
└─────────────────────┼────────────────────┼───────────┘
                      │                    │
                      ▼                    ▼
        ┌──────────────────────────────────────┐
        │     Backend (Express.js Server)      │
        │                                      │
        │  HTTP Routes:                        │
        │  ├─ GET/POST/PUT/DELETE /sticky...   │
        │  ├─ GET/POST/PUT /confessions...     │
        │  ├─ GET /stats/last-hour             │
        │  └─ GET /history                     │
        │                                      │
        │  WebSocket Events:                   │
        │  ├─ user-join                        │
        │  ├─ note-create/update/delete        │
        │  ├─ cursor-move                      │
        │  └─ request-sync                     │
        │                                      │
        │  CollaborativeSyncManager:           │
        │  ├─ Live Session Management          │
        │  ├─ Conflict Resolution              │
        │  └─ Broadcast Updates                │
        └──────────────────┬───────────────────┘
                          │
                          ▼
        ┌──────────────────────────────────┐
        │   SQLite Database                │
        │  ┌────────────────────────────┐  │
        │  │ stickynotes table          │  │
        │  │ ├─ id, content, x, y       │  │
        │  │ ├─ width, height, color    │  │
        │  │ ├─ rotation, confessionId  │  │
        │  │ └─ timestamp, createdAt    │  │
        │  └────────────────────────────┘  │
        │  ┌────────────────────────────┐  │
        │  │ confessions table          │  │
        │  │ ├─ id, text, writerName    │  │
        │  │ ├─ writerEmail, stickyNoteId │
        │  │ ├─ likes, isPinned         │  │
        │  │ └─ timestamp, createdAt    │  │
        │  └────────────────────────────┘  │
        └──────────────────────────────────┘
```

### Request Flow (HTTP REST API)

```
1. Frontend Action (User creates note)
   │
   ├─→ AppService.createStickyNote(noteData)
   │
   └─→ HTTP POST /api/stickynotes
       │
       └─→ Express Route Handler
           │
           ├─→ Validate Request (x, y required)
           │
           ├─→ Set Defaults (width, height, color, rotation)
           │
           ├─→ Database INSERT
           │   db.run('INSERT INTO stickynotes...')
           │
           └─→ HTTP 200 Response with new note
               │
               └─→ Frontend receives note, updates UI
```

### WebSocket Flow (Real-Time Collaboration)

```
1. User Connects
   │
   ├─→ Socket Connection Established
   │
   └─→ Client emits 'user-join' event
       │
       └─→ CollaborativeSyncManager.handleUserJoin()
           │
           ├─→ Register session
           │
           ├─→ Broadcast 'user-joined' to all clients
           │
           └─→ Send current state via 'request-sync'

2. User Creates Note (via WebSocket)
   │
   └─→ Client emits 'note-create' event
       │
       └─→ CollaborativeSyncManager.handleNoteCreate()
           │
           ├─→ Store timestamp for conflict resolution
           │
           └─→ Broadcast 'note-created' to all clients
               (including sender for confirmation)

3. Real-Time Updates
   │
   └─→ All connected clients receive updates instantly
       via WebSocket events
```

---

## Database Schema

### Table: `stickynotes`

Stores all sticky notes on the canvas.

```sql
CREATE TABLE stickynotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,        -- Unique note ID
  content TEXT NOT NULL,                       -- Note text content
  x INTEGER NOT NULL,                          -- X coordinate on canvas
  y INTEGER NOT NULL,                          -- Y coordinate on canvas
  width INTEGER NOT NULL DEFAULT 250,          -- Width in pixels
  height INTEGER NOT NULL DEFAULT 300,         -- Height in pixels
  color TEXT NOT NULL DEFAULT '#FFFF99',       -- Hex color code (default yellow)
  rotation INTEGER NOT NULL DEFAULT 0,         -- Rotation angle in degrees
  confessionId INTEGER,                        -- Foreign key to confessions
  timestamp BIGINT DEFAULT CURRENT_TIMESTAMP,  -- Unix timestamp of creation
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (confessionId) REFERENCES confessions(id) ON DELETE SET NULL
)
```

**Key Fields**:
- `(x, y)`: Position on the canvas (origin at top-left)
- `(width, height)`: Dimensions of the note
- `color`: Hex color to distinguish notes
- `rotation`: CSS transform rotation angle
- `confessionId`: Nullable - NULL if no confession submitted, set when someone responds

### Table: `confessions`

Stores detailed confessions submitted by users in response to sticky notes.

```sql
CREATE TABLE confessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,        -- Unique confession ID
  text TEXT NOT NULL,                          -- Confession content
  writerName TEXT DEFAULT 'Anonymous',         -- Optional name (defaults to Anonymous)
  writerEmail TEXT,                            -- Optional email
  stickyNoteId INTEGER,                        -- Foreign key to sticky note
  timestamp BIGINT NOT NULL,                   -- Unix timestamp of submission
  likes INTEGER DEFAULT 0,                     -- Like counter
  isPinned INTEGER DEFAULT 0,                  -- Boolean: pinned status
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stickyNoteId) REFERENCES stickynotes(id) ON DELETE CASCADE
)
```

**Key Fields**:
- `writerName`: Optional - Users can write anonymously
- `stickyNoteId`: Links confession to the sticky note it responds to
- `likes`: Community engagement metric
- `isPinned`: Admin feature to highlight important confessions

### Database Relationships

```
stickynotes (1) ──── (0..1) confessions
  - A sticky note can have multiple confessions (one-to-many not explicit in schema)
  - When a note is deleted, related confessions cascade delete
  - When a confession is deleted, the note remains
```

---

## Core API Endpoints

### Base URL
```
http://localhost:5500/api
```

---

### STICKY NOTES ENDPOINTS

#### 1. GET /stickynotes
**Retrieve all sticky notes**

```
GET http://localhost:5500/api/stickynotes
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "content": "This is a secret confession",
    "x": 100,
    "y": 200,
    "width": 250,
    "height": 300,
    "color": "#FFD700",
    "rotation": 15,
    "confessionId": null,
    "timestamp": 1678201200000,
    "createdAt": "2026-03-07T10:00:00Z",
    "updatedAt": "2026-03-07T10:00:00Z"
  },
  {
    "id": 2,
    "content": "Another confession",
    "x": 400,
    "y": 150,
    "width": 250,
    "height": 300,
    "color": "#FF69B4",
    "rotation": -5,
    "confessionId": 1,
    "timestamp": 1678201300000,
    "createdAt": "2026-03-07T10:05:00Z",
    "updatedAt": "2026-03-07T10:05:00Z"
  }
]
```

---

#### 2. POST /stickynotes
**Create a new sticky note**

```
POST http://localhost:5500/api/stickynotes
Content-Type: application/json

{
  "content": "I love debugging at 3 AM",
  "x": 250,
  "y": 300,
  "width": 280,
  "height": 350,
  "color": "#FF6B6B",
  "rotation": 10
}
```

**Required Fields**:
- `x` (number): X coordinate - **REQUIRED**
- `y` (number): Y coordinate - **REQUIRED**

**Optional Fields** (with defaults):
- `content` (string): Note text (default: empty string)
- `width` (number): Pixel width (default: 250)
- `height` (number): Pixel height (default: 300)
- `color` (string): Hex color code (default: #FFFF99)
- `rotation` (number): Rotation angle in degrees (default: 0)

**Response** (200 OK):
```json
{
  "id": 3,
  "content": "I love debugging at 3 AM",
  "x": 250,
  "y": 300,
  "width": 280,
  "height": 350,
  "color": "#FF6B6B",
  "rotation": 10,
  "confessionId": null,
  "timestamp": 1678201400000,
  "createdAt": "2026-03-07T10:10:00Z"
}
```

**Error Responses**:
```
400 Bad Request: x and y coordinates are required
```

---

#### 3. PUT /stickynotes/:id
**Update an existing sticky note**

```
PUT http://localhost:5500/api/stickynotes/3
Content-Type: application/json

{
  "content": "Updated confession text",
  "x": 300,
  "y": 350,
  "color": "#FFA500"
}
```

**Allowed Update Fields**:
- `content`: Note text
- `x`: X position
- `y`: Y position
- `width`: Width in pixels
- `height`: Height in pixels
- `color`: Hex color
- `rotation`: Rotation angle
- `confessionId`: Associated confession

**Response** (200 OK):
```json
{
  "message": "Sticky note updated",
  "id": 3
}
```

**Error Responses**:
```
400 Bad Request: No valid fields provided for update.
```

---

#### 4. DELETE /stickynotes/:id
**Delete a specific sticky note**

```
DELETE http://localhost:5500/api/stickynotes/3
```

**Response** (200 OK):
```json
{
  "message": "Sticky note deleted",
  "id": 3
}
```

**Protection Rule**:
- If a note has an associated confession (confessionId is not null), it **cannot be deleted**
- Returns: `403 Forbidden - Cannot delete a submitted sticky note`

```
403 Forbidden
{
  "error": "Cannot delete a submitted sticky note"
}
```

---

#### 5. DELETE /stickynotes
**Delete ALL sticky notes** (use with caution!)

```
DELETE http://localhost:5500/api/stickynotes
```

**Response** (200 OK):
```json
{
  "message": "All sticky notes deleted"
}
```

---

### STATISTICS ENDPOINTS

#### 6. GET /stickynotes/stats/last-hour
**Get count of sticky notes created in the last hour**

```
GET http://localhost:5500/api/stickynotes/stats/last-hour
```

**Response** (200 OK):
```json
{
  "count": 15
}
```

**Logic**:
- Calculates: Current time - 60 minutes
- Counts all notes with timestamp > (now - 60 min)
- Useful for activity monitoring and statistics

---

### CONFESSIONS ENDPOINTS

#### 7. GET /confessions
**Retrieve all confessions**

```
GET http://localhost:5500/api/confessions
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "text": "I sometimes skip breakfast",
    "writerName": "Anonymous",
    "writerEmail": null,
    "stickyNoteId": 1,
    "timestamp": 1678201500000,
    "likes": 42,
    "isPinned": 0,
    "createdAt": "2026-03-07T10:15:00Z",
    "updatedAt": "2026-03-07T10:15:00Z"
  }
]
```

---

#### 8. POST /confessions
**Submit a new confession**

```
POST http://localhost:5500/api/confessions
Content-Type: application/json

{
  "text": "I love this campus confession wall!",
  "writerName": "Jane Doe",
  "writerEmail": "jane@example.com",
  "stickyNoteId": 1,
  "timestamp": 1678201600000
}
```

**Required Fields**:
- `text` (string): Confession content - **REQUIRED**
- `timestamp` (number): Unix timestamp - **REQUIRED**

**Optional Fields**:
- `writerName` (string): Author name (default: "Anonymous")
- `writerEmail` (string): Author email
- `stickyNoteId` (number): Associated sticky note ID (null for standalone confessions)

**Response** (200 OK):
```json
{
  "id": 2,
  "text": "I love this campus confession wall!",
  "writerName": "Jane Doe",
  "writerEmail": "jane@example.com",
  "stickyNoteId": 1,
  "timestamp": 1678201600000,
  "likes": 0,
  "isPinned": 0,
  "createdAt": "2026-03-07T10:20:00Z"
}
```

---

#### 9. PUT /confessions/:id
**Update a confession**

```
PUT http://localhost:5500/api/confessions/1
Content-Type: application/json

{
  "text": "Updated confession",
  "likes": 50
}
```

**Response** (200 OK):
```json
{
  "message": "Confession updated",
  "id": 1
}
```

---

#### 10. DELETE /confessions/:id
**Delete a confession**

```
DELETE http://localhost:5500/api/confessions/1
```

**Response** (200 OK):
```json
{
  "message": "Confession deleted",
  "id": 1
}
```

---

### PAGE ROUTES

#### 11. GET /history
**Serve the history/confession viewing page**

```
GET http://localhost:5500/history
```

**Response**: Returns `history.html` (HTML page for viewing confessions history)

---

## Real-Time Collaboration

The system uses **Socket.io** for real-time, bidirectional communication between the server and multiple clients.

### Architecture

```
Class: CollaborativeSyncManager
├─ Manages WebSocket connections
├─ Tracks active user sessions
├─ Handles conflict resolution with timestamps
├─ Broadcasts updates to all connected clients
└─ Maintains conflict-free state across clients
```

### WebSocket Events

#### Client → Server Events

##### 1. `user-join`
**User joins the collaboration session**

```javascript
// Client sends
socket.emit('user-join', {
  sessionId: 'session-123',
  userId: 'user-456',
  userName: 'Alice'
});
```

**Server Actions**:
- Register the session in `activeSessions` Map
- Broadcast `user-joined` event to all clients
- Send current state via `request-sync`

---

##### 2. `note-create`
**A new sticky note is created**

```javascript
// Client sends
socket.emit('note-create', {
  id: 123,
  content: "New confession",
  x: 150,
  y: 200,
  width: 250,
  height: 300,
  color: "#FF69B4",
  timestamp: 1678201700000
});
```

**Server Actions**:
- Store note timestamp for conflict resolution
- Validate note data
- Broadcast `note-created` to all clients

---

##### 3. `note-update`
**A sticky note is updated (position, content, color, etc.)**

```javascript
// Client sends
socket.emit('note-update', {
  id: 123,
  content: "Updated content",
  x: 200,
  y: 250,
  timestamp: 1678201800000
});
```

**Server Actions**:
- Apply last-write-wins conflict resolution (based on timestamp)
- Update note in database
- Broadcast `note-updated` to all clients

---

##### 4. `note-delete`
**A sticky note is deleted**

```javascript
// Client sends
socket.emit('note-delete', {
  id: 123
});
```

**Server Actions**:
- Delete note from database
- Broadcast `note-deleted` to all clients

---

##### 5. `cursor-move`
**User cursor position (for awareness)**

```javascript
// Client sends
socket.emit('cursor-move', {
  x: 500,
  y: 300
});
```

**Server Actions**:
- Update cursor position in session info
- Broadcast cursor position to all clients

---

##### 6. `request-sync`
**New client requests full state synchronization**

```javascript
// Client sends
socket.emit('request-sync');
```

**Server Actions**:
- Send all sticky notes
- Send all active sessions
- Send all confessions
- Bring new client to current state

---

#### Server → Client Events

##### 1. `user-joined`
**Broadcast when a user joins**

```javascript
socket.on('user-joined', (data) => {
  // data: {
  //   socketId: 'socket-id',
  //   userId: 'user-id',
  //   userName: 'Alice',
  //   activeUsers: [array of all active users]
  // }
});
```

---

##### 2. `note-created`
**Broadcast when a note is created**

```javascript
socket.on('note-created', (noteData) => {
  // noteData: complete sticky note object
});
```

---

##### 3. `note-updated`
**Broadcast when a note is updated**

```javascript
socket.on('note-updated', (noteData) => {
  // noteData: updated sticky note object
});
```

---

##### 4. `note-deleted`
**Broadcast when a note is deleted**

```javascript
socket.on('note-deleted', (data) => {
  // data: { id: noteId }
});
```

---

##### 5. `sync-response`
**Send current state to a client requesting sync**

```javascript
socket.on('sync-response', (data) => {
  // data: {
  //   notes: [all sticky notes],
  //   activeSessions: [all active users],
  //   confessions: [all confessions]
  // }
});
```

---

##### 6. `cursor-update`
**Broadcast cursor position of other users**

```javascript
socket.on('cursor-update', (data) => {
  // data: {
  //   userId: 'user-id',
  //   x: 500,
  //   y: 300
  // }
});
```

---

##### 7. `user-disconnected`
**Broadcast when a user disconnects**

```javascript
socket.on('user-disconnected', (data) => {
  // data: {
  //   socketId: 'socket-id',
  //   activeUsers: [remaining active users]
  // }
});
```

---

### Conflict Resolution Strategy

**Last-Write-Wins (LWW) Approach**:
- Each note carries a `timestamp` field
- When two updates for the same note arrive:
  - Update with the **higher timestamp** wins
  - Lower timestamp update is rejected
- Prevents race conditions when multiple clients edit the same note

**Example Conflict Scenario**:

```
Time 1: Client A updates note #5 at timestamp 1000 (content: "A")
Time 1: Client B updates note #5 at timestamp 1500 (content: "B")

Result: Client B's update wins (higher timestamp)
Final content: "B"
```

---

### Active Sessions Tracking

```javascript
// Map structure
activeSessions: {
  'socket-id-1': {
    userId: 'user-1',
    userName: 'Alice',
    sessionId: 'session-123',
    joinedAt: 1678201700000,
    socketId: 'socket-id-1',
    cursorX: 150,
    cursorY: 200
  },
  'socket-id-2': {
    userId: 'user-2',
    userName: 'Bob',
    sessionId: 'session-456',
    joinedAt: 1678201800000,
    socketId: 'socket-id-2',
    cursorX: 300,
    cursorY: 400
  }
}
```

**Uses**:
- Track who is currently online
- Broadcast user join/leave events
- Show cursor positions for awareness
- Calculate active user count

---

## API Request/Response Flow

### Complete Flow: User Creates and Submits a Confession

```
Step 1: Page Load
├─→ Frontend loads index.html
├─→ AppDelegate initializes
├─→ Socket.io connection established
└─→ emit 'user-join' event

Step 2: Server Receives Join
├─→ handleUserJoin() called
├─→ Session registered
├─→ emit 'request-sync' to new client
└─→ Broadcast 'user-joined' to all clients

Step 3: Frontend Receives Sync
├─→ 'sync-response' received
├─→ AppService updates local cache
├─→ CanvasViewController renders all notes
└─→ User sees the canvas with existing notes

Step 4: User Creates Sticky Note
├─→ User clicks on canvas location
├─→ Frontend creates note object:
│   {
│     "content": "",
│     "x": 250,
│     "y": 300,
│     "width": 250,
│     "height": 300,
│     "color": "#FFD700"
│   }
├─→ emit 'note-create' via WebSocket
└─→ Also POST /api/stickynotes (for persistence)

Step 5: Server Persists Note
├─→ Route handler validates request
├─→ db.run() inserts into stickynotes table
├─→ Returns note with auto-generated ID
└─→ emit 'note-created' to all clients

Step 6: Frontend Receives Real-Time Update
├─→ 'note-created' event received
├─→ AppService updates cache
├─→ StickyNoteView renders new note on canvas
└─→ Note appears for all connected users

Step 7: User Clicks on Sticky Note
├─→ Open ConfessionModalView
├─→ User fills form:
│   {
│     "text": "I sometimes code at midnight",
│     "writerName": "Anonymous",
│     "writerEmail": "test@example.com"
│   }

Step 8: User Submits Confession
├─→ Frontend POST /api/confessions
│   {
│     "text": "...",
│     "writerName": "...",
│     "writerEmail": "...",
│     "stickyNoteId": 5,
│     "timestamp": 1678201900000
│   }
├─→ Route handler validates
├─→ db.run() inserts into confessions table
└─→ Returns confession with ID

Step 9: Update Sticky Note Reference
├─→ Frontend PUT /api/stickynotes/5
│   {
│     "confessionId": 10
│   }
├─→ Route handler updates note
└─→ Note now linked to confession

Step 10: Frontend Updates UI
├─→ Modal closes
├─→ Sticky note shows visual indicator (responded)
└─→ Confession visible in history or modal

Step 11: Other Users See the Change
├─→ WebSocket broadcast updates
├─→ All connected clients receive changes
└─→ Real-time reflection across all browsers
```

---

## User Workflows

### Workflow 1: Create and Submit a Confession

```
1. User visits https://campus-confessions.com
2. Canvas loads with existing sticky notes
3. User reads sticky notes and finds one they relate to
4. User clicks on the sticky note
5. Confession modal opens
6. User types their response
7. Optional: User enters name and email
8. User clicks "Submit"
9. Confession is saved to database
10. Sticky note is updated with confession reference
11. Other users see the sticky note as "Responded" in real-time
12. Confession appears in History page
```

### Workflow 2: View All Confessions

```
1. User navigates to /history page
2. history.html renders
3. Fetch /api/confessions
4. Display all confessions in chronological order
5. Show confession details: text, author name, date, likes
6. User can like confessions by clicking heart icon
7. PUT /confessions/:id with updated likes
```

### Workflow 3: Real-Time Collaboration

```
User A:
1. Creates sticky note at position (100, 200)
2. WebSocket emits 'note-create'

User B (already connected):
1. Receives 'note-created' event immediately
2. New sticky note appears on User B's canvas
3. User B can interact with it instantly

Result: Both users see the same state in real-time
```

### Workflow 4: Conflict Resolution (Simultaneous Edits)

```
Scenario: Two users edit the same sticky note simultaneously

User A:
1. Changes note position from (100, 200) to (150, 250)
2. Timestamp: 1000ms
3. Emits 'note-update' with timestamp 1000

User B:
1. Changes note color from yellow to pink
2. Timestamp: 1500ms
3. Emits 'note-update' with timestamp 1500

Server Resolution:
- User B's update has higher timestamp (1500 > 1000)
- User B's update is accepted
- User A's update is rejected (older timestamp)
- Both users see: position (100, 200) + color pink

This uses "Last-Write-Wins" strategy for consistency
```

---

## Error Handling

### HTTP Error Responses

#### 400 Bad Request
**When required fields are missing or invalid**

```json
{
  "error": "x and y coordinates are required"
}
```

**Scenarios**:
- Missing required fields in POST/PUT requests
- Invalid data types
- Out-of-range values

---

#### 403 Forbidden
**When operation is not allowed**

```json
{
  "error": "Cannot delete a submitted sticky note"
}
```

**Scenarios**:
- Attempting to delete a note with an associated confession
- Permission restrictions

---

#### 404 Not Found
**When resource doesn't exist**

```json
{
  "error": "Note not found"
}
```

**Scenarios**:
- Trying to update/delete a non-existent note
- Invalid note ID

---

#### 500 Internal Server Error
**When server processing fails**

```json
{
  "error": "Database connection failed"
}
```

**Scenarios**:
- Database errors
- Server crashes
- Unexpected exceptions

---

### Database Error Handling

**All database operations are wrapped in error handlers**:

```javascript
db.run(query, params, function(err) {
  if (err) {
    res.status(500).json({ error: err.message });
    return;
  }
  // Success handling
});
```

**Common database errors**:
- Constraint violations (foreign key, unique, etc.)
- Connection timeouts
- Disk space issues
- File corruption

---

### WebSocket Error Handling

**Socket.io automatic error handling**:
- Connection failures automatically retry
- Disconnections trigger cleanup
- Invalid events are ignored
- JSON parsing errors are caught

---

## Performance Considerations

### Database Indexing
```sql
-- Recommended indexes for performance
CREATE INDEX idx_stickynotes_timestamp ON stickynotes(timestamp);
CREATE INDEX idx_stickynotes_confessionId ON stickynotes(confessionId);
CREATE INDEX idx_confessions_stickyNoteId ON confessions(stickyNoteId);
CREATE INDEX idx_confessions_timestamp ON confessions(timestamp);
```

### Caching Strategy
- Frontend maintains local cache of all sticky notes
- Reduces repeated API calls
- Cache invalidated/updated on socket events

### WebSocket Optimization
- Use namespaces for different features
- Broadcast only changed data
- Implement connection throttling for cursor events

---

## Security Considerations

### Current Implementation
- ✅ CORS enabled for cross-origin requests
- ✅ Anonymous access (no authentication required)
- ✅ Deletion protection (notes with confessions can't be deleted)
- ✅ SQL injection prevention (parameterized queries)

### Recommended Enhancements
- ⚠️ Add rate limiting to prevent abuse
- ⚠️ Implement input validation/sanitization
- ⚠️ Add HTTPS/TLS for production
- ⚠️ Consider authentication for admin operations
- ⚠️ Add CSRF protection

---

## Deployment

### Docker Support
The project includes Dockerfile and docker-compose.yml for containerized deployment.

### Environment Variables (.env)
```
PORT=5500
NODE_ENV=development
DATABASE_URL=./confessions.db
```

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Implement monitoring/logging
- [ ] Deploy with process manager (PM2)

---

## Summary

The **Campus Confession Wall API** is a collaborative real-time web application built on:

1. **RESTful APIs** for CRUD operations on sticky notes and confessions
2. **WebSocket (Socket.io)** for real-time collaboration and synchronization
3. **SQLite Database** for persistent storage
4. **Last-Write-Wins** conflict resolution for consistency
5. **Modular Frontend Architecture** (MVVC pattern) for maintainability

The system allows anonymous users to create and interact with a shared digital canvas, creating a unique, real-time collaborative confession wall experience.

---

**Last Updated**: March 20, 2026
**API Version**: 1.0.0
**Status**: Active & Maintained
