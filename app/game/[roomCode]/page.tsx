'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSocket } from '../../lib/socketClient';

interface GameState {
  phase: string;
  category: string;
  word: string;
  spyIndex: number;
  playersCount: number;
  startTime: number;
  playerIndex?: number;
  isSpy?: boolean;
  currentCardFlipper?: number;
  cardsFlipped?: number;
  timeRemaining?: number;
}

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCardShowing, setIsCardShowing] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [votes, setVotes] = useState<{ [key: number]: number }>({});
  const [hasVoted, setHasVoted] = useState(false);

  const roomCode = params.roomCode as string;

  useEffect(() => {
    const newSocket = getSocket();
    setSocket(newSocket);

    console.log('GAME_PAGE_LOADED roomCode=', roomCode);

    // Socket event listeners
    newSocket.on('game-started', (data: GameState) => {
      console.log('🎮 Frontend: GAME_STARTED data=', data);
      console.log('🎮 Frontend: isSpy=', data.isSpy, 'playerIndex=', data.playerIndex, 'word=', data.word);
      setGameState({
        ...data,
        currentCardFlipper: 0,
        cardsFlipped: 0,
        timeRemaining: 300
      });
      setIsLoading(false);
    });

    newSocket.on('phase-changed', (data: any) => {
      console.log('PHASE_CHANGED data=', data);
      setGameState(prev => prev ? { ...prev, phase: data.phase } : null);
    });

    newSocket.on('timer-update', (data: any) => {
      setGameState(prev => prev ? { ...prev, timeRemaining: data.timeLeft } : null);
    });

    newSocket.on('card-flip-update', (data: any) => {
      console.log('🃏 Frontend: card-flip-update received:', data);
      setGameState(prev => prev ? {
        ...prev,
        currentCardFlipper: data.currentCardFlipper,
        cardsFlipped: data.cardsFlipped
      } : null);
    });

    newSocket.on('error', (error: any) => {
      console.error('SOCKET_ERROR error=', error);
      alert(`خطأ: ${error.message}`);
      setIsLoading(false);
    });

    // Request game state when page loads
    console.log('REQUESTING_GAME_STATE roomCode=', roomCode);
    newSocket.emit('get-room-state', { roomCode });

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('GAME_LOADING_TIMEOUT - Creating fallback game state');
      setGameState({
        phase: 'card-flipping',
        category: 'الأكل',
        word: 'الكسكس',
        spyIndex: 0,
        playersCount: 3,
        startTime: Date.now(),
        playerIndex: 0,
        isSpy: false,
        currentCardFlipper: 0,
        cardsFlipped: 0,
        timeRemaining: 300
      });
      setIsLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      newSocket.off('game-started');
      newSocket.off('phase-changed');
      newSocket.off('timer-update');
      newSocket.off('card-flip-update');
      newSocket.off('error');
    };
  }, [roomCode]);

  const flipCard = () => {
    console.log('🃏 Frontend: flipCard called, socket:', !!socket, 'roomCode:', roomCode);
    console.log('🃏 Frontend: currentCardFlipper:', gameState?.currentCardFlipper, 'playerIndex:', gameState?.playerIndex);
    setIsCardShowing(true);
    
    // Notify server that this player flipped their card
    if (socket && roomCode) {
      console.log('🃏 Frontend: Sending card-flipped event to server');
      socket.emit('card-flipped', { roomCode });
    } else {
      console.log('❌ Frontend: Cannot send card-flipped event - socket:', !!socket, 'roomCode:', roomCode);
    }
    
    // Show card for 3 seconds, then hide it
    setTimeout(() => {
      setIsCardShowing(false);
    }, 3000);
  };

  const startTimer = () => {
    let timeLeft = 300; // 5 minutes
    setGameState(prev => prev ? { ...prev, timeRemaining: timeLeft } : null);
    
    const timerInterval = setInterval(() => {
      timeLeft -= 1;
      setGameState(prev => prev ? { ...prev, timeRemaining: timeLeft } : null);
      
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        setGameState(prev => prev ? { ...prev, phase: 'voting' } : null);
      }
    }, 1000);
    
    setTimer(timerInterval);
  };

  const voteForPlayer = (playerIndex: number) => {
    if (hasVoted) return;
    
    setVotes(prev => ({
      ...prev,
      [playerIndex]: (prev[playerIndex] || 0) + 1
    }));
    setHasVoted(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تحميل اللعبة...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">لم يتم العثور على اللعبة</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        
        {/* Card Flipping Phase */}
        {gameState.phase === 'card-flipping' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {isCardShowing ? `دورك الآن!` : `دور اللاعب ${(gameState.currentCardFlipper || 0) + 1}`}
              </h1>
              <p className="text-gray-600 mb-4">
                {isCardShowing ? 'شوف بطاقتك و اقلبها للاعب الجاي' : 
                 (gameState.playerIndex === gameState.currentCardFlipper ? 
                   'دورك لقلب البطاقة' : 
                   `انتظر دور اللاعب ${(gameState.currentCardFlipper || 0) + 1}`)}
              </p>
              <p className="text-sm text-gray-500">
                {gameState.cardsFlipped || 0} من {gameState.playersCount} شافوا البطاقة
              </p>
              <p className="text-xs text-gray-400 mt-2">
                أنت اللاعب {(gameState.playerIndex || 0) + 1} من {gameState.playersCount}
              </p>
              {isCardShowing && (
                <p className="text-sm text-orange-500 mt-2">
                  اقلب البطاقة و اعطيها للاعب الجاي بعد ثانيتين
                </p>
              )}
              {(gameState.cardsFlipped || 0) < (gameState.playersCount || 0) && (
                <p className="text-sm text-blue-500 mt-2">
                  انتظر حتى يقلب جميع اللاعبين بطاقاتهم
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[300px] flex items-center justify-center mb-8">
              <div className="text-center">
                {isCardShowing ? (
                  gameState.isSpy ? (
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
                    <div className="text-8xl mb-6">🃏</div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">
                      البطاقة
                    </h2>
                    <p className="text-gray-600">
                      اضغط لترى محتوى البطاقة
                    </p>
                  </>
                )}
              </div>
            </div>

            {!isCardShowing && gameState.playerIndex === gameState.currentCardFlipper && (gameState.cardsFlipped || 0) < (gameState.playersCount || 0) && (
              <button
                onClick={flipCard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors duration-200"
              >
                🃏 اقلب البطاقة
              </button>
            )}
            
            {!isCardShowing && gameState.playerIndex !== gameState.currentCardFlipper && (gameState.cardsFlipped || 0) < (gameState.playersCount || 0) && (
              <div className="w-full bg-gray-100 text-gray-500 font-medium py-4 px-6 rounded-xl text-lg text-center">
                ⏳ انتظر دورك
              </div>
            )}
          </>
        )}

        {/* Questions Phase */}
        {gameState.phase === 'questions' && (
          <div className="space-y-6">
            {/* Timer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
                {gameState.timeRemaining ? formatTime(gameState.timeRemaining) : '5:00'}
              </div>
              <p className="text-gray-600">الوقت المتبقي</p>
            </div>

            {/* Game Instructions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">❓</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  ابدأ بطرح الأسئلة!
                </h2>
                <p className="text-gray-600 mb-6">
                  {gameState.isSpy 
                    ? 'حاول اكتشاف الكلمة من خلال الأسئلة دون أن تكشف نفسك!'
                    : `حاول اكتشاف من هو الجاسوس! الكلمة هي: ${gameState.word}`
                  }
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if (socket && roomCode) {
                        socket.emit('change-phase', { roomCode, phase: 'voting' });
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                  >
                    🗳️ التصويت الآن
                  </button>
                  <button
                    onClick={() => {
                      if (socket && roomCode) {
                        socket.emit('change-phase', { roomCode, phase: 'results' });
                      }
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                  >
                    🏆 النتائج
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voting Phase */}
        {gameState.phase === 'voting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-6xl mb-4">🗳️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                مرحلة التصويت
              </h2>
              <p className="text-gray-600 mb-6">
                صوت لمن تعتقد أنه الجاسوس
              </p>
            </div>

            <div className="space-y-3">
              {Array.from({ length: gameState.playersCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => voteForPlayer(i)}
                  disabled={hasVoted}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                    hasVoted 
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">اللاعب {i + 1}</span>
                    {votes[i] > 0 && <span className="text-blue-600">✓</span>}
                  </div>
                </button>
              ))}
            </div>

            {hasVoted && (
              <button
                onClick={() => setGameState(prev => prev ? { ...prev, phase: 'results' } : null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                🏆 عرض النتائج
              </button>
            )}
          </div>
        )}

        {/* Results Phase */}
        {gameState.phase === 'results' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              نتائج اللعبة
            </h2>
            <div className="space-y-4 mb-6">
              <p className="text-lg">
                <span className="font-bold">الجاسوس كان:</span> اللاعب {gameState.spyIndex + 1}
              </p>
              <p className="text-lg">
                <span className="font-bold">الكلمة كانت:</span> {gameState.word}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                🏠 الرئيسية
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                🔄 لعب تاني
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}