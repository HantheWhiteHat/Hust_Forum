const { Server } = require('socket.io');

let io;

const resolveOrigins = () => {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  // Support comma-separated list
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: resolveOrigins(),
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Join user's personal room for notifications
    socket.on('authenticate', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their notification room`);
      }
    });

    socket.on('join_post', (postId) => {
      if (postId) {
        socket.join(`post:${postId}`);
      }
    });

    socket.on('leave_post', (postId) => {
      if (postId) {
        socket.leave(`post:${postId}`);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

// Emit socket event to a specific room
const emitSocketEvent = (event, data, room) => {
  if (io) {
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }
  }
};

module.exports = {
  initSocket,
  getIO,
  emitSocketEvent,
};
