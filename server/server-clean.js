const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const server = http.createServer(app);

const PORT = config.PORT;
const CORS_ORIGIN = config.CORS_ORIGIN;

const allowedOrigins = [
  CORS_ORIGIN,
  'https://spy-game-darija.vercel.app',
  'https://spy-game-darija-m8orivjr9-vievimie-3261s-projects.vercel.app',
  'https://spy-game-darija-cjtcl001j-vievimie-3261s-projects.vercel.app',
  'https://spy-game-darija-mv4o338ml-vievimie-3261s-projects.vercel.app',
  'https://spy-game-darija-2tdgf4ou1-vievimie-3261s-projects.vercel.app',
  'https://spy-game-darija-5s9bin23h-vievimie-3261s-projects.vercel.app'
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

class GameRoom {
  constructor(roomCode, hostPlayerId) {
    this.roomCode = roomCode;
    this.hostId = hostPlayerId;
    this.players = new Map(); // Map<playerId, Player>
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
    this.isEmpty = false;
    this.emptyAt = null;
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

  updatePlayerSocket(playerId, socketId) {
    const player = this.players.get(playerId);
    if (player) {
      player.socketId = socketId;
      player.isConnected = true;
    }
  }

  static generateRoomCode() {
    let code;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (gameRooms.has(code));
    return code;
  }
}

const gameRooms = new Map(); // Map<roomCode, GameRoom>
const playerSockets = new Map(); // Map<socketId, {playerId, roomCode}>

const generatePlayerId = () => uuidv4();
const generateRoomCode = () => GameRoom.generateRoomCode();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    rooms: gameRooms.size,
    players: playerSockets.size
  });
});

// Room status endpoint
app.get('/api/rooms/:code', (req, res) => {
  const { code } = req.params;
  const room = gameRooms.get(code);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    roomCode: room.roomCode,
    playerCount: room.getPlayerCount(),
    players: room.getAllPlayers(),
    maxPlayers: 9,
    gameState: room.gameState.phase
  });
});

