# Campus Confession Wall - Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git
- (Optional) Docker and Docker Compose

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Campus Confession Wall"
```

### 2. Install Backend Dependencies
```bash
cd Backend
npm install
```

### 3. Environment Setup
Create a `.env` file in the Backend directory:
```
PORT=5500
NODE_ENV=development
DATABASE=./campus_confessions.db
```

### 4. Initialize Database
The database will be automatically initialized when the server starts. Alternatively, run:
```bash
npm run init-db
```

## Running the Application

### Development Mode

#### Terminal 1 - Start Backend Server
```bash
cd Backend
npm start
```

The server will start on `http://localhost:5500`

#### Terminal 2 - Open Frontend
Open your browser and navigate to:
```
http://localhost:5500
```

### Docker Setup (Optional)

```bash
cd Backend
docker-compose up
```

## Project Structure

```
Campus Confession Wall/
├── Backend/
│   ├── server.js          # Express server
│   ├── database.js        # SQLite setup
│   ├── package.json       # Dependencies
│   └── models/            # Data models
├── Frontend/
│   ├── index.html         # Main app
│   ├── history.html       # History page
│   ├── js/                # JavaScript architecture
│   │   ├── core/          # Base classes
│   │   ├── services/      # API services
│   │   ├── views/         # Presentational views
│   │   ├── viewControllers/  # Business logic
│   │   └── app/           # Application coordinator
│   └── assets/            # CSS, images, fonts
├── docs/                  # Documentation
├── config/                # Configuration
└── scripts/               # Utility scripts
```

## Available Scripts

### Backend Scripts
```bash
npm start          # Start the server
npm run init-db    # Initialize database
npm run seed       # Seed sample data
npm test          # Run tests (if configured)
```

## Architecture Overview

The application follows the **Modern View Controller (MVVC)** pattern:

### Frontend Architecture
- **AppService**: Singleton for API communication and data management
- **ViewControllers**: Business logic for different features
- **Views**: Presentational layer for rendering
- **AppDelegate**: Application coordinator and entry point

### Key Features
- ✅ Persistent sticky notes with positions
- ✅ Anonymous confessions system
- ✅ Read-only mode for submitted notes
- ✅ Debounced saves (500ms)
- ✅ Blur event flushing for immediate save before navigation
- ✅ View confessions history

## Database Schema

### Sticky Notes Table
- `id` - Primary key
- `content` - Note text content
- `x`, `y` - Canvas position
- `width`, `height` - Dimensions
- `color` - Background color
- `rotation` - Rotation angle
- `submitted` - 0/1 flag for confession submitted status
- `createdAt`, `updatedAt` - Timestamps

### Confessions Table
- `id` - Primary key
- `text` - Confession content
- `writerName` - Submitter name
- `writerEmail` - Submitter email
- `stickyNoteId` - Foreign key to sticky note
- `createdAt`, `updatedAt` - Timestamps

## API Endpoints

### Sticky Notes
- `GET /api/sticky-notes` - Get all notes
- `POST /api/sticky-notes` - Create new note
- `PUT /api/sticky-notes/:id` - Update note
- `DELETE /api/sticky-notes/:id` - Delete note

### Confessions
- `GET /api/confessions` - Get all confessions
- `POST /api/confessions` - Submit confession

## Troubleshooting

### Port Already in Use
If port 5500 is already in use:
```bash
# Change PORT in .env or
npm start -- --port 3000
```

### Database Locked
Delete or reset the database file:
```bash
rm Backend/campus_confessions.db
npm start  # Reinitialize
```

### Clear Browser Cache
If changes aren't showing:
1. Open DevTools (F12)
2. Settings > Network > Disable cache
3. Hard refresh (Ctrl+Shift+R)

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
git add .
git commit -m "Add your feature"

# Push to remote
git push origin feature/your-feature

# Create Pull Request
```

## Next Steps

1. Verify the application is running at `http://localhost:5500`
2. Try creating a sticky note
3. Add a confession to the sticky note
4. Navigate to history to view all confessions
5. Check that notes persist on page reload

## Support

For issues or questions:
1. Check the [Architecture Documentation](./ARCHITECTURE.md)
2. Review [API Documentation](./API.md)
3. Check server logs for error messages

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production` in .env
2. Use a proper database backup strategy
3. Implement authentication
4. Set up SSL/TLS certificates
5. Configure CORS properly
6. Set up logging and monitoring
