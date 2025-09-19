const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration for production
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? ['https://spy-game-darija-etvy7nzvt-vievimie-3261s-projects.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));

// Socket.IO configuration
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// In-memory storage for rooms and players
const rooms = new Map(); // roomCode -> room data
const playerSockets = new Map(); // socketId -> player data

// Room data structure
class Room {
  constructor(roomCode, hostId, hostName) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.players = new Map(); // socketId -> player data
    this.createdAt = Date.now();
    this.gameState = null;
    this.isGameActive = false;
    
    // Add host as first player
    this.players.set(hostId, {
      id: hostId,
      name: hostName,
      isHost: true,
      isConnected: true,
      joinedAt: Date.now()
    });
  }
  
  addPlayer(socketId, playerName) {
    // Check if player name already exists
    const existingPlayer = Array.from(this.players.values()).find(p => p.name === playerName);
    if (existingPlayer) {
      return { success: false, error: 'Player name already taken' };
    }
    
    this.players.set(socketId, {
      id: socketId,
      name: playerName,
      isHost: false,
      isConnected: true,
      joinedAt: Date.now()
    });
    
    return { success: true };
  }
  
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      this.players.delete(socketId);
      
      // If host disconnected, assign new host
      if (player.isHost && this.players.size > 0) {
        const newHostId = this.players.keys().next().value;
        const newHost = this.players.get(newHostId);
        newHost.isHost = true;
        this.hostId = newHostId;
      }
      
      return player;
    }
    return null;
  }
  
  getPlayersList() {
    return Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      isConnected: player.isConnected
    }));
  }
  
  isHost(socketId) {
    const player = this.players.get(socketId);
    return player ? player.isHost : false;
  }
}

// Helper functions
const generateRoomCode = () => {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
};

const broadcastToRoom = (roomCode, event, data) => {
  const room = rooms.get(roomCode);
  if (room) {
    io.to(roomCode).emit(event, data);
    console.log(`BROADCAST room=${roomCode} event=${event} players=${room.players.size}`);
  }
};

