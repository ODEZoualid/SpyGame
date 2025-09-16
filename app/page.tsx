'use client';

import { useState } from 'react';

interface GameState {
  players: number;
  currentPlayer: number;
  category: string;
  word: string;
  spyIndex: number;
  phase: 'spy-assignment' | 'word-reveal' | 'questions' | 'voting' | 'results';
  timeRemaining: number;
  questionOrder: number[];
  currentQuestionIndex: number;
  votes: { [key: number]: number };
  gameStartTime: number;
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [players, setPlayers] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState('الأكل');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSpyAssignment, setShowSpyAssignment] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

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

  const startGame = () => {
    const category = categories.find(c => c.name === selectedCategory);
    if (!category) return;
    
    const spyIndex = Math.floor(Math.random() * players);
    const word = category.words[Math.floor(Math.random() * category.words.length)];
    
    // Create random question order for all players (including spy)
    const questionOrder = Array.from({ length: players }, (_, i) => i);
    for (let i = questionOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
    }
    
    setGameState({
      players,
      currentPlayer: questionOrder[0], // First player in random order
      category: selectedCategory,
      word,
      spyIndex,
      phase: 'spy-assignment',
      timeRemaining: 300, // 5 minutes in seconds
      questionOrder,
      currentQuestionIndex: 0,
      votes: {},
      gameStartTime: Date.now()
    });
    setShowSpyAssignment(true);
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
    
    const newTimer = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        
        const elapsed = Math.floor((Date.now() - prev.gameStartTime) / 1000);
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
    setGameState(null);
    setShowSpyAssignment(false);
    setShowWord(false);
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

  const showWordToOthers = () => {
    setShowSpyAssignment(false);
    setShowWord(true);
    setGameState(prev => prev ? { ...prev, phase: 'word-reveal' } : prev);
  };

  const startQuestions = () => {
    setShowWord(false);
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
              <input
                type="number"
                min="3"
                max="10"
                value={players}
                onChange={(e) => setPlayers(parseInt(e.target.value) || 3)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              />
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
              disabled={players < 3}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              بدا اللعبة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'game' && gameState) {
    // Phase 1: Randomly assign spy (everyone sees this)
    if (gameState.phase === 'spy-assignment' && showSpyAssignment) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                اختيار الجاسوس
              </h1>
              <p className="text-gray-600 mb-8">
                سيتم اختيار الجاسوس عشوائياً الآن
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[200px] flex items-center justify-center mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🎲</div>
                <h2 className="text-3xl font-bold text-purple-600 mb-4">
                  الجاسوس هو اللاعب {gameState.spyIndex + 1}
                </h2>
                <p className="text-gray-600 mb-4">
                  اللاعب {gameState.spyIndex + 1} هو الجاسوس!
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  الجاسوس ما يعرفش الكلمة و لازم يعرفها من الأسئلة
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">ترتيب الأسئلة:</p>
                  <div className="flex justify-center space-x-2">
                    {gameState.questionOrder.map((playerIndex, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          playerIndex === gameState.spyIndex
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {playerIndex + 1}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    اللاعب {gameState.questionOrder[0] + 1} يبدأ أولاً
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={showWordToOthers}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              فهمت - شوف الكلمة
            </button>
          </div>
        </div>
      );
    }

    // Phase 2: Show word to everyone except spy
    if (gameState.phase === 'word-reveal' && showWord) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                الكلمة للجميع (عدا الجاسوس)
              </h1>
              <p className="text-gray-600 mb-8">
                كل اللاعبين عدا الجاسوس (اللاعب {gameState.spyIndex + 1}) يجب أن يروا الكلمة
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[200px] flex items-center justify-center mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-3xl font-bold text-blue-600 mb-4">
                  {gameState.word}
                </h2>
                <p className="text-gray-600">
                  هاد هي الكلمة اللي لازم تسألوا عليها
                </p>
                <p className="text-sm text-red-500 mt-2">
                  الجاسوس (اللاعب {gameState.spyIndex + 1}) ما يلزمش يشوف هاد الشاشة!
                </p>
              </div>
            </div>

            <button
              onClick={startQuestions}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              الكل شاف الكلمة - بدا الأسئلة
            </button>
          </div>
        </div>
      );
    }

            // Phase 3: Questions phase (no word/spy shown)
            if (gameState.phase === 'questions') {
              const allPlayersAsked = gameState.currentQuestionIndex >= gameState.questionOrder.length - 1;
              
              return (
                <div className="min-h-screen bg-gray-50 p-6">
                  <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                      <h1 className="text-xl font-bold text-gray-900">
                        {allPlayersAsked ? 'انتهت الأسئلة' : `اللاعب ${gameState.currentPlayer + 1}`}
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
                        {allPlayersAsked ? (
                          <>
                            <div className="text-6xl mb-4">⏰</div>
                            <h2 className="text-2xl font-bold text-gray-700 mb-4">
                              كل اللاعبين سألوا
                            </h2>
                            <p className="text-gray-600 mb-4">
                              انتظروا انتهاء الوقت أو اتفقوا على التصويت
                            </p>
                            <p className="text-sm text-gray-500">
                              الجاسوس (اللاعب {gameState.spyIndex + 1}) ما يعرفش الكلمة و لازم يعرفها!
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-6xl mb-4">❓</div>
                            <h2 className="text-2xl font-bold text-gray-700 mb-4">
                              دورك تسأل
                            </h2>
                            <p className="text-gray-600">
                              اسأل سؤال على الكلمة
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              الجاسوس (اللاعب {gameState.spyIndex + 1}) ما يعرفش الكلمة و لازم يعرفها!
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {!allPlayersAsked ? (
                      <button
                        onClick={nextQuestion}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
                      >
                        السؤال الجاي
                      </button>
                    ) : (
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
                    )}

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

            // Phase 4: Voting phase
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

            // Phase 5: Results phase
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
