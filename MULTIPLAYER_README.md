# 🎮 التحدي - لعبة الجاسوس المتعددة اللاعبين

A real-time multiplayer spy game built with Next.js 14, Socket.IO, and Express. Players can join live game sessions using 6-digit codes, similar to Kahoot!

## 🚀 New Multiplayer Features

### 🏠 Host System
- **Create Room**: Host creates a game room with a unique 6-digit code
- **QR Code**: Automatic QR code generation for quick player joining
- **Copy Link**: One-click copy of join link for easy sharing
- **Player Management**: Real-time player list with live updates
- **Game Control**: Host controls when to start the game

### 🚪 Join System
- **Room Code Entry**: Players enter 6-digit code to join
- **Direct Links**: Support for direct join links (`/join/483920`)
- **Nickname Entry**: Players enter their display name
- **Error Handling**: Clear error messages for invalid codes or full rooms

### 🎯 Lobby System
- **Live Player List**: Real-time updates when players join/leave
- **Host Controls**: Only host can start the game
- **Player Status**: Visual indicators for host, current player, etc.
- **Game Instructions**: Built-in game rules and instructions

### 🎲 Real-Time Game Flow
- **Synchronized Phases**: All players see the same game phase
- **Card Flipping**: Synchronized card reveal system
- **Questions Phase**: 5-minute timer with real-time updates
- **Voting System**: Real-time voting with live progress
- **Results**: Instant results broadcast to all players

## 🛠️ Technical Architecture

### Backend (Express + Socket.IO)
```
server/
├── server.js          # Main server with Socket.IO
├── package.json       # Server dependencies
├── config.js          # Configuration management
├── railway.json       # Railway deployment config
└── Procfile          # Process file for deployment
```

### Frontend (Next.js 14)
```
app/
├── page.tsx           # Main home page with multiplayer options
├── host/page.tsx      # Host room creation
├── join/page.tsx      # Join room interface
├── join/[code]/page.tsx # Direct join with code
├── lobby/[roomCode]/page.tsx # Live lobby
├── game/[roomCode]/page.tsx  # Real-time game
└── config.ts          # Configuration
```

## 🔧 Socket.IO Events

### Client → Server
- `create-room`: Host creates a new game room
- `join-room`: Player joins existing room
- `start-game`: Host starts the game
- `flip-card`: Player flips their card
- `vote`: Player votes for suspected spy

### Server → Client
- `room-created`: Room successfully created
- `join-success`: Player successfully joined
- `join-error`: Join attempt failed
- `players-updated`: Player list changed
- `game-started`: Game phase started
- `card-flipped`: Card flip progress update
- `phase-changed`: Game phase transition
- `vote-recorded`: Vote was recorded
- `voting-complete`: All votes collected, show results

## 🎮 Game Flow

### 1. Room Creation
1. Host clicks "إنشاء غرفة (متعدد)"
2. Host enters nickname and selects category
3. System generates 6-digit room code
4. QR code and join link are created
5. Host shares code/link with players

### 2. Player Joining
1. Players click "انضم للعبة"
2. Players enter room code and nickname
3. Players are added to live lobby
4. Host sees real-time player list updates

### 3. Game Start
1. Host clicks "بدء اللعبة" when 3+ players joined
2. System generates spy and word randomly
3. All players transition to card-flipping phase
4. Game state is synchronized across all clients

### 4. Card Flipping
1. Each player flips their card privately
2. Spy sees "انتا الجاسوس!" message
3. Others see the actual word
4. Cards show for 2 seconds then flip back
5. Progress is synchronized across all players

### 5. Questions Phase
1. 5-minute timer starts automatically
2. All players can ask questions
3. Timer countdown is synchronized
4. Host can skip to voting if all agree

### 6. Voting Phase
1. All players vote on suspected spy
2. Real-time vote progress updates
3. Results calculated when all votes in
4. Winner determined and broadcast

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Deploy to Vercel
vercel --prod

# Environment variables needed:
NEXT_PUBLIC_SERVER_URL=https://your-backend-url.com
```

### Backend (Railway)
```bash
# Deploy to Railway
railway login
railway init
railway up

# Environment variables needed:
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

## 🔧 Development Setup

### Start Backend Server
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:3001
```

### Start Frontend
```bash
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### Full Development
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev
```

## 📱 Mobile Optimization

- **Responsive Design**: Works perfectly on all screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **QR Code Scanning**: Easy room joining via QR codes
- **Real-Time Updates**: Instant synchronization across devices
- **Offline Handling**: Graceful handling of connection issues

## 🎯 Key Features

### Real-Time Synchronization
- All players see the same game state
- Instant updates when players join/leave
- Synchronized timers and phases
- Live voting progress

### Fair Randomization
- Cryptographic random number generation
- History tracking for fair spy selection
- Anti-bias algorithms
- True randomness across all players

### User Experience
- Intuitive Arabic interface
- Clear visual feedback
- Error handling and validation
- Mobile-first design

### Scalability
- Multiple concurrent rooms
- Efficient memory management
- Automatic room cleanup
- Connection handling

## 🔒 Security Features

- **Room Validation**: Server validates all room codes
- **Player Authentication**: Socket-based player identification
- **Input Sanitization**: All inputs are validated
- **Rate Limiting**: Built-in protection against spam
- **CORS Protection**: Proper cross-origin configuration

## 🎨 UI/UX Features

### Host Interface
- Room code display with copy functionality
- QR code for easy sharing
- Live player list with status indicators
- Game control buttons
- Category selection

### Player Interface
- Simple room code entry
- Nickname input with validation
- Live lobby with player updates
- Real-time game synchronization
- Clear phase indicators

### Game Interface
- Card flipping animation
- Timer countdown display
- Voting interface
- Results screen
- Progress indicators

## 🐛 Error Handling

### Connection Issues
- Automatic reconnection attempts
- Graceful degradation
- Clear error messages
- Fallback mechanisms

### Game State
- State validation
- Conflict resolution
- Data consistency
- Recovery mechanisms

### User Input
- Input validation
- Error feedback
- Retry mechanisms
- Clear instructions

## 📊 Performance

### Frontend
- Static generation where possible
- Dynamic imports for code splitting
- Optimized images and assets
- Efficient state management

### Backend
- In-memory storage for speed
- Efficient Socket.IO usage
- Minimal data transfer
- Automatic cleanup

## 🔮 Future Enhancements

### Planned Features
- **Sound Effects**: Audio feedback for actions
- **Custom Categories**: User-defined word categories
- **Game History**: Track previous games
- **Tournament Mode**: Competitive tournaments
- **Spectator Mode**: Watch games without playing

### Technical Improvements
- **Database Integration**: Persistent storage
- **Redis Caching**: Improved performance
- **WebRTC**: Direct peer connections
- **PWA Support**: Offline capabilities
- **Analytics**: Game usage tracking

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Mobile-first responsive design
- Arabic RTL support

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for the Moroccan gaming community**

*دور الهاتف و جد الجاسوس مع الأصدقاء!* 🕵️‍♂️👥
