# Campus Confession Wall - Architecture

## Overview
Campus Confession Wall is a web application that allows users to create anonymous sticky notes with confessions on a shared canvas.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Port**: 5500

### Frontend
- **Pattern**: Modern View Controller (MVVC)
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3

## Project Structure

```
Campus Confession Wall/
├── Backend/                          # Backend Node.js/Express application
│   ├── server.js                    # Express server entry point
│   ├── package.json                 # Backend dependencies
│   ├── database.js                  # SQLite database initialization
│   ├── docker-compose.yml           # Docker configuration
│   ├── Dockerfile                   # Docker image definition
│   ├── frontend-integration.js      # Frontend assets serving
│   ├── README.md                    # Backend documentation
│   ├── models/                      # Data models (MVC layer)
│   │   └── StickyNote.js           # Sticky note data access
│   ├── routes/                      # API route definitions
│   ├── controllers/                 # Request handlers and business logic
│   ├── middleware/                  # Express middleware functions
│   └── utils/                       # Utility functions and helpers
│
├── Frontend/                         # Frontend web application
│   ├── index.html                   # Main application page
│   ├── history.html                 # History/confession viewing page
│   ├── style.css                    # Original styles (deprecated)
│   ├── script.js                    # Original script (deprecated)
│   ├── history-script.js            # History page script (deprecated)
│   ├── js/                          # Modern JavaScript architecture
│   │   ├── core/
│   │   │   └── BaseViewController.js    # Base lifecycle management
│   │   ├── services/
│   │   │   └── AppService.js           # Singleton API/data service
│   │   ├── views/
│   │   │   ├── StickyNoteView.js       # Sticky note rendering
│   │   │   └── ConfessionModalView.js  # Confession modal rendering
│   │   ├── viewControllers/
│   │   │   ├── CanvasViewController.js      # Canvas business logic
│   │   │   └── ConfessionViewController.js  # Confession flow logic
│   │   ├── app/
│   │   │   └── AppDelegate.js          # Application coordinator
│   │   ├── controllers/                # Placeholder (deprecated)
│   │   ├── models/                     # Placeholder (deprecated)
│   │   └── utils/                      # Placeholder (deprecated)
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css              # Centralized styles
│   │   ├── images/                    # Image assets
│   │   └── fonts/                     # Font assets
│   └── views/                         # Additional view components
│
├── docs/                             # Project documentation
│   ├── ARCHITECTURE.md              # This file
│   ├── API.md                       # API endpoints documentation
│   ├── DATABASE.md                  # Database schema documentation
│   └── SETUP.md                     # Setup and deployment guide
│
├── config/                          # Configuration files
│   └── environment.js               # Environment variables and config
│
├── scripts/                         # Utility scripts
│   ├── init-db.js                  # Database initialization script
│   └── seed-data.js                # Sample data seeding
│
├── tests/                           # Test files
│   ├── backend/                    # Backend tests
│   └── frontend/                   # Frontend tests
│
├── .git/                           # Git repository
├── .gitignore                      # Git ignore rules
├── package.json                    # Root project metadata (optional)
└── README.md                       # Root project documentation
```

## Architecture Pattern: Modern View Controller (MVVC)

### Layer Breakdown

#### 1. **Service Layer** (`AppService.js`)
- Singleton pattern for single source of truth
- Manages API communication with backend
- Maintains local cache of sticky notes and confessions
- Methods: fetchStickyNotes, createStickyNote, updateStickyNote, deleteStickyNote, etc.

#### 2. **View Layer** (Presentational)
- `StickyNoteView.js` - Renders individual sticky notes
- `ConfessionModalView.js` - Renders confession submission modal
- Pure rendering, no business logic
- No event listeners (business logic in ViewControllers)

#### 3. **View Controller Layer** (Business Logic)
- `CanvasViewController.js` - Manages sticky note interactions
  - Handles drag-to-reposition logic
  - Debounced saves (500ms) + blur event flushing
  - Sticky note creation and deletion
- `ConfessionViewController.js` - Manages confession submission
  - Modal display and validation
  - Confession submission and note status marking

#### 4. **Core Layer** (`BaseViewController.js`)
- Provides lifecycle management
- Automatic event listener cleanup
- Common patterns for all view controllers

#### 5. **Coordinator** (`AppDelegate.js`)
- Application entry point
- Initializes view controllers
- Wires inter-controller communication
- Handles navigation

## Key Features

### Data Persistence
- **Debouncing**: 500ms delay on textarea input to prevent rapid database updates
- **Blur Event Flushing**: Immediate save before navigation
- **Position Persistence**: Sticky note positions saved to database
- **Submitted Status**: Tracks which notes have confessions submitted

### User Interface
- **Canvas**: Draggable sticky notes with random colors
- **Confession Modal**: Form for submitting anonymous confessions
- **Read-Only**: Submitted notes become read-only with visual indicators
- **History**: View all confessions

## Database Schema

### stickynotes Table
```sql
CREATE TABLE stickynotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  x INTEGER,
  y INTEGER,
  width INTEGER,
  height INTEGER,
  color TEXT,
  rotation REAL,
  timestamp DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  submitted INTEGER DEFAULT 0
)
```

### confessions Table
```sql
CREATE TABLE confessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT,
  writerName TEXT,
  writerEmail TEXT,
  stickyNoteId INTEGER,
  timestamp DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (stickyNoteId) REFERENCES stickynotes(id)
)
```

## API Endpoints

See [API.md](./API.md) for detailed endpoint documentation.

### Main Endpoints
- `GET /api/sticky-notes` - Get all sticky notes
- `POST /api/sticky-notes` - Create new sticky note
- `PUT /api/sticky-notes/:id` - Update sticky note
- `DELETE /api/sticky-notes/:id` - Delete sticky note
- `POST /api/confessions` - Submit confession
- `GET /api/confessions` - Get all confessions

## Setup and Deployment

See [SETUP.md](./SETUP.md) for installation and deployment instructions.

## Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit with clear messages
4. Push to branch
5. Submit a pull request

## File Naming Conventions

- **ViewControllers**: `*ViewController.js` (e.g., `CanvasViewController.js`)
- **Views**: `*View.js` (e.g., `StickyNoteView.js`)
- **Services**: `*Service.js` (e.g., `AppService.js`)
- **Models**: `*Model.js` or database-specific naming
- **Controllers**: `*Controller.js` (deprecated in favor of ViewControllers)

## Future Improvements

- [ ] Add HistoryViewController for dedicated history page
- [ ] Implement user authentication
- [ ] Add real-time collaboration (WebSocket)
- [ ] Add unit and integration tests
- [ ] Implement CI/CD pipeline
- [ ] Add notification system
- [ ] Implement data backup and recovery
