# التحدي - لعبة الجاسوس 🕵️‍♂️

A modern, mobile-friendly spy game built with Next.js 14 and TypeScript, featuring a complete card-flipping system, fair randomization, and multiplayer voting mechanics.

## 🎮 Game Overview

**التحدي** (The Challenge) is a digital version of the classic spy game where players must identify the spy among them. The game features a unique card-flipping system where each player privately views their role before the questioning phase begins.

## ✨ Key Features

### 🎴 Card Flipping System
- **Private Role Reveal**: Each player flips a card to see their role (word or spy)
- **2-Second Display**: Cards show for exactly 2 seconds before passing to next player
- **Visual Progress**: Dots show which players have flipped their cards
- **Automatic Progression**: Game automatically moves to questions phase after all cards are flipped

### 🎯 Fair Randomization
- **Ultra-Fair Selection**: Uses cryptographic random numbers with multiple entropy sources
- **History Tracking**: Tracks last 20 games to ensure all players get equal spy opportunities
- **Anti-Bias Logic**: Only selects from players who have been spy least frequently
- **True Randomness**: Falls back to enhanced Math.random with multiple entropy sources

### ⏰ Game Phases
1. **Card Flipping**: Each player privately views their role
2. **Questions**: 5-minute timer with random turn order
3. **Voting**: All players vote on who they think is the spy
4. **Results**: Reveals the spy, word, and voting results

### 🌍 Multi-Language Support
- **Moroccan Darija**: Complete UI in Moroccan Arabic dialect
- **Cultural Categories**: 12 categories with culturally relevant words
- **Localized Interface**: All buttons, messages, and instructions in Darija

## 🛠️ Technical Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: TailwindCSS for responsive design
- **Deployment**: Vercel for production hosting
- **State Management**: React hooks (useState, useEffect)
- **Randomization**: Crypto.getRandomValues + enhanced entropy

## 🎲 Game Categories

The game includes 12 diverse categories with 12 words each:

1. **الأكل** (Food) - كسكس، طاجين، حريرة، بيتزا...
2. **الحيوانات** (Animals) - فيل، دلفين، بطريق، أسد...
3. **المدن** (Cities) - الدار البيضاء، الرباط، فاس، مراكش...
4. **الألوان** (Colors) - أحمر، أزرق، أخضر، أصفر...
5. **البلدان** (Countries) - المغرب، مصر، فرنسا، إسبانيا...
6. **الرياضة** (Sports) - كرة القدم، كرة السلة، تنس، سباحة...
7. **المهن** (Professions) - طبيب، معلم، مهندس، شرطي...
8. **الأدوات** (Tools) - مطرقة، مفك، مقص، مفتاح...
9. **المواصلات** (Transportation) - سيارة، طائرة، قطار، حافلة...
10. **الفواكه** (Fruits) - تفاح، موز، برتقال، عنب...
11. **الخضروات** (Vegetables) - طماطم، خيار، جزر، بطاطس...
12. **الملابس** (Clothes) - قميص، بنطلون، فستان، حذاء...

## 🎯 Game Logic

### Spy Selection Algorithm
```typescript
// Ultra-fair spy selection with history tracking
const getFairSpyIndex = (playerCount: number) => {
  // If no history, use pure random
  if (spyHistory.length === 0) {
    return getUltraRandomInt(playerCount);
  }
  
  // Count recent spy occurrences
  const recentHistory = spyHistory.slice(-20);
  const spyCounts = new Array(playerCount).fill(0);
  
  // Find players who have been spy least frequently
  const minCount = Math.min(...spyCounts);
  const leastFrequentPlayers = spyCounts
    .map((count, index) => count === minCount ? index : -1)
    .filter(index => index !== -1);
  
  // Randomly select from least frequent players
  return leastFrequentPlayers[getUltraRandomInt(leastFrequentPlayers.length)];
};
```

### Randomization System
- **Primary**: `crypto.getRandomValues()` for cryptographic randomness
- **Fallback**: Enhanced Math.random with multiple entropy sources
- **Entropy Sources**: Performance timing, date, multiple random calls
- **Mixing**: XOR combination + additional cryptographic mixing

