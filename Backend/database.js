const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'confessions.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create sticky notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS stickynotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      width INTEGER NOT NULL DEFAULT 250,
      height INTEGER NOT NULL DEFAULT 300,
      color TEXT NOT NULL DEFAULT '#FFFF99',
      rotation INTEGER NOT NULL DEFAULT 0,
      confessionId INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (confessionId) REFERENCES confessions(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating stickynotes table:', err);
  });

  // ensure confessionId column exists for older databases
  db.run(`ALTER TABLE stickynotes ADD COLUMN confessionId INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding confessionId column to stickynotes table:', err);
    }
  });

  // Create confessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS confessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      writerName TEXT DEFAULT 'Anonymous',
      writerEmail TEXT,
      stickyNoteId INTEGER,
      timestamp BIGINT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stickyNoteId) REFERENCES stickynotes(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating confessions table:', err);
  });

  console.log('Database tables initialized');
}

module.exports = db;
