# Campus Confession Wall - API Documentation

## Base URL
```
http://localhost:5500/api
```

## Sticky Notes Endpoints

### GET /sticky-notes
Retrieve all sticky notes.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "Note content",
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 200,
      "color": "#FFD700",
      "rotation": 0,
      "submitted": 0,
      "createdAt": "2026-03-07T10:00:00Z"
    }
  ]
}
```

### POST /sticky-notes
Create a new sticky note.

**Request Body:**
```json
{
  "content": "New note",
  "x": 100,
  "y": 200,
  "width": 200,
  "height": 200,
  "color": "#FFD700",
  "rotation": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "New note",
    "x": 100,
    "y": 200,
    "width": 200,
    "height": 200,
    "color": "#FFD700",
    "rotation": 0,
    "submitted": 0,
    "createdAt": "2026-03-07T10:00:00Z"
  }
}
```

### PUT /sticky-notes/:id
Update an existing sticky note.

**Request Body:**
```json
{
  "content": "Updated content",
  "x": 150,
  "y": 250
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "Updated content",
    "x": 150,
    "y": 250,
    "width": 200,
    "height": 200,
    "color": "#FFD700",
    "rotation": 0,
    "submitted": 0,
    "updatedAt": "2026-03-07T11:00:00Z"
  }
}
```

### DELETE /sticky-notes/:id
Delete a sticky note.

**Response:**
```json
{
  "success": true,
  "message": "Sticky note deleted"
}
```

## Confessions Endpoints

### GET /confessions
Retrieve all confessions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "text": "Confession text",
      "writerName": "Anonymous",
      "writerEmail": "email@example.com",
      "stickyNoteId": 1,
      "createdAt": "2026-03-07T10:30:00Z"
    }
  ]
}
```

### POST /confessions
Submit a new confession.

**Request Body:**
```json
{
  "text": "Confession text",
  "writerName": "John Doe",
  "writerEmail": "john@example.com",
  "stickyNoteId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "text": "Confession text",
    "writerName": "John Doe",
    "writerEmail": "john@example.com",
    "stickyNoteId": 1,
    "createdAt": "2026-03-07T10:30:00Z"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "status": 400
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
Currently no rate limiting applied. This should be implemented in future versions.

## Authentication
Currently no authentication required. This should be implemented for production use.
