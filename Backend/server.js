const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');
const notificationRoutes = require('./routes/notifications');
const { authenticateToken } = require('./middleware/auth');
const { initDb } = require('./models/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use(limiter);

app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/candidates', authenticateToken, candidateRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-candidate', (candidateId) => {
    socket.join(`candidate-${candidateId}`);
    console.log(`User joined candidate room: candidate-${candidateId}`);
  });
  
  socket.on('leave-candidate', (candidateId) => {
    socket.leave(`candidate-${candidateId}`);
    console.log(`User left candidate room: candidate-${candidateId}`);
  });
  
  socket.on('new-note', (data) => {
    socket.to(`candidate-${data.candidateId}`).emit('note-added', data);
    
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(taggedUserId => {
        socket.to(`user-${taggedUserId}`).emit('user-tagged', {
          noteId: data.noteId,
          candidateId: data.candidateId,
          candidateName: data.candidateName,
          message: data.message,
          taggedBy: data.userId
        });
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = { app, io };