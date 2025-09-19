const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// CORS configuration - allow all origins for testing
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory room registry
const rooms = new Map();

// Helper function to generate 6-digit room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
}

// Helper function to get room by socket ID
function getRoomBySocketId(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    if (room.hostId === socketId || room.players.has(socketId)) {
      return { roomCode, room };
    }
  }
  return null;
}

// Helper function to broadcast players list to room
function broadcastPlayers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const playersList = Array.from(room.players.entries()).map(([socketId, player]) => ({
    id: socketId,
    name: player.name,
    isHost: player.isHost
  }));

  console.log(`BROADCAST_PLAYERS roomCode=${roomCode} players=${playersList.length}`, playersList);
  io.to(roomCode).emit('players-updated', playersList);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`CONNECTION socketId=${socket.id} timestamp=${new Date().toISOString()}`);

  // Create room event
  socket.on('create-room', (data) => {
    const { playerName } = data;
    const roomCode = generateRoomCode();
    
    console.log(`CREATE_ROOM socketId=${socket.id} playerName=${playerName} roomCode=${roomCode}`);
    
    // Create new room
    rooms.set(roomCode, {
      hostId: socket.id,
      players: new Map([[socket.id, { name: playerName, isHost: true }]]),
      createdAt: Date.now()
    });
    
    // Join socket to room
    socket.join(roomCode);
    
    // Send room created response
    socket.emit('room-created', { roomCode, playerId: socket.id });
    
    // Broadcast initial players list
    broadcastPlayers(roomCode);
    
    console.log(`ROOM_CREATED roomCode=${roomCode} hostId=${socket.id}`);
  });

  // Join room event
  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    
    console.log(`JOIN_ROOM socketId=${socket.id} playerName=${playerName} roomCode=${roomCode}`);
    
    const room = rooms.get(roomCode);
    if (!room) {
      console.log(`JOIN_ERROR roomCode=${roomCode} not found`);
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    
    // Check if room is full (max 9 players)
    if (room.players.size >= 9) {
      console.log(`JOIN_ERROR roomCode=${roomCode} is full`);
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }
    
    // Check if player already exists (by name)
    const existingPlayer = Array.from(room.players.values()).find(p => p.name === playerName);
    if (existingPlayer) {
      console.log(`JOIN_ERROR roomCode=${roomCode} playerName=${playerName} already exists`);
      socket.emit('join-error', { message: 'Player name already taken' });
      return;
    }
    
    // Add player to room
    room.players.set(socket.id, { name: playerName, isHost: false });
    
    // Join socket to room
    socket.join(roomCode);
    
    // Send join success response
    socket.emit('join-success', { playerId: socket.id, isHost: false });
    
    // Broadcast updated players list
    broadcastPlayers(roomCode);
    
    console.log(`JOIN_SUCCESS roomCode=${roomCode} playerId=${socket.id} playerName=${playerName}`);
  });

  // Start game event
  socket.on('start-game', (data) => {
    const { roomCode } = data;
    
    console.log(`START_GAME socketId=${socket.id} roomCode=${roomCode}`);
    
    const room = rooms.get(roomCode);
    if (!room) {
      console.log(`START_ERROR roomCode=${roomCode} not found`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Check if socket is the host
    if (room.hostId !== socket.id) {
      console.log(`START_ERROR socketId=${socket.id} not host of roomCode=${roomCode}`);
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }
    
    // Check if enough players (minimum 3)
    if (room.players.size < 3) {
      console.log(`START_ERROR roomCode=${roomCode} not enough players (${room.players.size})`);
      socket.emit('error', { message: 'Need at least 3 players to start' });
      return;
    }
    
    // Generate game data
    const playersList = Array.from(room.players.entries()).map(([socketId, player]) => ({
      id: socketId,
      name: player.name,
      isHost: player.isHost
    }));
    
    const gameData = {
      roomCode,
      players: playersList,
      spyIndex: Math.floor(Math.random() * playersList.length),
      word: 'الكسكس', // Default word for testing
      category: 'الأكل',
      phase: 'card-flipping',
      timeRemaining: 300
    };
    
    // Broadcast game started to all players in room
    io.to(roomCode).emit('game-started', gameData);
    
    console.log(`GAME_STARTED roomCode=${roomCode} players=${playersList.length} spyIndex=${gameData.spyIndex}`);
  });

  // Get room state event
  socket.on('get-room-state', (data) => {
    const { roomCode } = data;
    
    console.log(`GET_ROOM_STATE socketId=${socket.id} roomCode=${roomCode}`);
    
    const room = rooms.get(roomCode);
    if (!room) {
      console.log(`GET_ROOM_STATE_ERROR roomCode=${roomCode} not found`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Send current players list
    broadcastPlayers(roomCode);
    
    console.log(`GET_ROOM_STATE_SUCCESS roomCode=${roomCode} players=${room.players.size}`);
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`DISCONNECT socketId=${socket.id} timestamp=${new Date().toISOString()}`);
    
    // Find room containing this socket
    const roomInfo = getRoomBySocketId(socket.id);
    
    if (roomInfo) {
      const { roomCode, room } = roomInfo;
      
      // If this was the host, remove the entire room
      if (room.hostId === socket.id) {
        console.log(`HOST_DISCONNECTED roomCode=${roomCode} removing room`);
        rooms.delete(roomCode);
        io.to(roomCode).emit('room-closed', { message: 'Host disconnected' });
      } else {
        // If this was a player, remove them from the room
        if (room.players.has(socket.id)) {
          const playerName = room.players.get(socket.id).name;
          room.players.delete(socket.id);
          console.log(`PLAYER_DISCONNECTED roomCode=${roomCode} playerName=${playerName}`);
          
          // Broadcast updated players list
          broadcastPlayers(roomCode);
        }
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    uptime: process.uptime()
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
