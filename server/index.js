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
    const { playerName, category, playersCount } = data;
    const roomCode = generateRoomCode();
    const playerId = socket.id;

    console.log(`Creating room ${roomCode} for ${playerName} with category ${category} and ${playersCount} players`);

    const newRoom = {
      hostId: playerId,
      players: new Map([[playerId, { 
        id: playerId, 
        name: playerName, 
        isHost: true, 
        socketId: socket.id 
      }]]),
      createdAt: Date.now(),
      gameStarted: false,
      selectedCategory: category,
      playersCount: playersCount
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
        
        // Send room information including category and player count
        socket.emit('room-info', {
          selectedCategory: room.selectedCategory || '1',
          playersCount: room.playersCount || 3,
          isHost: player.isHost
        });
        
        // If game has started, send player-specific game data
        if (room.gameStarted && room.gameData) {
          console.log(`🔍 DEBUG: Sending existing game data for ${roomCode} to player ${player.name}`);
          console.log(`🔍 DEBUG: player.playerIndex=${player.playerIndex}, room.gameData.spyIndex=${room.gameData.spyIndex}`);
          
          // Ensure playerIndex is set (fallback to finding index in array)
          if (player.playerIndex === undefined) {
            const playersArray = Array.from(room.players.values());
            const playerIndex = playersArray.findIndex(p => p.id === player.id);
            player.playerIndex = playerIndex >= 0 ? playerIndex : 0;
            console.log(`🔍 DEBUG: Set playerIndex to ${player.playerIndex} for player ${player.name}`);
          }
          
          const playerGameData = {
            ...room.gameData,
            playerIndex: player.playerIndex,
            isSpy: player.playerIndex === room.gameData.spyIndex,
            currentCardFlipper: room.gameData.currentCardFlipper || 0,
            cardsFlipped: room.gameData.cardsFlipped || 0,
            timeRemaining: room.gameData.timeRemaining || 300
          };
          console.log(`🔍 DEBUG: Final playerGameData for ${player.name}:`, playerGameData);
          socket.emit('game-started', playerGameData);
        }
        
        console.log(`Room state sent for ${roomCode}`);
      } else {
        socket.emit('join-error', { message: 'Player not found in room' });
      }
    } else {
      socket.emit('join-error', { message: 'Room not found' });
    }
  });

  // Start game - Server Authoritative
  socket.on('start-game', (data) => {
    const { roomCode, category, playersCount } = data;
    console.log(`🚀 Starting game in room ${roomCode} with category ${category} and ${playersCount} players`);

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

    // Prevent concurrent starts
    if (room.lock) {
      socket.emit('error', { message: 'Game is already starting' });
      return;
    }
    room.lock = true;

    // Server-authoritative role and word assignment
    const spyIndex = Math.floor(Math.random() * playersCount);
    
    // Get real word from category
    const categories = {
      '1': { name: 'الأكل', words: ['الكسكس', 'الطاجين', 'الحريرة', 'البيتزا', 'البرغر', 'السلطة', 'الملوخية', 'الكباب', 'الفتة', 'المحشي', 'الرز', 'اللحم'] },
      '2': { name: 'الحيوانات', words: ['الفيل', 'الدلفين', 'البطريق', 'الأسد', 'النمر', 'الزرافة', 'الغزال', 'القرود', 'الطاووس', 'الفراشة', 'السلحفاة', 'الكنغر'] },
      '3': { name: 'المدن', words: ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة', 'مكناس', 'وجدة', 'تطوان', 'الخميسات', 'بني ملال', 'تازة'] },
      '4': { name: 'الألوان', words: ['الأحمر', 'الأزرق', 'الأخضر', 'الأصفر', 'الوردي', 'البرتقالي', 'البنفسجي', 'الأسود', 'الأبيض', 'الرمادي', 'الذهبي', 'الفضي'] },
      '5': { name: 'البلدان', words: ['المغرب', 'مصر', 'فرنسا', 'إسبانيا', 'أمريكا', 'إنجلترا', 'ألمانيا', 'إيطاليا', 'اليابان', 'الصين', 'البرازيل', 'كندا'] },
      '6': { name: 'الرياضة', words: ['كرة القدم', 'كرة السلة', 'التنس', 'السباحة', 'الجري', 'ركوب الدراجة', 'الملاكمة', 'الكاراتيه', 'الجمباز', 'كرة اليد', 'البيسبول', 'الهوكي'] },
      '7': { name: 'المهن', words: ['الطبيب', 'المعلم', 'المهندس', 'الشرطي', 'النجار', 'الخباز', 'المحامي', 'المحاسب', 'الممرض', 'الطيار', 'الطباخ', 'المحاسب'] },
      '8': { name: 'الأدوات', words: ['المطرقة', 'المفك', 'المقص', 'المفتاح', 'الكماشة', 'المنشار', 'البراغي', 'المسامير', 'الخيط', 'الإبرة', 'الغراء', 'الورق'] },
      '9': { name: 'المواصلات', words: ['السيارة', 'الطائرة', 'القطار', 'الحافلة', 'الدراجة', 'الدراجة النارية', 'الطائرة الشراعية', 'الغواصة', 'القطار السريع', 'الترام', 'المترو', 'الطائرة الورقية'] },
      '10': { name: 'الفواكه', words: ['التفاح', 'الموز', 'البرتقال', 'العنب', 'الفراولة', 'الأناناس', 'المانجو', 'الخوخ', 'الكمثرى', 'الكرز', 'الليمون', 'الرمان'] },
      '11': { name: 'الخضروات', words: ['الطماطم', 'الخيار', 'الجزر', 'البطاطس', 'البصل', 'الثوم', 'الملفوف', 'الخس', 'السبانخ', 'الفلفل', 'القرنبيط', 'الباذنجان'] },
      '12': { name: 'الملابس', words: ['القميص', 'البنطلون', 'الفستان', 'الحذاء', 'القبعة', 'القفازات', 'الجاكيت', 'السترة', 'السراويل', 'البلوزة', 'الكنزة', 'الحزام'] }
    };
    
    const selectedCategoryData = categories[category] || categories['1'];
    const randomWord = selectedCategoryData.words[Math.floor(Math.random() * selectedCategoryData.words.length)];
    
    // Initialize game state
    room.gameData = {
      phase: 'card-flipping',
      category: selectedCategoryData.name,
      playersCount: playersCount,
      spyIndex: spyIndex,
      word: randomWord,
      startTime: Date.now(),
      turnIndex: 0,
      cardsFlipped: 0,
      votes: [],
      timer: { endsAt: null },
      lock: false
    };
    
    // Assign player indices and roles
    const playersArray = Array.from(room.players.values());
    playersArray.forEach((player, index) => {
      player.playerIndex = index;
      player.role = index === spyIndex ? 'spy' : 'player';
      player.word = index === spyIndex ? null : randomWord;
      player.hasFlipped = false;
    });
    
    // Send individualized role assignment to each player
    playersArray.forEach((player) => {
      io.to(player.socketId).emit('role-assigned', {
        role: player.role,
        word: player.word,
        playerIndex: player.playerIndex,
        isSpy: player.role === 'spy'
      });
    });
    
    // Broadcast game started to all players
    io.to(roomCode).emit('game-started', {
      phase: 'card-flipping',
      category: selectedCategoryData.name,
      playersCount: playersCount,
      turnIndex: 0,
      cardsFlipped: 0
    });
    
    console.log(`🎮 Game started in room ${roomCode} with spy at index ${spyIndex}, word: ${randomWord}`);
    console.log(`👥 Players: ${playersArray.map(p => `${p.name}(${p.playerIndex}) - ${p.role}`).join(', ')}`);
    console.log(`🕵️ Spy is player: ${playersArray[spyIndex]?.name} (index ${spyIndex})`);
    console.log(`🔧 Backend version: 3.0 - Server Authoritative`);
  });

  // Handle card flip - Server Enforced Turn Order
  socket.on('card-flipped', (data) => {
    const { roomCode } = data;
    console.log(`🃏 Card flipped event received for room ${roomCode}`);
    
    const room = rooms.get(roomCode);
    if (!room || !room.gameStarted) {
      console.log(`❌ Room ${roomCode} not found or game not started`);
      return;
    }

    // Find the player who sent this event
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player) {
      console.log(`❌ Player not found in room ${roomCode}`);
      return;
    }

    // Validate it's their turn
    if (room.gameData.phase !== 'card-flipping') {
      console.log(`❌ Not in card-flipping phase`);
      return;
    }

    if (player.playerIndex !== room.gameData.turnIndex) {
      console.log(`❌ Not player ${player.playerIndex}'s turn, current turn: ${room.gameData.turnIndex}`);
      return;
    }

    if (player.hasFlipped) {
      console.log(`❌ Player ${player.playerIndex} already flipped`);
      return;
    }

    // Mark player as flipped
    player.hasFlipped = true;
    room.gameData.cardsFlipped += 1;

    console.log(`🃏 Player ${player.playerIndex} (${player.name}) flipped card in room ${roomCode}`);

    // Send reveal to this player only
    io.to(socket.id).emit('reveal-card', {
      role: player.role,
      word: player.word,
      isSpy: player.role === 'spy'
    });

    // Notify others that this player flipped
    io.to(roomCode).emit('player-flipped', {
      playerIndex: player.playerIndex,
      playerName: player.name
    });

    // Check if all players have flipped
    if (room.gameData.cardsFlipped >= room.players.size) {
      console.log(`🎉 All players have flipped! Starting countdown to questions phase in room ${roomCode}`);
      
      // Start QA phase after 3 seconds
      setTimeout(() => {
        startQAPhase(room);
      }, 3000);
      
      // Send countdown to all players
      io.to(roomCode).emit('countdown-start', { message: 'مرحلة الأسئلة تبدأ خلال' });
      
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        io.to(roomCode).emit('countdown-update', { count: countdown });
        countdown--;
        
        if (countdown < 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
    } else {
      // Move to next player
      room.gameData.turnIndex += 1;
      io.to(roomCode).emit('turn-changed', { 
        turnIndex: room.gameData.turnIndex,
        currentPlayer: room.gameData.turnIndex
      });
    }
  });

  // Start QA Phase with server-anchored timer
  function startQAPhase(room) {
    const QA_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    room.gameData.phase = 'questions';
    room.gameData.timer.endsAt = Date.now() + QA_DURATION_MS;
    
    console.log(`⏰ Starting QA phase in room ${room.id}, ends at: ${new Date(room.gameData.timer.endsAt).toISOString()}`);
    
    io.to(room.id).emit('phase-changed', { 
      phase: 'questions', 
      endsAt: room.gameData.timer.endsAt 
    });
  }

  // Handle host skip to voting
  socket.on('host-skip', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    if (!room || !room.gameStarted) return;

    // Validate only host can skip
    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player || player.socketId !== room.hostId) {
      socket.emit('error', { message: 'Only host can skip timer' });
      return;
    }

    console.log(`⏭️ Host skipped timer in room ${roomCode}`);
    
    room.gameData.phase = 'voting';
    room.gameData.timer.endsAt = null;
    
    io.to(roomCode).emit('phase-changed', { phase: 'voting' });
  });

  // Handle voting
  socket.on('cast-vote', (data) => {
    const { roomCode, votedIndex } = data;
    const room = rooms.get(roomCode);
    if (!room || !room.gameStarted) return;

    if (room.gameData.phase !== 'voting') {
      socket.emit('error', { message: 'Not in voting phase' });
      return;
    }

    // Find the voter
    const voter = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!voter) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    // Check if already voted
    const existingVote = room.gameData.votes.find(v => v.voter === voter.playerIndex);
    if (existingVote) {
      socket.emit('error', { message: 'You already voted' });
      return;
    }

    // Add vote
    room.gameData.votes.push({
      voter: voter.playerIndex,
      voted: votedIndex,
      voterName: voter.name
    });

    console.log(`🗳️ Player ${voter.playerIndex} (${voter.name}) voted for player ${votedIndex} in room ${roomCode}`);

    // Broadcast vote update
    io.to(roomCode).emit('vote-updated', {
      votesCount: room.gameData.votes.length,
      totalPlayers: room.players.size
    });

    // Check if all players voted
    if (room.gameData.votes.length >= room.players.size) {
      console.log(`🎯 All votes collected in room ${roomCode}, computing results`);
      computeAndEmitResults(room);
    }
  });

  // Compute and emit voting results
  function computeAndEmitResults(room) {
    const voteCounts = {};
    room.gameData.votes.forEach(vote => {
      voteCounts[vote.voted] = (voteCounts[vote.voted] || 0) + 1;
    });

    // Find most voted player
    const mostVotedPlayer = Object.entries(voteCounts).reduce((a, b) => 
      voteCounts[a[0]] > voteCounts[b[0]] ? a : b, ['0', 0]
    );

    const mostVotedPlayerIndex = parseInt(mostVotedPlayer[0]);
    const spyWon = mostVotedPlayerIndex !== room.gameData.spyIndex;

    const results = {
      spyIndex: room.gameData.spyIndex,
      word: room.gameData.word,
      mostVotedPlayer: mostVotedPlayerIndex,
      voteCounts: voteCounts,
      spyWon: spyWon,
      votes: room.gameData.votes
    };

    console.log(`🏆 Results for room ${room.id}: Spy was player ${room.gameData.spyIndex}, most voted: ${mostVotedPlayerIndex}, spy won: ${spyWon}`);

    room.gameData.phase = 'results';
    io.to(room.id).emit('voting-results', results);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 CORS enabled for origins: ${JSON.stringify(corsOptions.origin)}`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
});
