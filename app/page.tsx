'use client';

import { useState } from 'react';

interface GameState {
  players: number;
  currentPlayer: number;
  category: string;
  word: string;
  spyIndex: number;
  phase: 'card-flipping' | 'questions' | 'voting' | 'results';
  timeRemaining: number;
  questionOrder: number[];
  currentQuestionIndex: number;
  votes: { [key: number]: number };
  gameStartTime: number;
  cardsFlipped: number;
  currentCardFlipper: number;
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [players, setPlayers] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState('الأكل');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSpyAssignment, setShowSpyAssignment] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [cardTimer, setCardTimer] = useState<NodeJS.Timeout | null>(null);
  const [isCardShowing, setIsCardShowing] = useState(false);
  const [spyHistory, setSpyHistory] = useState<number[]>([]);

  const categories = [
    { id: '1', name: 'الأكل', words: ['الكسكس', 'الطاجين', 'الحريرة', 'البيتزا', 'البرغر', 'السلطة', 'الملوخية', 'الكباب', 'الفتة', 'المحشي', 'الرز', 'اللحم'] },
    { id: '2', name: 'الحيوانات', words: ['الفيل', 'الدلفين', 'البطريق', 'الأسد', 'النمر', 'الزرافة', 'الغزال', 'القرود', 'الطاووس', 'الفراشة', 'السلحفاة', 'الكنغر'] },
    { id: '3', name: 'المدن', words: ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة', 'مكناس', 'وجدة', 'تطوان', 'الخميسات', 'بني ملال', 'تازة'] },
    { id: '4', name: 'الألوان', words: ['الأحمر', 'الأزرق', 'الأخضر', 'الأصفر', 'الوردي', 'البرتقالي', 'البنفسجي', 'الأسود', 'الأبيض', 'الرمادي', 'الذهبي', 'الفضي'] },
    { id: '5', name: 'البلدان', words: ['المغرب', 'مصر', 'فرنسا', 'إسبانيا', 'أمريكا', 'إنجلترا', 'ألمانيا', 'إيطاليا', 'اليابان', 'الصين', 'البرازيل', 'كندا'] },
    { id: '6', name: 'الرياضة', words: ['كرة القدم', 'كرة السلة', 'التنس', 'السباحة', 'الجري', 'ركوب الدراجة', 'الملاكمة', 'الكاراتيه', 'الجمباز', 'كرة اليد', 'البيسبول', 'الهوكي'] },
    { id: '7', name: 'المهن', words: ['الطبيب', 'المعلم', 'المهندس', 'الشرطي', 'النجار', 'الخباز', 'النجار', 'المحامي', 'المحاسب', 'الممرض', 'الطيار', 'الطباخ'] },
    { id: '8', name: 'الأدوات', words: ['المطرقة', 'المفك', 'المقص', 'المفتاح', 'الكماشة', 'المنشار', 'البراغي', 'المسامير', 'الخيط', 'الإبرة', 'الغراء', 'الورق'] },
    { id: '9', name: 'المواصلات', words: ['السيارة', 'الطائرة', 'القطار', 'الحافلة', 'الدراجة', 'الدراجة النارية', 'الطائرة الشراعية', 'الغواصة', 'القطار السريع', 'الترام', 'المترو', 'الطائرة الورقية'] },
    { id: '10', name: 'الفواكه', words: ['التفاح', 'الموز', 'البرتقال', 'العنب', 'الفراولة', 'الأناناس', 'المانجو', 'الخوخ', 'الكمثرى', 'الكرز', 'الليمون', 'الرمان'] },
    { id: '11', name: 'الخضروات', words: ['الطماطم', 'الخيار', 'الجزر', 'البطاطس', 'البصل', 'الثوم', 'الملفوف', 'الخس', 'السبانخ', 'الفلفل', 'القرنبيط', 'الباذنجان'] },
    { id: '12', name: 'الملابس', words: ['القميص', 'البنطلون', 'الفستان', 'الحذاء', 'القبعة', 'القفازات', 'الجاكيت', 'السترة', 'السراويل', 'البلوزة', 'الكنزة', 'الحزام'] }
  ];

  // Ultra-powerful randomization system for truly fair spy selection
  const getUltraRandomInt = (max: number) => {
    // Use crypto.getRandomValues as primary source if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    }
    
    // Fallback to enhanced Math.random with multiple entropy sources
    const sources = [];
    
    // Source 1: Performance timing entropy
    const perf = performance.now();
    sources.push(Math.floor(perf * 1000) % max);
    sources.push(Math.floor(perf * 10000) % max);
    sources.push(Math.floor(perf * 100000) % max);
    
    // Source 2: Date entropy
    const now = Date.now();
    sources.push(now % max);
    sources.push((now >> 8) % max);
    sources.push((now >> 16) % max);
    sources.push((now >> 24) % max);
    
    // Source 3: Math.random with multiple attempts
    for (let i = 0; i < 20; i++) {
      sources.push(Math.floor(Math.random() * max));
    }
    
    // Source 4: Additional entropy from Date.now() with different shifts
    const dateEntropy = Date.now();
    sources.push((dateEntropy * 1103515245 + 12345) % max);
    sources.push((dateEntropy * 1664525 + 1013904223) % max);
    
    // Combine all sources using XOR for maximum entropy
    let result = sources[0];
    for (let i = 1; i < sources.length; i++) {
      result = (result ^ sources[i]) % max;
    }
    
    // Additional mixing for extra randomness
    result = (result * 1103515245 + 12345) % max;
    result = (result ^ (result >> 16)) % max;
    result = (result * 0x85ebca6b) % max;
    result = (result ^ (result >> 13)) % max;
    result = (result * 0xc2b2ae35) % max;
    result = (result ^ (result >> 16)) % max;
    
    return Math.abs(result) % max;
  };

  // Ultra-fair spy selection with history tracking
  const getFairSpyIndex = (playerCount: number) => {
    // If no history, use pure random
    if (spyHistory.length === 0) {
      return getUltraRandomInt(playerCount);
    }
    
    // Count how many times each player has been spy recently
    const recentHistory = spyHistory.slice(-20); // Last 20 games
    const spyCounts = new Array(playerCount).fill(0);
    
    recentHistory.forEach(spyIndex => {
      if (spyIndex < playerCount) {
        spyCounts[spyIndex]++;
      }
    });
    
    // Find the minimum count (least frequent)
    const minCount = Math.min(...spyCounts);
    
    // Get all players who have been spy the least
    const leastFrequentPlayers = [];
    for (let i = 0; i < playerCount; i++) {
      if (spyCounts[i] === minCount) {
        leastFrequentPlayers.push(i);
      }
    }
    
    // If all players have been spy equally, use pure random
    if (leastFrequentPlayers.length === playerCount) {
      return getUltraRandomInt(playerCount);
    }
    
    // Otherwise, randomly select from the least frequent players
    return leastFrequentPlayers[getUltraRandomInt(leastFrequentPlayers.length)];
  };

  const startGame = () => {
    const category = categories.find(c => c.name === selectedCategory);
    if (!category) return;
    
    // Stop any existing timer
    stopTimer();
    if (cardTimer) {
      clearTimeout(cardTimer);
      setCardTimer(null);
    }
    
    // Use ultra-fair randomization for truly random spy selection
    const spyIndex = getFairSpyIndex(players);
    const word = category.words[getUltraRandomInt(category.words.length)];
    
    // Track spy history for fairness
    setSpyHistory(prev => [...prev, spyIndex].slice(-20)); // Keep last 20 games
    
    // Create random question order for all players (including spy) using ultra-random shuffle
    const questionOrder = Array.from({ length: players }, (_, i) => i);
    for (let i = questionOrder.length - 1; i > 0; i--) {
      const j = getUltraRandomInt(i + 1);
      [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
    }
    
    setGameState({
      players,
      currentPlayer: questionOrder[0], // First player in random order
      category: selectedCategory,
      word,
      spyIndex,
      phase: 'card-flipping',
      timeRemaining: 300, // 5 minutes in seconds
      questionOrder,
      currentQuestionIndex: 0,
      votes: {},
      gameStartTime: Date.now(),
      cardsFlipped: 0,
      currentCardFlipper: 0
    });
    setShowSpyAssignment(false);
    setShowWord(false);
    setCurrentScreen('game');
  };

  const nextQuestion = () => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const nextQuestionIndex = prev.currentQuestionIndex + 1;
      
      if (nextQuestionIndex < prev.questionOrder.length) {
        return { 
          ...prev, 
          currentQuestionIndex: nextQuestionIndex,
          currentPlayer: prev.questionOrder[nextQuestionIndex]
        };
      } else {
        // All players have asked, but don't start voting yet - wait for timer or agreement
        return { 
          ...prev, 
          currentQuestionIndex: 0,
          currentPlayer: prev.questionOrder[0]
        };
      }
    });
  };

  const skipToVoting = () => {
    setGameState(prev => {
      if (!prev) return prev;
      stopTimer();
      return { ...prev, phase: 'voting', timeRemaining: 0 };
    });
  };

  const startTimer = () => {
    if (timer) clearInterval(timer);
    
    const questionsStartTime = Date.now();
    
    const newTimer = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        
        const elapsed = Math.floor((Date.now() - questionsStartTime) / 1000);
        const timeRemaining = Math.max(0, 300 - elapsed);
        
        if (timeRemaining <= 0) {
          clearInterval(newTimer);
          return { ...prev, phase: 'voting', timeRemaining: 0 };
        }
        
        return { ...prev, timeRemaining };
      });
    }, 1000);
    
    setTimer(newTimer);
  };

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  };

  const resetGame = () => {
    stopTimer();
    if (cardTimer) {
      clearTimeout(cardTimer);
      setCardTimer(null);
    }
    setGameState(null);
    setShowSpyAssignment(false);
    setShowWord(false);
    setIsCardShowing(false);
    setCurrentScreen('home');
  };

  const voteForPlayer = (votedPlayer: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        votes: {
          ...prev.votes,
          [prev.currentPlayer]: votedPlayer
        }
      };
    });
  };

  const nextVoter = () => {
    setGameState(prev => {
      if (!prev) return prev;
      const nextVoterIndex = prev.currentQuestionIndex + 1;
      
      if (nextVoterIndex < prev.questionOrder.length) {
        return {
          ...prev,
          currentQuestionIndex: nextVoterIndex,
          currentPlayer: prev.questionOrder[nextVoterIndex]
        };
      } else {
        // All players in the order have voted, but check if everyone actually voted
        const allPlayersVoted = prev.questionOrder.every(playerIndex => 
          prev.votes[playerIndex] !== undefined
        );
        
        if (allPlayersVoted) {
          return { ...prev, phase: 'results' };
        } else {
          // Go back to first player who hasn't voted
          const firstUnvotedIndex = prev.questionOrder.findIndex(playerIndex => 
            prev.votes[playerIndex] === undefined
          );
          return {
            ...prev,
            currentQuestionIndex: firstUnvotedIndex,
            currentPlayer: prev.questionOrder[firstUnvotedIndex]
          };
        }
      }
    });
  };

  const finishVoting = () => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, phase: 'results' };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const flipCard = () => {
    // Show the card immediately
    setIsCardShowing(true);
    
    setGameState(prev => {
      if (!prev) return prev;
      
      // Show the card result for 3 seconds, then flip back and pass to next player
      const newTimer = setTimeout(() => {
        const nextCardFlipper = prev.currentCardFlipper + 1;
        
        // Hide the card first
        setIsCardShowing(false);
        
        if (nextCardFlipper < prev.players) {
          setGameState(prevState => prevState ? {
            ...prevState,
            currentCardFlipper: nextCardFlipper,
            cardsFlipped: prevState.cardsFlipped + 1
          } : prevState);
        } else {
          // All players have seen their cards, start questions
          setGameState(prevState => prevState ? {
            ...prevState,
            phase: 'questions',
            cardsFlipped: prevState.cardsFlipped + 1,
            currentPlayer: prevState.questionOrder[0]
          } : prevState);
          // Start the timer when questions phase begins
          startTimer();
        }
      }, 2000);
      
      setCardTimer(newTimer);
      
      return {
        ...prev
      };
    });
  };

  const startQuestions = () => {
    setGameState(prev => {
      if (!prev) return prev;
      const updatedState = { ...prev, phase: 'questions' as const };
      startTimer();
      return updatedState;
    });
  };

  if (currentScreen === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => setCurrentScreen('home')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">بدا لعبة</h1>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عدد اللاعبين
              </label>
              <select
                value={players}
                onChange={(e) => setPlayers(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              >
                <option value={3}>3 لاعبين</option>
                <option value={4}>4 لاعبين</option>
                <option value={5}>5 لاعبين</option>
                <option value={6}>6 لاعبين</option>
                <option value={7}>7 لاعبين</option>
                <option value={8}>8 لاعبين</option>
                <option value={9}>9 لاعبين</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name} ({category.words.length} كلمة)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              بدا اللعبة
            </button>
          </div>
        </div>
      </div>
    );
  }

    if (currentScreen === 'game' && gameState) {
      // Phase 1: Card flipping - each player flips the same card
      if (gameState.phase === 'card-flipping') {
        const isSpy = gameState.currentCardFlipper === gameState.spyIndex;
        
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {isCardShowing ? `دور اللاعب ${gameState.currentCardFlipper + 1}` : 'قلب البطاقة'}
                </h1>
                <p className="text-gray-600 mb-4">
                  {isCardShowing ? 'شوف بطاقتك و اقلبها للاعب الجاي' : `اللاعب ${gameState.currentCardFlipper + 1} يقلب البطاقة`}
                </p>
                <p className="text-sm text-gray-500">
                  {gameState.cardsFlipped} من {gameState.players} شافوا البطاقة
                </p>
                {isCardShowing && (
                  <p className="text-sm text-orange-500 mt-2">
                    اقلب البطاقة و اعطيها للاعب الجاي بعد ثانيتين
                  </p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[300px] flex items-center justify-center mb-8">
                <div className="text-center">
                  {isCardShowing ? (
                    isSpy ? (
                      <>
                        <div className="text-8xl mb-6">🕵️</div>
                        <h2 className="text-3xl font-bold text-red-600 mb-4">
                          انتا الجاسوس!
                        </h2>
                        <p className="text-gray-600 mb-4">
                          ما تعرفش الكلمة و لازم تعرفها من الأسئلة
                        </p>
                        <p className="text-sm text-gray-500">
                          لا تخبر أحداً أنك الجاسوس!
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-8xl mb-6">🔍</div>
                        <h2 className="text-3xl font-bold text-blue-600 mb-4">
                          {gameState.word}
                        </h2>
                        <p className="text-gray-600 mb-4">
                          هاد هي الكلمة اللي لازم تسألوا عليها
                        </p>
                        <p className="text-sm text-gray-500">
                          الجاسوس ما يعرفش هاد الكلمة!
                        </p>
                      </>
                    )
                  ) : (
                    <>
                      <div className="text-8xl mb-6">🎴</div>
                      <h2 className="text-2xl font-bold text-gray-700 mb-4">
                        اضغط لقلب البطاقة
                      </h2>
                      <p className="text-gray-600">
                        فقط اللاعب {gameState.currentCardFlipper + 1} يرى ما في البطاقة
                      </p>
                    </>
                  )}
                </div>
              </div>

              {!isCardShowing && (
                <button
                  onClick={flipCard}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
                >
                  قلب البطاقة
                </button>
              )}

              {isCardShowing && (
                <div className="bg-gray-100 text-gray-600 font-medium py-3 px-6 rounded-lg w-full text-lg py-4 text-center">
                  اقلب البطاقة و اعطيها للاعب الجاي...
                </div>
              )}

              <div className="mt-6">
                <p className="text-center text-sm text-gray-600 mb-3">
                  تقدم اللعب
                </p>
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: gameState.players }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i === gameState.currentCardFlipper && !isCardShowing
                          ? 'bg-purple-500'
                          : i < gameState.cardsFlipped
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-center space-x-4 mt-2 text-xs text-gray-500">
                  {Array.from({ length: gameState.players }, (_, i) => (
                    <span
                      key={i}
                      className={`${
                        i < gameState.cardsFlipped
                          ? 'text-green-600 font-bold'
                          : 'text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Phase 2: Questions phase (no word/spy shown)
      if (gameState.phase === 'questions') {
        const allPlayersAsked = gameState.currentQuestionIndex >= gameState.questionOrder.length - 1;
        
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-xl font-bold text-gray-900">
                  مرحلة الأسئلة
                </h1>
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {formatTime(gameState.timeRemaining)}
                </div>
                <p className="text-sm text-gray-600">
                  الوقت المتبقي
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[200px] flex items-center justify-center mb-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">❓</div>
                  <h2 className="text-2xl font-bold text-gray-700 mb-4">
                    اسألوا الأسئلة
                  </h2>
                  <p className="text-gray-600 mb-4">
                    اسألوا أسئلة على الكلمة لتعرفوا من هو الجاسوس
                  </p>
                  <p className="text-sm text-gray-500">
                    الجاسوس ما يعرفش الكلمة و لازم يعرفها!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={skipToVoting}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
                >
                  اتفقنا - نبدأ التصويت
                </button>
                <p className="text-center text-sm text-gray-500">
                  أو انتظروا انتهاء الوقت ({formatTime(gameState.timeRemaining)})
                </p>
              </div>

              <div className="mt-6 flex justify-center space-x-2">
                {Array.from({ length: gameState.players }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i === gameState.currentPlayer && !allPlayersAsked
                        ? 'bg-blue-500'
                        : gameState.questionOrder.slice(0, gameState.currentQuestionIndex + 1).includes(i)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      }

      // Phase 3: Voting phase
      if (gameState.phase === 'voting') {
        const hasVoted = gameState.votes[gameState.currentPlayer] !== undefined;
        const allPlayersVoted = gameState.questionOrder.every(playerIndex => 
          gameState.votes[playerIndex] !== undefined
        );
        const votedCount = Object.keys(gameState.votes).length;
        
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  التصويت
                </h1>
                <p className="text-gray-600">
                  اللاعب {gameState.currentPlayer + 1} يصوت
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {votedCount} من {gameState.players} صوتوا
                </p>
                {!allPlayersVoted && (
                  <p className="text-xs text-orange-500 mt-1">
                    يجب على جميع اللاعبين التصويت قبل عرض النتائج
                  </p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">
                  من تعتقد أنه الجاسوس؟
                </h2>
                
                {hasVoted ? (
                  <div className="text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <p className="text-gray-600 mb-4">
                      صوتت للاعب {gameState.votes[gameState.currentPlayer] + 1}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: gameState.players }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => voteForPlayer(i)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                      >
                        اللاعب {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {hasVoted && !allPlayersVoted && (
                <button
                  onClick={nextVoter}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
                >
                  التصويت الجاي
                </button>
              )}

              {allPlayersVoted && (
                <button
                  onClick={finishVoting}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
                >
                  شوف النتائج
                </button>
              )}

              <div className="mt-6">
                <p className="text-center text-sm text-gray-600 mb-3">
                  تقدم التصويت
                </p>
                <div className="flex justify-center space-x-2">
                  {gameState.questionOrder.map((playerIndex, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i === gameState.currentQuestionIndex
                          ? 'bg-blue-500'
                          : gameState.votes[playerIndex] !== undefined
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-center space-x-4 mt-2 text-xs text-gray-500">
                  {gameState.questionOrder.map((playerIndex, i) => (
                    <span
                      key={i}
                      className={`${
                        gameState.votes[playerIndex] !== undefined
                          ? 'text-green-600 font-bold'
                          : 'text-gray-400'
                      }`}
                    >
                      {playerIndex + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Phase 4: Results phase
      if (gameState.phase === 'results') {
        const voteCounts = Object.values(gameState.votes).reduce((acc, vote) => {
          acc[vote] = (acc[vote] || 0) + 1;
          return acc;
        }, {} as { [key: number]: number });

        // Find the player with the most votes
        const mostVotedPlayer = Object.entries(voteCounts).reduce((a, b) => 
          voteCounts[Number(a[0])] > voteCounts[Number(b[0])] ? a : b, ['0', 0]
        );

        const mostVotedPlayerIndex = Number(mostVotedPlayer[0]);
        const spyWon = mostVotedPlayerIndex !== gameState.spyIndex;

        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  النتائج
                </h1>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {spyWon ? '🎉' : '🕵️'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-700 mb-4">
                    {spyWon ? 'الجاسوس فاز!' : 'الجاسوس انكشف!'}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    الجاسوس كان اللاعب {gameState.spyIndex + 1}
                  </p>
                  <p className="text-gray-600 mb-4">
                    الكلمة كانت: <span className="font-bold text-blue-600">{gameState.word}</span>
                  </p>
                  <p className="text-gray-600 mb-4">
                    أكثر لاعب تم التصويت عليه: اللاعب {mostVotedPlayerIndex + 1} ({mostVotedPlayer[1]} صوت)
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">
                  نتائج التصويت
                </h3>
                {Object.entries(voteCounts).map(([player, votes]) => (
                  <div key={player} className="flex justify-between items-center py-2">
                    <span className="text-gray-600">اللاعب {Number(player) + 1}</span>
                    <span className="font-bold text-blue-600">{votes} صوت</span>
                  </div>
                ))}
              </div>

              <button
                onClick={resetGame}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
              >
                لعبة جديدة
              </button>
            </div>
          </div>
        );
      }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          التحدي
        </h1>
        <h2 className="text-xl text-gray-600 mb-8">
          لعبة الجاسوس
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={() => setCurrentScreen('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
          >
            🎮 بدا لعبة
          </button>
          
          <button
            onClick={() => alert('الفئات - قريباً!')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 w-full text-lg py-4"
          >
            📂 الفئات
          </button>
          
          <button
            onClick={() => alert('كيفاش نلعب - قريباً!')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 w-full text-lg py-4"
          >
            ❓ كيفاش نلعب
          </button>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>دور الهاتف و جد الجاسوس!</p>
        </div>
      </div>
    </div>
  );
}
