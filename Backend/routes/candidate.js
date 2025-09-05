const express = require('express');
const { getDb } = require('../models/db');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  
  db.all('SELECT * FROM candidates ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const db = getDb();
  
  db.run(
    'INSERT INTO candidates (name, email, created_by) VALUES (?, ?, ?)',
    [name, email, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create candidate' });
      }
      
      res.status(201).json({
        id: this.lastID,
        name,
        email,
        created_by: req.user.id,
        message: 'Candidate created successfully'
      });
    }
  );
});

router.get('/:id', (req, res) => {
  const db = getDb();
  
  db.get('SELECT * FROM candidates WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(row);
  });
});

router.get('/:id/notes', (req, res) => {
  const db = getDb();
  
  const query = `
    SELECT n.*, u.name as user_name 
    FROM notes n 
    JOIN users u ON n.user_id = u.id 
    WHERE n.candidate_id = ? 
    ORDER BY n.created_at ASC
  `;
  
  db.all(query, [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

router.post('/:id/notes', (req, res) => {
  const { message, tags } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const db = getDb();
  const candidateId = req.params.id;
  const userId = req.user.id;
  
  db.get('SELECT name FROM candidates WHERE id = ?', [candidateId], (err, candidate) => {
    if (err || !candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    db.run(
      'INSERT INTO notes (candidate_id, user_id, message, tags) VALUES (?, ?, ?, ?)',
      [candidateId, userId, message, JSON.stringify(tags || [])],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to add note' });
        }
        
        const noteId = this.lastID;
        
        if (tags && tags.length > 0) {
          const placeholders = tags.map(() => '(?, ?, ?)').join(', ');
          const values = tags.flatMap(taggedUserId => [taggedUserId, noteId, candidateId]);
          
          db.run(
            `INSERT INTO notifications (user_id, note_id, candidate_id) VALUES ${placeholders}`,
            values,
            (err) => {
              if (err) {
                console.error('Failed to create notifications:', err);
              }
            }
          );
        }
        
        db.get(`
          SELECT n.*, u.name as user_name 
          FROM notes n 
          JOIN users u ON n.user_id = u.id 
          WHERE n.id = ?
        `, [noteId], (err, note) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to retrieve note' });
          }
          
          res.status(201).json(note);
        });
      }
    );
  });
});

module.exports = router;