### Game Flow
1. **Setup**: Select 3-9 players and category
2. **Card Flipping**: Each player flips card to see role (2 seconds)
3. **Questions**: 5-minute timer with random turn order
4. **Voting**: All players vote on suspected spy
5. **Results**: Reveal spy, word, and voting statistics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd SpyGame

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🌐 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Environment Setup
- No environment variables required
- Works out of the box with Vercel
- Automatic HTTPS and CDN

## 📱 Mobile Optimization

- **Responsive Design**: Works perfectly on all screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **Dropdown Selection**: Player count selection via dropdown (3-9 players)
- **Card Flipping**: Optimized for mobile card viewing
- **Timer Display**: Large, clear timer for easy reading

## 🎮 How to Play

### For Players
1. **Setup**: Choose number of players (3-9) and category
2. **Card Phase**: Each player flips card to see their role
3. **Questions**: Ask questions about the word to identify the spy
4. **Voting**: Vote on who you think is the spy
5. **Results**: See who was the spy and who won

### For the Spy
- **Goal**: Figure out the word without revealing you're the spy
- **Strategy**: Ask vague questions, give general answers
- **Winning**: Survive the voting phase without being caught

### For Non-Spies
- **Goal**: Identify the spy through questioning
- **Strategy**: Ask specific questions about the word
- **Winning**: Successfully vote out the spy

## 🔧 Technical Features

### State Management
- **GameState Interface**: Comprehensive state tracking
- **Phase Management**: Card-flipping, questions, voting, results
- **Timer System**: 5-minute countdown with automatic phase transitions
- **Vote Tracking**: Complete voting system with progress indicators

### Performance Optimizations
- **Static Generation**: Pre-rendered pages for fast loading
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Optimized assets and fonts
- **Mobile First**: Responsive design with mobile optimization

### Security Features
- **Cryptographic Random**: Uses crypto.getRandomValues for true randomness
- **Client-Side Only**: No server-side data storage
- **Privacy Focused**: No data collection or tracking

## 🐛 Bug Fixes & Improvements

### Major Fixes Implemented
1. **Blank Page Issue**: Fixed React component rendering
2. **Timer Issues**: Fixed timer not starting in questions phase
3. **Voting Logic**: Fixed voting system to require all players to vote
4. **Randomization Bias**: Implemented truly fair spy selection
5. **Mobile Input**: Replaced problematic number input with dropdown
6. **Card Flipping**: Fixed card getting stuck on player 2
7. **Indentation Errors**: Fixed build-breaking indentation issues

### Performance Improvements
- **Faster Randomization**: Optimized random number generation
- **Better State Management**: Cleaner state updates and transitions
- **Mobile Optimization**: Improved touch interactions and responsiveness
- **Build Optimization**: Reduced bundle size and improved loading

## 📊 Game Statistics

- **Player Range**: 3-9 players
- **Categories**: 12 categories with 12 words each (144 total words)
- **Timer**: 5-minute questions phase
- **Card Display**: 2-second card viewing time
- **History Tracking**: Last 20 games for fair spy selection
- **Voting**: All players must vote before results

## 🎯 Future Enhancements

### Potential Features
- **Custom Categories**: Allow players to add custom word categories
- **Game History**: Track game statistics and player performance
- **Sound Effects**: Add audio feedback for card flips and timer
- **Themes**: Multiple visual themes and color schemes
- **Multiplayer**: Online multiplayer support
- **Tournament Mode**: Competitive tournament system

### Technical Improvements
- **PWA Support**: Progressive Web App capabilities
- **Offline Mode**: Play without internet connection
- **Analytics**: Game usage analytics (privacy-focused)
- **Accessibility**: Enhanced accessibility features
- **Internationalization**: Support for multiple languages

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use TailwindCSS for styling
- Maintain mobile-first responsive design
- Write clear, self-documenting code

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing framework
- **TailwindCSS**: For the utility-first CSS framework
- **Vercel**: For seamless deployment and hosting
- **React Community**: For the excellent ecosystem
- **Moroccan Arabic Community**: For cultural context and language support

---

**Built with ❤️ for the Moroccan gaming community**

*دور الهاتف و جد الجاسوس!* 🕵️‍♂️