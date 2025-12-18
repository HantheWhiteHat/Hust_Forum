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

module.exports = {
  initSocket,
  getIO,
};
