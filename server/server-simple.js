const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const server = http.createServer(app);

// Get port from environment or default to 3001
const PORT = config.PORT;
const CORS_ORIGIN = config.CORS_ORIGIN;

// CORS configuration - allow both old and new Vercel URLs
const allowedOrigins = [
  CORS_ORIGIN,
  'https://spy-game-darija-m8orivjr9-vievimie-3261s-projects.vercel.app',
  'https://spy-game-darija.vercel.app'
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

// In-memory storage for game rooms
const gameRooms = new Map();
const playerSockets = new Map();

// Game room management
class GameRoom {
  constructor(roomCode, hostId) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.players = new Map();
    this.gameState = {
      phase: 'lobby',
      currentPlayer: 0,
      spyIndex: -1,
      word: '',
      category: '',
      timeRemaining: 300,
      questionOrder: [],
      currentQuestionIndex: 0,
      votes: {},
      cardsFlipped: 0,
      currentCardFlipper: 0,
      spyHistory: []
    };
    this.createdAt = Date.now();
  }

  addPlayer(playerId, nickname, socketId) {
    this.players.set(playerId, {
      id: playerId,
      nickname,
      socketId,
      isHost: playerId === this.hostId,
      hasVoted: false,
      cardFlipped: false,
      isConnected: true
    });
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getPlayerCount() {
    return this.players.size;
  }

  isHost(playerId) {
    return playerId === this.hostId;
  }

  static generateRoomCode() {
    let code;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (gameRooms.has(code));
    return code;
  }
}

// Utility functions
const generatePlayerId = () => uuidv4();
const generateRoomCode = () => GameRoom.generateRoomCode();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    rooms: gameRooms.size,
    players: playerSockets.size
  });
});

