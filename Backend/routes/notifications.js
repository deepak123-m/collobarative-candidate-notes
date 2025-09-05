const express = require('express');
const { getDb } = require('../models/db');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  
  const query = `
    SELECT n.*, c.name as candidate_name, nt.message as note_message,
           u.name as tagged_by_name, nt.created_at as note_created_at
    FROM notifications n
    JOIN candidates c ON n.candidate_id = c.id
    JOIN notes nt ON n.note_id = nt.id
    JOIN users u ON nt.user_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
  `;
  
  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows);
  });
});

router.patch('/:id/read', (req, res) => {
  const db = getDb();
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  db.run(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [notificationId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ message: 'Notification marked as read' });
    }
  );
});

router.post('/mark-all-read', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  
  db.run(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ message: 'All notifications marked as read' });
    }
  );
});

module.exports = router;