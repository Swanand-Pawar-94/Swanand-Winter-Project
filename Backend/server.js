const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5500;

// 1. Tell Express where your static files (CSS, JS) are
// We go up one level from Backend then into Frontend
const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath)); 

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../Frontend')));

// ==================== STICKY NOTES ====================

// GET all sticky notes
app.get('/api/stickynotes', (req, res) => {
  db.all(
    'SELECT * FROM stickynotes',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows || []);
    }
  );
});

// POST create new sticky note
app.post('/api/stickynotes', (req, res) => {
  const { content, x, y, width, height, color, rotation, confessionId } = req.body;

  if (x === undefined || y === undefined) {
    res.status(400).json({ error: 'x and y coordinates are required' });
    return;
  }

  const finalWidth = width || 250;
  const finalHeight = height || 300;
  const finalColor = color || '#FFFF99';
  const finalRotation = rotation || 0;
  const timestamp = Date.now();

  db.run(
    'INSERT INTO stickynotes (content, x, y, width, height, color, rotation, confessionId, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [content || '', x, y, finalWidth, finalHeight, finalColor, finalRotation, this.confessionId || null, timestamp],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        content: content || '',
        x,
        y,
        width: finalWidth,
        height: finalHeight,
        color: finalColor,
        rotation: finalRotation,
        confessionId: this.confessionId || null,
        timestamp,
        createdAt: new Date().toISOString()
      });
    }
  );
});

// UPDATE sticky note
app.put('/api/stickynotes/:id', (req, res) => {
  const { id } = req.params;
  // Only allow updating specific fields
  const allowedFields = ['content', 'x', 'y', 'width', 'height', 'color', 'rotation', 'confessionId'];
  const updates = [];
  const values = [];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update.' });
  }
  updates.push('updatedAt = CURRENT_TIMESTAMP');
  const sql = `UPDATE stickynotes SET ${updates.join(', ')} WHERE id = ?`;
  values.push(id);
  db.run(sql, values, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Sticky note updated', id: parseInt(id) });
  });
});

// DELETE sticky note (protected if confession exists)
app.delete('/api/stickynotes/:id', (req, res) => {
  const { id } = req.params;

  // check for associated confession first
  db.get('SELECT confessionId FROM stickynotes WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row && row.confessionId) {
      // can't delete a note once someone has submitted a confession; admin-only
      res.status(403).json({ error: 'Cannot delete a submitted sticky note' });
      return;
    }

    db.run('DELETE FROM stickynotes WHERE id = ?', [id], (err2) => {
      if (err2) {
        res.status(500).json({ error: err2.message });
        return;
      }
      res.json({ message: 'Sticky note deleted', id: parseInt(id) });
    });
  });
});

// DELETE all sticky notes
app.delete('/api/stickynotes', (req, res) => {
  db.run('DELETE FROM stickynotes', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'All sticky notes deleted' });
  });
});

// ==================== STATS ====================

// GET sticky notes count from last hour
app.get('/history', (req, res) => {
  res.sendFile(path.join(frontendPath, 'history.html'));
}); 
app.get('/api/stickynotes/stats/last-hour', (req, res) => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);

  db.get(
    'SELECT COUNT(*) as count FROM stickynotes WHERE timestamp > ?',
    [oneHourAgo],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ count: row.count });
    }
  );
});

// ==================== CONFESSIONS ====================

// GET all confessions
app.get('/api/confessions', (req, res) => {
  db.all(
    'SELECT * FROM confessions',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows || []);
    }
  );
});

// POST create new confession
app.post('/api/confessions', (req, res) => {
  const { text, writerName, writerEmail, stickyNoteId, timestamp } = req.body;

  db.run(
    'INSERT INTO confessions (text, writerName, writerEmail, stickyNoteId, timestamp) VALUES (?, ?, ?, ?, ?)',
    [text || '', writerName || 'Anonymous', writerEmail || '', stickyNoteId || null, timestamp || Date.now()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        text: text || '',
        writerName: writerName || 'Anonymous',
        writerEmail: writerEmail || '',
        stickyNoteId: stickyNoteId || null,
        timestamp: timestamp || Date.now(),
        createdAt: new Date().toISOString()
      });
    }
  );
});

// PUT update confession
app.put('/api/confessions/:id', (req, res) => {
  const { id } = req.params;
  const { text, writerName, writerEmail } = req.body;

  db.run(
    'UPDATE confessions SET text = ?, writerName = ?, writerEmail = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [text || '', writerName || 'Anonymous', writerEmail || '', id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Confession updated', id: parseInt(id) });
    }
  );
});

// DELETE a confession
app.delete('/api/confessions/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM confessions WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Confession deleted', id: parseInt(id) });
  });
});

// DELETE all confessions
app.delete('/api/confessions/all', (req, res) => {
  db.run('DELETE FROM confessions', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'All confessions deleted' });
  });
});

// ==================== Server startup ====================

app.listen(PORT, () => {
  console.log(`Campus Confession Wall backend running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/stickynotes`);
  console.log(`  POST   /api/stickynotes`);
  console.log(`  PUT    /api/stickynotes/:id`);
  console.log(`  DELETE /api/stickynotes/:id`);
  console.log(`  DELETE /api/stickynotes`);
  console.log(`  GET    /api/stickynotes/stats/last-hour`);
  console.log(`  GET    /api/confessions`);
  console.log(`  POST   /api/confessions`);
  console.log(`  PUT    /api/confessions/:id`);
  console.log(`  DELETE /api/confessions/:id`);
  console.log(`  DELETE /api/confessions/all`);
});
