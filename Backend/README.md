# Campus Confession Wall - Backend API

A Node.js/Express backend for the Campus Confession Wall application with SQLite database.

## Features

- **Confessions Management**: Create, retrieve, and delete confessions
- **Replies System**: Add replies to confessions with timestamps
- **Reactions**: Like/dislike confessions with toggle and switch functionality
- **Device Tracking**: One reaction per device per confession
- **Server-side Persistence**: All data stored in SQLite database
- **Statistics**: Track confessions submitted in the last hour
- **CORS Support**: Enable frontend communication

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. (Optional) Update `.env` with your configuration

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT)

## API Endpoints

### Confessions

#### Get All Confessions
```
GET /api/confessions
```
Returns all confessions with their replies and reaction counts.

#### Create New Confession
```
POST /api/confessions
Content-Type: application/json

{
  "text": "confession text here",
  "time": "12:30 PM",
  "timestamp": 1709577600000
}
```

#### Delete All Confessions
```
DELETE /api/confessions/all
```
Clears the entire confession history (device-side deletion enforced).

### Replies

#### Add Reply to Confession
```
POST /api/confessions/:confessionId/replies
Content-Type: application/json

{
  "text": "reply text here",
  "time": "12:31 PM"
}
```

### Reactions (Like/Dislike)

#### Submit Reaction
```
POST /api/confessions/:confessionId/react
Content-Type: application/json

{
  "deviceId": "unique-device-identifier",
  "reactionType": "like" or "dislike"
}
```
- Clicking same reaction again removes it
- Switching from like to dislike (or vice versa) updates automatically
- Returns updated like/dislike counts

#### Get User's Reaction
```
GET /api/confessions/:confessionId/user-reaction/:deviceId
```
Returns the current user's reaction ("like", "dislike", or null)

### Statistics

#### Get Last Hour Count
```
GET /api/confessions/stats/last-hour
```
Returns the number of confessions submitted in the past hour.

## Database Schema

### confessions table
- `id`: Primary key
- `text`: Confession text
- `timestamp`: Unix timestamp
- `time`: Formatted time string (e.g., "12:30 PM")
- `likes`: Like count
- `dislikes`: Dislike count
- `createdAt`: Database timestamp

### replies table
- `id`: Primary key
- `confessionId`: Foreign key to confessions
- `text`: Reply text
- `time`: Formatted time string
- `createdAt`: Database timestamp

### reactions table
- `id`: Primary key
- `confessionId`: Foreign key to confessions
- `deviceId`: Unique device identifier
- `reactionType`: "like" or "dislike"
- `createdAt`: Database timestamp
- `UNIQUE(confessionId, deviceId)`: One reaction per device per confession

## Connecting Frontend

Update your frontend API calls to use the backend endpoints instead of localStorage:

1. Replace localStorage calls with HTTP requests
2. Generate a unique device ID (can use UUID or fingerprint library)
3. Update confession submission, reply, and reaction handling

Example frontend modification (pseudo-code):
```javascript
// Instead of: localStorage.setItem('confessions', JSON.stringify(list))
const response = await fetch('http://localhost:5000/api/confessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, time, timestamp })
});
```

## Environment Variables

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment type (development/production)
- `DB_PATH`: Path to SQLite database file
- `CORS_ORIGIN`: Allowed CORS origins

## Improvements Over Frontend-Only

✅ **Server-side persistence**: Data survives browser cache clears
✅ **Multi-device support**: Proper tracking of reactions per device
✅ **Scalability**: Can add authentication, admin features, analytics
✅ **Security**: Server controls reaction logic (prevents cheating)
✅ **Centralized data**: All users see consistent confession lists
✅ **Database backups**: Can backup confessions independently

## Future Enhancements

- User authentication and email verification
- Confession moderation and reporting
- Analytics dashboard
- Search and filtering
- Confession pinning (most popular)
- Rate limiting to prevent spam
- Admin panel
- Export confessions data

## License

MIT

## Support

For issues or questions, check the error logs:
```bash
tail -f confessions.db
```