const cleanupEmptyRooms = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  for (const [roomCode, room] of rooms.entries()) {
    if (room.players.size === 0 || (now - room.createdAt) > oneHour) {
      rooms.delete(roomCode);
      console.log(`CLEANUP deleted room=${roomCode}`);
    }
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`CONNECTION socketId=${socket.id} timestamp=${new Date().toISOString()}`);
  
  // Create room
  socket.on('create-room', (data) => {
    try {
      const { playerName } = data;
      
      if (!playerName || playerName.trim().length === 0) {
        socket.emit('error', { message: 'Player name is required' });
        return;
      }
      
      const roomCode = generateRoomCode();
      const room = new Room(roomCode, socket.id, playerName.trim());
      rooms.set(roomCode, room);
      
      // Join socket to room
      socket.join(roomCode);
      
      // Store player socket mapping
      playerSockets.set(socket.id, {
        roomCode,
        playerName: playerName.trim(),
        isHost: true
      });
      
      socket.emit('room-created', { 
        roomCode, 
        playerId: socket.id,
        isHost: true
      });
      
      // Broadcast players list
      broadcastToRoom(roomCode, 'players-updated', room.getPlayersList());
      
      console.log(`CREATE_ROOM_SUCCESS room=${roomCode} hostId=${socket.id} playerName=${playerName.trim()}`);
      
    } catch (error) {
      console.error('CREATE_ROOM_ERROR:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });
  
  // Join room
  socket.on('join-room', (data) => {
    try {
      const { roomCode, playerName } = data;
      
      if (!roomCode || !playerName || playerName.trim().length === 0) {
        socket.emit('join-error', { message: 'Room code and player name are required' });
        return;
      }
      
      const room = rooms.get(roomCode);
      if (!room) {
        socket.emit('join-error', { message: 'Room not found' });
        return;
      }
      
      // Check if player is already in room (reconnection)
      const existingPlayer = Array.from(room.players.values()).find(p => p.name === playerName.trim());
      if (existingPlayer) {
        // Update socket ID for reconnection
        room.players.delete(existingPlayer.id);
        room.players.set(socket.id, {
          ...existingPlayer,
          id: socket.id,
          isConnected: true
        });
        
        // Update player sockets mapping
        playerSockets.set(socket.id, {
          roomCode,
          playerName: playerName.trim(),
          isHost: existingPlayer.isHost
        });
      } else {
        // Add new player
        const result = room.addPlayer(socket.id, playerName.trim());
        if (!result.success) {
          socket.emit('join-error', { message: result.error });
          return;
        }
        
        // Store player socket mapping
        playerSockets.set(socket.id, {
          roomCode,
          playerName: playerName.trim(),
          isHost: false
        });
      }
      
      // Join socket to room
      socket.join(roomCode);
      
      socket.emit('join-success', { 
        playerId: socket.id,
        isHost: room.isHost(socket.id)
      });
      
      // Broadcast updated players list
      broadcastToRoom(roomCode, 'players-updated', room.getPlayersList());
      
      console.log(`JOIN_ROOM_SUCCESS room=${roomCode} playerId=${socket.id} playerName=${playerName.trim()}`);
      
    } catch (error) {
      console.error('JOIN_ROOM_ERROR:', error);
      socket.emit('join-error', { message: 'Failed to join room' });
    }
  });
  
  // Get room state (for reconnections)
  socket.on('get-room-state', (data) => {
    try {
      const { roomCode } = data;
      const room = rooms.get(roomCode);
      
      if (!room) {
        socket.emit('join-error', { message: 'Room not found' });
        return;
      }
      
      const player = room.players.get(socket.id);
      if (!player) {
        socket.emit('join-error', { message: 'You are not in this room' });
        return;
      }
      
      // Send current room state
      socket.emit('players-updated', room.getPlayersList());
      
      console.log(`GET_ROOM_STATE_SUCCESS room=${roomCode} playerId=${socket.id}`);
      
    } catch (error) {
      console.error('GET_ROOM_STATE_ERROR:', error);
      socket.emit('join-error', { message: 'Failed to get room state' });
    }
  });
  
  // Start game
  socket.on('start-game', (data) => {
    try {
      const { roomCode, category, playersCount } = data;
      const room = rooms.get(roomCode);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      if (!room.isHost(socket.id)) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }
      
      if (room.players.size < 3) {
        socket.emit('error', { message: 'Need at least 3 players to start the game' });
        return;
      }
      
      // Generate game state
      const spyIndex = Math.floor(Math.random() * room.players.size);
      const words = {
        'الأكل': ['الكسكس', 'الطاجين', 'الحريرة', 'البيتزا', 'البرغر', 'السلطة'],
        'الحيوانات': ['الفيل', 'الدلفين', 'البطريق', 'الأسد', 'النمر', 'الزرافة'],
        'المدن': ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة']
      };
      
      const categoryWords = words[category] || words['الأكل'];
      const word = categoryWords[Math.floor(Math.random() * categoryWords.length)];
      
      room.gameState = {
        phase: 'card-flipping',
        category,
        word,
        spyIndex,
        playersCount: room.players.size,
        startTime: Date.now()
      };
      
      room.isGameActive = true;
      
      // Broadcast game started
      broadcastToRoom(roomCode, 'game-started', room.gameState);
      
      console.log(`START_GAME_SUCCESS room=${roomCode} spyIndex=${spyIndex} word=${word}`);
      
    } catch (error) {
      console.error('START_GAME_ERROR:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`DISCONNECT socketId=${socket.id} timestamp=${new Date().toISOString()}`);
    
    const playerData = playerSockets.get(socket.id);
    if (playerData) {
      const room = rooms.get(playerData.roomCode);
      if (room) {
        const removedPlayer = room.removePlayer(socket.id);
        if (removedPlayer) {
          console.log(`PLAYER_REMOVED room=${playerData.roomCode} playerName=${removedPlayer.name}`);
          
          // Broadcast updated players list
          broadcastToRoom(playerData.roomCode, 'players-updated', room.getPlayersList());
          
          // If room is empty, mark for cleanup
          if (room.players.size === 0) {
            console.log(`ROOM_EMPTY room=${playerData.roomCode} - will be cleaned up`);
          }
        }
      }
      
      // Remove from player sockets mapping
      playerSockets.delete(socket.id);
    }
  });
});

// Cleanup empty rooms every 5 minutes
setInterval(cleanupEmptyRooms, 5 * 60 * 1000);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 CORS enabled for ${NODE_ENV} environment`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
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
