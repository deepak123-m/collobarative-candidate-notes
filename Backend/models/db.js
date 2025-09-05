const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');


let db = null;

const initDb = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(PROCESS.ENV.dbConnection, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables().then(resolve).catch(reject);
      }
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) return reject(err);
      
      db.run(`CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`, (err) => {
        if (err) return reject(err);
        
        db.run(`CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          candidate_id INTEGER,
          user_id INTEGER,
          message TEXT NOT NULL,
          tags TEXT, -- JSON array of user IDs
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(candidate_id) REFERENCES candidates(id),
          FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
          if (err) return reject(err);
          
          db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            note_id INTEGER,
            candidate_id INTEGER,
            is_read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(note_id) REFERENCES notes(id),
            FOREIGN KEY(candidate_id) REFERENCES candidates(id)
          )`, (err) => {
            if (err) return reject(err);
            
            db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
              if (err) return reject(err);
              
              if (row.count === 0) {
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                db.run(
                  "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                  ["Admin User", "admin@example.com", hashedPassword],
                  (err) => {
                    if (err) return reject(err);
                    console.log("Default admin user created");
                    resolve();
                  }
                );
              } else {
                resolve();
              }
            });
          });
        });
      });
    });
  });
};

const getDb = () => db;

module.exports = { initDb, getDb };