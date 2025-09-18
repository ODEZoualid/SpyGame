const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const server = http.createServer(app);

// CORS configuration
const io = socketIo(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN
}));
app.use(express.json());

// In-memory storage for game rooms
const gameRooms = new Map();
const playerSockets = new Map(); // Map socket.id to player info

// Game room management
class GameRoom {
  constructor(roomCode, hostId) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.players = new Map(); // playerId -> player info
    this.gameState = {
      phase: 'lobby', // lobby, card-flipping, questions, voting, results
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
      cardFlipped: false
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

  // Generate 6-digit room code
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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/rooms/:code', (req, res) => {
  const { code } = req.params;
  const room = gameRooms.get(code);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    roomCode: room.roomCode,
    playerCount: room.getPlayerCount(),
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
    const room = gameRooms.get(roomCode);
    
    if (!room) {
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    
    if (room.getPlayerCount() >= 9) {
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }
    
    const playerId = generatePlayerId();
    room.addPlayer(playerId, nickname, socket.id);
    playerSockets.set(socket.id, { playerId, roomCode });
    
    socket.join(roomCode);
    socket.emit('join-success', { playerId, isHost: room.isHost(playerId) });
    
    // Broadcast updated player list to all players in room
    io.to(roomCode).emit('players-updated', room.getAllPlayers());
    
    console.log(`Player ${nickname} joined room ${roomCode}`);
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
    
    console.log(`Room ${roomCode} created by ${nickname}`);
  });

  // Start game
  socket.on('start-game', (data) => {
    const { roomCode, category, players } = data;
    const room = gameRooms.get(roomCode);
    
    if (!room || !room.isHost(playerSockets.get(socket.id)?.playerId)) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }
    
    // Initialize game state
    room.gameState.phase = 'card-flipping';
    room.gameState.category = category;
    room.gameState.players = players;
    
    // Generate spy and word (using the same logic as frontend)
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
        room.removePlayer(playerInfo.playerId);
        
        // If host disconnected, assign new host
        if (room.isHost(playerInfo.playerId) && room.getPlayerCount() > 0) {
          const newHost = room.getAllPlayers()[0];
          room.hostId = newHost.id;
          newHost.isHost = true;
        }
        
        // Broadcast updated player list
        io.to(playerInfo.roomCode).emit('players-updated', room.getAllPlayers());
        
        // If room is empty, delete it
        if (room.getPlayerCount() === 0) {
          gameRooms.delete(playerInfo.roomCode);
        }
      }
      
      playerSockets.delete(socket.id);
    }
    
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Clean up empty rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of gameRooms.entries()) {
    if (room.getPlayerCount() === 0 && now - room.createdAt > 300000) { // 5 minutes
      gameRooms.delete(code);
      console.log(`Cleaned up empty room: ${code}`);
    }
  }
}, 300000);

// Start server
server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  console.log(`CORS enabled for: ${config.CORS_ORIGIN}`);
});
