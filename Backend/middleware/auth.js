const jwt = require('jsonwebtoken');
const { getDb } = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    const db = getDb();
    db.get('SELECT id, name, email FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err || !user) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      req.user = user;
      next();
    });
  });
};

module.exports = { authenticateToken };