app.get('/api/rooms/:code', (req, res) => {
  const { code } = req.params;
  const room = gameRooms.get(code);
  
  console.log(`API check for room ${code}: ${room ? 'found' : 'not found'}`);
  console.log(`Available rooms: ${Array.from(gameRooms.keys()).join(', ')}`);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const players = room.getAllPlayers();
  console.log(`Room ${code} players:`, players);
  
  res.json({
    roomCode: room.roomCode,
    playerCount: room.getPlayerCount(),
    players: players,
    maxPlayers: 9,
    gameState: room.gameState.phase
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Join room
  socket.on('join-room', (data) => {
    const { roomCode, nickname } = data;
    console.log(`Join attempt: Room ${roomCode} by ${nickname}`);
    console.log(`Available rooms: ${Array.from(gameRooms.keys()).join(', ')}`);
    
    const room = gameRooms.get(roomCode);
    
    if (!room) {
      console.log(`Room ${roomCode} not found in gameRooms`);
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    
    // If room was marked as empty, reactivate it
    if (room.isEmpty) {
      room.isEmpty = false;
      room.emptyAt = null;
      console.log(`Room ${roomCode} reactivated`);
    }
    
    if (room.getPlayerCount() >= 9) {
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }
    
    // Simple approach: always create a new player
    const playerId = generatePlayerId();
    room.addPlayer(playerId, nickname, socket.id);
    console.log(`Player ${nickname} added with ID ${playerId}`);
    
    // Check if player count exceeds limit
    if (room.getPlayerCount() > 9) {
      console.log(`Room ${roomCode} has too many players: ${room.getPlayerCount()}`);
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }
    
    playerSockets.set(socket.id, { playerId, roomCode });
    
    socket.join(roomCode);
    socket.emit('join-success', { playerId, isHost: room.isHost(playerId) });
    
    console.log(`Player ${nickname} joined room ${roomCode}`);
    
    // Broadcast updated player list to all players in room
    const allPlayers = room.getAllPlayers();
    console.log(`Broadcasting players to room ${roomCode}:`, allPlayers);
    console.log(`Room ${roomCode} has ${room.getPlayerCount()} players total`);
    console.log(`Player details:`, allPlayers.map(p => `${p.nickname} (${p.id}) - connected: ${p.isConnected}`));
    io.to(roomCode).emit('players-updated', allPlayers);
    
    console.log(`Player ${nickname} joined room ${roomCode}`);
  });

  // Get room state
  socket.on('get-room-state', (data) => {
    const { roomCode } = data;
    const room = gameRooms.get(roomCode);
    
    if (room) {
      const allPlayers = room.getAllPlayers();
      console.log(`Sending room state for ${roomCode}:`, allPlayers);
      socket.emit('players-updated', allPlayers);
    } else {
      console.log(`Room ${roomCode} not found for get-room-state`);
    }
  });

  // Create room
  socket.on('create-room', (data) => {
    const { nickname } = data;
    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();
    
    const room = new GameRoom(roomCode, playerId);
    room.addPlayer(playerId, nickname, socket.id);
    gameRooms.set(roomCode, room);
    playerSockets.set(socket.id, { playerId, roomCode });
    
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, playerId });
    
    // Broadcast initial player list to host
    const initialPlayers = room.getAllPlayers();
    console.log(`Broadcasting initial players to host:`, initialPlayers);
    socket.emit('players-updated', initialPlayers);
    
    console.log(`Room ${roomCode} created by ${nickname}`);
    console.log(`Total rooms now: ${gameRooms.size}`);
    console.log(`Room stored: ${gameRooms.has(roomCode)}`);
  });

  // Start game
  socket.on('start-game', (data) => {
    const { roomCode, category, players } = data;
    console.log(`Start game request: Room ${roomCode}, Category ${category}, Players ${players}`);
    
    const room = gameRooms.get(roomCode);
    const playerInfo = playerSockets.get(socket.id);
    
    if (!room) {
      console.log(`Room ${roomCode} not found for start game`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    console.log(`Player info for socket ${socket.id}:`, playerInfo);
    console.log(`Room host ID: ${room.hostId}`);
    console.log(`Is host check: ${room.isHost(playerInfo?.playerId)}`);
    
    if (!playerInfo || !room.isHost(playerInfo.playerId)) {
      console.log(`Unauthorized start game attempt by ${socket.id}`);
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }
    
    // Initialize game state
    room.gameState.phase = 'card-flipping';
    room.gameState.category = category;
    room.gameState.players = players;
    
    // Generate spy and word
    const spyIndex = Math.floor(Math.random() * players);
    room.gameState.spyIndex = spyIndex;
    
    // Generate random word from category
    const categories = {
      'الأكل': ['الكسكس', 'الطاجين', 'الحريرة', 'البيتزا', 'البرغر', 'السلطة', 'الملوخية', 'الكباب', 'الفتة', 'المحشي', 'الرز', 'اللحم'],
      'الحيوانات': ['الفيل', 'الدلفين', 'البطريق', 'الأسد', 'النمر', 'الزرافة', 'الغزال', 'القرود', 'الطاووس', 'الفراشة', 'السلحفاة', 'الكنغر'],
      'المدن': ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة', 'مكناس', 'وجدة', 'تطوان', 'الخميسات', 'بني ملال', 'تازة'],
      'الألوان': ['الأحمر', 'الأزرق', 'الأخضر', 'الأصفر', 'الوردي', 'البرتقالي', 'البنفسجي', 'الأسود', 'الأبيض', 'الرمادي', 'الذهبي', 'الفضي'],
      'البلدان': ['المغرب', 'مصر', 'فرنسا', 'إسبانيا', 'أمريكا', 'إنجلترا', 'ألمانيا', 'إيطاليا', 'اليابان', 'الصين', 'البرازيل', 'كندا'],
      'الرياضة': ['كرة القدم', 'كرة السلة', 'التنس', 'السباحة', 'الجري', 'ركوب الدراجة', 'الملاكمة', 'الكاراتيه', 'الجمباز', 'كرة اليد', 'البيسبول', 'الهوكي'],
      'المهن': ['الطبيب', 'المعلم', 'المهندس', 'الشرطي', 'النجار', 'الخباز', 'النجار', 'المحامي', 'المحاسب', 'الممرض', 'الطيار', 'الطباخ'],
      'الأدوات': ['المطرقة', 'المفك', 'المقص', 'المفتاح', 'الكماشة', 'المنشار', 'البراغي', 'المسامير', 'الخيط', 'الإبرة', 'الغراء', 'الورق'],
      'المواصلات': ['السيارة', 'الطائرة', 'القطار', 'الحافلة', 'الدراجة', 'الدراجة النارية', 'الطائرة الشراعية', 'الغواصة', 'القطار السريع', 'الترام', 'المترو', 'الطائرة الورقية'],
      'الفواكه': ['التفاح', 'الموز', 'البرتقال', 'العنب', 'الفراولة', 'الأناناس', 'المانجو', 'الخوخ', 'الكمثرى', 'الكرز', 'الليمون', 'الرمان'],
      'الخضروات': ['الطماطم', 'الخيار', 'الجزر', 'البطاطس', 'البصل', 'الثوم', 'الملفوف', 'الخس', 'السبانخ', 'الفلفل', 'القرنبيط', 'الباذنجان'],
      'الملابس': ['القميص', 'البنطلون', 'الفستان', 'الحذاء', 'القبعة', 'القفازات', 'الجاكيت', 'السترة', 'السراويل', 'البلوزة', 'الكنزة', 'الحزام']
    };
    
    const categoryWords = categories[category] || categories['الأكل'];
    room.gameState.word = categoryWords[Math.floor(Math.random() * categoryWords.length)];
    
    // Generate random question order
    room.gameState.questionOrder = Array.from({ length: players }, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    room.gameState.currentPlayer = room.gameState.questionOrder[0];
    
    // Broadcast game start to all players
    console.log(`Broadcasting game-started to room ${roomCode}`);
    console.log(`Players in room:`, room.getAllPlayers().map(p => p.nickname));
    io.to(roomCode).emit('game-started', room.gameState);
    
    console.log(`Game started in room ${roomCode}`);
  });

  // Card flip
  socket.on('flip-card', (data) => {
    const { roomCode } = data;
    const room = gameRooms.get(roomCode);
    const playerInfo = playerSockets.get(socket.id);
    
    if (!room || !playerInfo) return;
    
    const player = room.getPlayer(playerInfo.playerId);
    if (!player) return;
    
    // Mark card as flipped
    player.cardFlipped = true;
    room.gameState.cardsFlipped++;
    
    // Check if all cards are flipped
    if (room.gameState.cardsFlipped >= room.getPlayerCount()) {
      room.gameState.phase = 'questions';
      room.gameState.timeRemaining = 300; // 5 minutes
      
      // Start timer
      setTimeout(() => {
        room.gameState.phase = 'voting';
        room.gameState.timeRemaining = 0;
        io.to(roomCode).emit('phase-changed', { phase: 'voting' });
      }, 300000); // 5 minutes
    }
    
    // Broadcast card flip to all players
    io.to(roomCode).emit('card-flipped', {
      playerId: playerInfo.playerId,
      cardsFlipped: room.gameState.cardsFlipped,
      totalPlayers: room.getPlayerCount()
    });
  });

  // Vote
  socket.on('vote', (data) => {
    const { roomCode, votedPlayerId } = data;
    const room = gameRooms.get(roomCode);
    const playerInfo = playerSockets.get(socket.id);
    
    if (!room || !playerInfo) return;
    
    const player = room.getPlayer(playerInfo.playerId);
    if (!player) return;
    
    // Record vote
    room.gameState.votes[playerInfo.playerId] = votedPlayerId;
    player.hasVoted = true;
    
    // Check if all players have voted
    const allVoted = room.getAllPlayers().every(p => p.hasVoted);
    
    if (allVoted) {
      room.gameState.phase = 'results';
      
      // Calculate results
      const voteCounts = {};
      Object.values(room.gameState.votes).forEach(votedId => {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
      });
      
      const mostVotedPlayer = Object.entries(voteCounts)
        .reduce((a, b) => voteCounts[a[0]] > voteCounts[b[0]] ? a : b, ['0', 0]);
      
      const spyWon = mostVotedPlayer[0] !== room.gameState.spyIndex.toString();
      
      io.to(roomCode).emit('voting-complete', {
        results: {
          spyIndex: room.gameState.spyIndex,
          word: room.gameState.word,
          mostVotedPlayer: parseInt(mostVotedPlayer[0]),
          voteCounts,
          spyWon
        }
      });
    } else {
      // Broadcast vote to all players
      io.to(roomCode).emit('vote-recorded', {
        voterId: playerInfo.playerId,
        votedPlayerId,
        votesRemaining: room.getPlayerCount() - Object.keys(room.gameState.votes).length
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const playerInfo = playerSockets.get(socket.id);
    
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomCode);
      if (room) {
        const player = room.getPlayer(playerInfo.playerId);
        if (player) {
          // Mark player as disconnected but don't remove them immediately
          player.socketId = null;
          player.isConnected = false;
        }
        
        // If host disconnected, assign new host
        if (room.isHost(playerInfo.playerId) && room.getPlayerCount() > 0) {
          const newHost = room.getAllPlayers()[0];
          room.hostId = newHost.id;
          newHost.isHost = true;
        }
        
        // Broadcast updated player list
        io.to(playerInfo.roomCode).emit('players-updated', room.getAllPlayers());
        
        // If room is empty, mark it for cleanup later (don't delete immediately)
        if (room.getPlayerCount() === 0) {
          room.isEmpty = true;
          room.emptyAt = Date.now();
          console.log(`Room ${playerInfo.roomCode} marked as empty`);
        } else {
          console.log(`Room ${playerInfo.roomCode} still has ${room.getPlayerCount()} players`);
        }
      }
      
      playerSockets.delete(socket.id);
    }
    
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Clean up empty rooms every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of gameRooms.entries()) {
    // Delete room if it's been empty for 10 minutes
    if (room.isEmpty && room.emptyAt && now - room.emptyAt > 600000) { // 10 minutes
      gameRooms.delete(code);
      console.log(`Cleaned up empty room: ${code}`);
    }
  }
}, 120000); // 2 minutes

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`Socket.IO server ready`);
});
