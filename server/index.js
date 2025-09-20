require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === 'production'
    ? ['https://spy-game-darija-9ce2s58tg-vievimie-3261s-projects.vercel.app', 'https://spy-game-darija.vercel.app', 'https://spy-game-darija-ij84kt327-vievimie-3261s-projects.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));

// Socket.IO configuration
const io = socketIo(server, {
  cors: {
    origin: NODE_ENV === 'production'
      ? ['https://spy-game-darija-9ce2s58tg-vievimie-3261s-projects.vercel.app', 'https://spy-game-darija.vercel.app', 'https://spy-game-darija-ij84kt327-vievimie-3261s-projects.vercel.app']
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// In-memory storage
const rooms = new Map();
const playerSockets = new Map();

// Helper to generate 6-digit room code
const generateRoomCode = () => {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
};

// Helper to broadcast players list
const broadcastPlayers = (roomCode) => {
  const room = rooms.get(roomCode);
  if (room) {
    const playersList = Array.from(room.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost
    }));
    io.to(roomCode).emit('players-updated', playersList);
    console.log(`[${roomCode}] Players updated: ${playersList.length} players`);
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
  console.log(`Client connected: ${socket.id}`);

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    const playerId = playerSockets.get(socket.id);
    if (!playerId) return;

    // Find and remove player from room
    for (const [roomCode, room] of rooms.entries()) {
      const player = room.players.get(playerId);
      if (player && player.socketId === socket.id) {
        room.players.delete(playerId);
        playerSockets.delete(socket.id);
        
        // If host disconnected, assign new host
        if (room.hostId === playerId) {
          const remainingPlayers = Array.from(room.players.values());
          if (remainingPlayers.length > 0) {
            const newHost = remainingPlayers[0];
            room.hostId = newHost.id;
            newHost.isHost = true;
            console.log(`New host assigned: ${newHost.name}`);
          } else {
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted (no players)`);
            return;
          }
        }
        
        broadcastPlayers(roomCode);
        break;
      }
    }
  });

  // Create room
  socket.on('create-room', (data) => {
    const { playerName } = data;
    const roomCode = generateRoomCode();
    const playerId = socket.id;

    console.log(`Creating room ${roomCode} for ${playerName}`);

    const newRoom = {
      hostId: playerId,
      players: new Map([[playerId, { 
        id: playerId, 
        name: playerName, 
        isHost: true, 
        socketId: socket.id 
      }]]),
      createdAt: Date.now(),
      gameStarted: false
    };
    
    rooms.set(roomCode, newRoom);
    playerSockets.set(socket.id, playerId);
    socket.join(roomCode);
    
    socket.emit('room-created', { roomCode, playerId });
    broadcastPlayers(roomCode);
    
    console.log(`Room ${roomCode} created successfully`);
  });

  // Join room
  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    console.log(`Player ${playerName} joining room ${roomCode}`);

    const room = rooms.get(roomCode);
    if (!room) {
      console.log(`Room ${roomCode} not found`);
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }

    const playerId = socket.id;
    room.players.set(playerId, { 
      id: playerId, 
      name: playerName, 
      isHost: false, 
      socketId: socket.id 
    });
    
    playerSockets.set(socket.id, playerId);
    socket.join(roomCode);
    socket.emit('join-success', { playerId, isHost: false });
    broadcastPlayers(roomCode);
    
    console.log(`Player ${playerName} joined room ${roomCode}`);
  });

  // Get room state
  socket.on('get-room-state', (data) => {
    const { roomCode } = data;
    console.log(`Getting room state for ${roomCode}`);

    const room = rooms.get(roomCode);
    if (room) {
      const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
      if (player) {
        socket.emit('join-success', { playerId: player.id, isHost: player.isHost });
        broadcastPlayers(roomCode);
        
        // If game has started, send game data
        if (room.gameStarted && room.gameData) {
          console.log(`Sending existing game data for ${roomCode}`);
          socket.emit('game-started', room.gameData);
        }
        
        console.log(`Room state sent for ${roomCode}`);
      } else {
        socket.emit('join-error', { message: 'Player not found in room' });
      }
    } else {
      socket.emit('join-error', { message: 'Room not found' });
    }
  });

  // Start game
  socket.on('start-game', (data) => {
    const { roomCode, category, playersCount } = data;
    console.log(`Starting game in room ${roomCode}`);

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const playerId = playerSockets.get(socket.id);
    if (room.hostId !== playerId) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }

    if (room.players.size < 3) {
      socket.emit('error', { message: 'Need at least 3 players' });
      return;
    }

    room.gameStarted = true;
    const spyIndex = Math.floor(Math.random() * playersCount);
    
    // Get real word from category
    const categories = {
      '1': { name: 'الأكل', words: ['الكسكس', 'الطاجين', 'الحريرة', 'البيتزا', 'البرغر', 'السلطة', 'المعكرونة', 'السمك', 'اللحم'] },
      '2': { name: 'الحيوانات', words: ['الفيل', 'الدلفين', 'البطريق', 'الأسد', 'النمر', 'الزرافة', 'القرود', 'الطيور', 'الأسماك'] },
      '3': { name: 'المدن', words: ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة', 'مكناس', 'وجدة', 'تطوان'] },
      '4': { name: 'الرياضة', words: ['كرة القدم', 'كرة السلة', 'التنس', 'السباحة', 'الجري', 'ركوب الدراجة', 'الملاكمة', 'الكرة الطائرة', 'الجمباز'] },
      '5': { name: 'الموسيقى', words: ['الغيتار', 'البيانو', 'الطبلة', 'الميكروفون', 'الحفلة', 'الأغنية', 'الرقص', 'الفرقة', 'الحفل'] },
      '6': { name: 'التكنولوجيا', words: ['الهاتف', 'الكمبيوتر', 'الإنترنت', 'التطبيق', 'البرمجة', 'الذكاء الاصطناعي', 'الروبوت', 'الطابعة', 'الكاميرا'] }
    };
    
    const selectedCategoryData = categories[category] || categories['1'];
    const randomWord = selectedCategoryData.words[Math.floor(Math.random() * selectedCategoryData.words.length)];
    
    room.gameData = {
      phase: 'card-flipping',
      category: selectedCategoryData.name,
      playersCount: playersCount,
      spyIndex: spyIndex,
      word: randomWord,
      startTime: Date.now()
    };
    
    // Assign player indices and send game-started to all players
    const playersArray = Array.from(room.players.values());
    playersArray.forEach((player, index) => {
      player.playerIndex = index;
      
      const playerGameData = {
        ...room.gameData,
        playerIndex: player.playerIndex,
        isSpy: player.playerIndex === spyIndex
      };
      io.to(player.socketId).emit('game-started', playerGameData);
    });
    
    console.log(`Game started in room ${roomCode}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 CORS enabled for origins: ${JSON.stringify(corsOptions.origin)}`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
});