io.on('connection', (socket) => {
  console.log(`CONN socketId=${socket.id} timestamp=${new Date().toISOString()}`);

  // Create room
  socket.on('create-room', (data) => {
    const { nickname } = data;
    console.log(`CREATE_ROOM_RECV socketId=${socket.id} nickname=${nickname || '-'} timestamp=${new Date().toISOString()}`);
    
    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();
    
    const room = new GameRoom(roomCode, playerId);
    room.addPlayer(playerId, nickname, socket.id);
    gameRooms.set(roomCode, room);
    playerSockets.set(socket.id, { playerId, roomCode });
    
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, playerId });
    
    // Send initial player list to host
    const initialPlayers = room.getAllPlayers();
    socket.emit('players-updated', initialPlayers);
    
    console.log(`Room ${roomCode} created by ${nickname} (${playerId})`);
    console.log(`CREATE_ROOM_RESULT roomCode=${roomCode} playerId=${playerId} players=${JSON.stringify(initialPlayers.map(p => `${p.id}/${p.nickname}/${p.socketId}/${p.isConnected}`))}`);
  });

  // Join room - WITH PROPER DEDUPLICATION
  socket.on('join-room', (data) => {
    const { roomCode, nickname } = data;
    console.log(`JOIN_RECV room=${roomCode} socketId=${socket.id} nickname=${nickname || '-'} timestamp=${new Date().toISOString()}`);
    
    const room = gameRooms.get(roomCode);
    if (!room) {
      console.log(`Room ${roomCode} not found`);
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    
    if (room.getPlayerCount() >= 9) {
      console.log(`Room ${roomCode} is full`);
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }
    
    // Check if player with same nickname already exists
    let playerId = null;
    let isExistingPlayer = false;
    
    for (const [existingPlayerId, player] of room.players.entries()) {
      if (player.nickname === nickname) {
        console.log(`Player ${nickname} already exists, updating socket ID`);
        player.socketId = socket.id;
        player.isConnected = true;
        playerId = existingPlayerId;
        isExistingPlayer = true;
        break;
      }
    }
    
    // If player doesn't exist, create new player
    if (!isExistingPlayer) {
      playerId = generatePlayerId();
      room.addPlayer(playerId, nickname, socket.id);
      console.log(`New player ${nickname} (${playerId}) added to room ${roomCode}`);
    } else {
      console.log(`Existing player ${nickname} (${playerId}) reconnected`);
    }
    
    // Update socket mapping
    playerSockets.set(socket.id, { playerId, roomCode });
    
    socket.join(roomCode);
    socket.emit('join-success', { playerId, isHost: room.isHost(playerId) });
    
    // Broadcast updated player list to all players in room
    const allPlayers = room.getAllPlayers();
    io.to(roomCode).emit('players-updated', allPlayers);
    
    console.log(`Player ${nickname} (${playerId}) joined room ${roomCode}`);
    console.log(`JOIN_RESULT roomCode=${roomCode} playerId=${playerId} isHost=${room.isHost(playerId)} players=${JSON.stringify(allPlayers.map(p => `${p.id}/${p.nickname}/${p.socketId}/${p.isConnected}`))}`);
  });

  // Get room state
  socket.on('get-room-state', (data) => {
    const { roomCode } = data;
    console.log(`GET_ROOM_STATE_RECV room=${roomCode} socketId=${socket.id} timestamp=${new Date().toISOString()}`);
    
    const room = gameRooms.get(roomCode);
    
    if (room) {
      const allPlayers = room.getAllPlayers();
      socket.emit('players-updated', allPlayers);
      console.log(`GET_ROOM_STATE_RESULT roomCode=${roomCode} players=${JSON.stringify(allPlayers.map(p => `${p.id}/${p.nickname}/${p.socketId}/${p.isConnected}`))}`);
    } else {
      console.log(`GET_ROOM_STATE_ERROR roomCode=${roomCode} not found`);
    }
  });

  // Start game
  socket.on('start-game', (data) => {
    const { roomCode, category, players } = data;
    console.log(`START_RECV room=${roomCode} socketId=${socket.id} category=${category || '-'} players=${players || '-'} timestamp=${new Date().toISOString()}`);
    
    const room = gameRooms.get(roomCode);
    const playerInfo = playerSockets.get(socket.id);
    
    if (!room) {
      console.log(`Room ${roomCode} not found for start game`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
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
    
    player.cardFlipped = true;
    room.gameState.cardsFlipped++;
    
    io.to(roomCode).emit('players-updated', room.getAllPlayers());
    io.to(roomCode).emit('game-state-updated', room.gameState);
    
    if (room.gameState.cardsFlipped === room.getPlayerCount()) {
      room.gameState.phase = 'questions';
      io.to(roomCode).emit('game-state-updated', room.gameState);
    }
  });

  // Skip to voting
  socket.on('skip-to-voting', (data) => {
    const { roomCode } = data;
    const room = gameRooms.get(roomCode);
    
    if (!room) return;
    
    room.gameState.phase = 'voting';
    io.to(roomCode).emit('game-state-updated', room.gameState);
  });

  // Vote for player
  socket.on('vote-for-player', (data) => {
    const { roomCode, votedPlayerId } = data;
    const room = gameRooms.get(roomCode);
    const playerInfo = playerSockets.get(socket.id);
    
    if (!room || !playerInfo) return;
    
    const voter = room.getPlayer(playerInfo.playerId);
    if (!voter || voter.hasVoted) return;
    
    voter.hasVoted = true;
    room.gameState.votes[votedPlayerId] = (room.gameState.votes[votedPlayerId] || 0) + 1;
    
    io.to(roomCode).emit('players-updated', room.getAllPlayers());
    io.to(roomCode).emit('game-state-updated', room.gameState);
    
    const allVoted = room.getAllPlayers().every(p => p.hasVoted);
    if (allVoted) {
      room.gameState.phase = 'results';
      io.to(roomCode).emit('game-state-updated', room.gameState);
    }
  });

  // Reset game
  socket.on('reset-game', (data) => {
    const { roomCode } = data;
    const room = gameRooms.get(roomCode);
    const playerInfo = playerSockets.get(socket.id);
    
    if (!room || !playerInfo || !room.isHost(playerInfo.playerId)) return;
    
    room.gameState = {
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
    
    // Reset player specific states
    room.players.forEach(player => {
      player.hasVoted = false;
      player.cardFlipped = false;
    });
    
    io.to(roomCode).emit('game-state-updated', room.gameState);
    io.to(roomCode).emit('players-updated', room.getAllPlayers());
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`DISCONNECT socketId=${socket.id} timestamp=${new Date().toISOString()}`);
    
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
        
        // If room is empty, mark it for cleanup
        if (room.getPlayerCount() === 0) {
          room.isEmpty = true;
          room.emptyAt = Date.now();
          console.log(`Room ${playerInfo.roomCode} marked as empty`);
        }
      }
      
      playerSockets.delete(socket.id);
      console.log(`DISCONNECT_RESULT playerId=${playerInfo.playerId} roomCode=${playerInfo.roomCode} remainingPlayers=${room ? room.getPlayerCount() : 0}`);
    }
    
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Clean up empty rooms every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of gameRooms.entries()) {
    if (room.isEmpty && room.emptyAt && now - room.emptyAt > 600000) { // 10 minutes
      gameRooms.delete(code);
      console.log(`Cleaned up empty room: ${code}`);
    }
  }
}, 120000);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`Socket.IO server ready`);
});
