# Campus Confession Wall

An anonymous sticky note confession wall application for college campuses. Students can create colorful sticky notes on a shared canvas and submit anonymous confessions that persist and remain read-only after submission.

## Features

✨ **Sticky Note Canvas**
- Draggable sticky notes with random colors
- Position persistence across page reloads
- Create, edit, and delete notes
- Customizable size and rotation

🎯 **Anonymous Confessions**
- Submit confessions to sticky notes anonymously
- Writer name and email required (stored separately)
- Confessions readonly after submission
- Visual indicator for submitted notes (red pinned dot)

💾 **Data Persistence**
- All notes and confessions persist in SQLite database
- 500ms debounced saves to prevent database overload
- Blur event flushing for immediate saves before navigation
- Position data saved for each note

📚 **View History**
- Browse all submitted confessions
- Organized by sticky note
- Timestamped entries

## Tech Stack

- **Backend**: Node.js + Express.js + SQLite3
- **Frontend**: Vanilla JavaScript (ES6+) with MVVC pattern
- **Architecture**: Modern View Controller pattern for clean separation of concerns

## Quick Start

### Prerequisites
- Node.js v14+
- npm v6+
- Git

### Installation

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd "Campus Confession Wall"
   ```

2. **Install Backend Dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Open in Browser**
   ```
   http://localhost:5500
   ```

## Usage

### Creating a Sticky Note
1. Click anywhere on the canvas
2. A new sticky note appears in a random color
3. Type your message in the note
4. Drag to reposition
5. The note automatically saves (with 500ms delay)

### Submitting a Confession
1. Click the "Next" button on a sticky note
2. Fill in the confession form:
   - Your name
   - Your email
   - Your confession/message
3. Click "Submit"
4. The note becomes read-only with a red pinned indicator

### Deleting a Note
1. Click the "Delete" button (trash icon) on a sticky note
2. The note is immediately removed

### Viewing History
1. Click "View History" button
2. Browse all submitted confessions

## Architecture

The application uses **Modern View Controller (MVVC)** pattern:

```
Frontend/
├── js/core/
│   └── BaseViewController.js       # Lifecycle management
├── js/services/
│   └── AppService.js              # API & data management (singleton)
├── js/views/
│   ├── StickyNoteView.js         # Note rendering
│   └── ConfessionModalView.js    # Modal rendering
├── js/viewControllers/
│   ├── CanvasViewController.js    # Canvas business logic
│   └── ConfessionViewController.js # Confession flow logic
└── js/app/
    └── AppDelegate.js             # Application coordinator
```

### Key Components

**AppService (Singleton)**
- Centralized API communication
- Local data caching
- Prevents duplicate API calls

**ViewControllers**
- Manage user interactions
- Handle business logic
- Coordinate with services and views

**Views**
- Pure presentational components
- No business logic
- Handle rendering and styling

## API Endpoints

### Sticky Notes
- `GET /api/sticky-notes` - Get all notes
- `POST /api/sticky-notes` - Create new note
- `PUT /api/sticky-notes/:id` - Update note
- `DELETE /api/sticky-notes/:id` - Delete note

### Confessions
- `GET /api/confessions` - Get all confessions
- `POST /api/confessions` - Submit confession

See [docs/API.md](./docs/API.md) for detailed documentation.

## Project Structure

```
Campus Confession Wall/
├── Backend/                       # Express server & database
│   ├── server.js
│   ├── database.js
│   ├── package.json
│   ├── models/                   # Data models
│   ├── routes/                   # API routes
│   ├── controllers/              # Business logic
│   ├── middleware/               # Middleware
│   └── utils/                    # Utilities
├── Frontend/                      # Web application
│   ├── index.html                # Main page
│   ├── history.html              # History page
│   ├── js/                       # MVVC architecture
│   ├── assets/                   # CSS, images, fonts
│   └── style.css                 # Styles
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # Architecture details
│   ├── API.md                    # API documentation
│   └── SETUP.md                  # Setup guide
├── config/                       # Configuration files
└── scripts/                      # Utility scripts
```

## Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - Detailed architecture and design patterns
- [API Documentation](./docs/API.md) - Complete API endpoint reference
- [Setup Guide](./docs/SETUP.md) - Installation and deployment instructions

## Key Features & Implementation

### Data Persistence
- **Debouncing**: 500ms delay on textarea input to prevent rapid saves
- **Blur Event Flushing**: Immediate save when leaving a note (before navigation)
- **Position Persistence**: Note positions and dimensions saved to database
- **Submitted Status Tracking**: Database tracks which notes have confessions

### User Experience
- Smooth drag-to-reposition functionality
- Automatic note creation on canvas click
- Real-time visual feedback (colors, indicators)
- Read-only mode for submitted notes
- Confessions persist and survive page reloads

## Development

### Git Workflow
```bash
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

### Running Tests
```bash
cd Backend
npm test
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5500 in use | Change port in `.env` or stop other services |
| Database locked | Delete `campus_confessions.db` and restart |
| Styles not loading | Clear browser cache (Ctrl+Shift+R) |
| Notes not saving | Check browser console for errors |

## Future Enhancements

- [ ] User authentication and accounts
- [ ] Real-time collaboration with WebSockets
- [ ] Reaction emojis to confessions
- [ ] Search and filter confessions
- [ ] Admin moderation panel
- [ ] Analytics and statistics
- [ ] Mobile-responsive design
- [ ] Dark mode

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check the [Setup Guide](./docs/SETUP.md)
2. Review [API Documentation](./docs/API.md)
3. Check the [Architecture Guide](./docs/ARCHITECTURE.md)

---

**Made with ❤️ for campus communities**
