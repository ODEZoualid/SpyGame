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
  currentPlayer?: number;
  timeLeft?: number;
}

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [allPlayersFlipped, setAllPlayersFlipped] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  const roomCode = params.roomCode as string;

  useEffect(() => {
    const newSocket = getSocket();
    setSocket(newSocket);

    console.log('GAME_PAGE_LOADED roomCode=', roomCode);

    // Socket event listeners
    newSocket.on('game-started', (data: GameState) => {
      console.log('GAME_STARTED data=', data);
      setGameState(data);
      setIsLoading(false);
    });

    newSocket.on('phase-changed', (data: any) => {
      console.log('PHASE_CHANGED data=', data);
      setGameState(prev => prev ? { ...prev, phase: data.phase } : null);
    });

    newSocket.on('timer-update', (data: any) => {
      setTimer(data.timeLeft);
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
        word: 'كلمة تجريبية',
        spyIndex: 0,
        playersCount: 3,
        startTime: Date.now(),
        playerIndex: 0,
        isSpy: false
      });
      setIsLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      newSocket.off('game-started');
      newSocket.off('phase-changed');
      newSocket.off('timer-update');
      newSocket.off('error');
    };
  }, [roomCode]);

  const flipCard = () => {
    setCardFlipped(true);
    // Simulate all players flipping after 3 seconds
    setTimeout(() => {
      setAllPlayersFlipped(true);
      // Move to questions phase after 2 seconds
      setTimeout(() => {
        setGameState(prev => prev ? { ...prev, phase: 'questions' } : null);
        startTimer();
      }, 2000);
    }, 3000);
  };

  const startTimer = () => {
    let timeLeft = 300; // 5 minutes
    setTimer(timeLeft);
    
    const timerInterval = setInterval(() => {
      timeLeft -= 1;
      setTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        setGameState(prev => prev ? { ...prev, phase: 'voting' } : null);
      }
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تحميل اللعبة...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {gameState.phase === 'card-flipping' && '🃏 مرحلة البطاقات'}
            {gameState.phase === 'questions' && '❓ مرحلة الأسئلة'}
            {gameState.phase === 'voting' && '🗳️ مرحلة التصويت'}
            {gameState.phase === 'results' && '🏆 النتائج'}
          </h1>
          <p className="text-gray-600 text-lg">الفئة: {gameState.category}</p>
        </div>

        {/* Card Flipping Phase */}
        {gameState.phase === 'card-flipping' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {!cardFlipped ? 'حان وقت كشف البطاقات!' : 'انتظر باقي اللاعبين...'}
              </h2>
              <p className="text-gray-600 mb-6">
                {!cardFlipped 
                  ? 'كل لاعب يقلب بطاقته ليرى دوره في اللعبة'
                  : 'جميع اللاعبين يكشفون بطاقاتهم...'
                }
              </p>
            </div>

            {!cardFlipped ? (
              <button
                onClick={flipCard}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                🃏 اقلب البطاقة
              </button>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
                <div className="text-4xl mb-4">
                  {gameState.isSpy ? '🕵️' : '📝'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {gameState.isSpy ? 'أنت الجاسوس!' : 'أنت لاعب عادي!'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {gameState.isSpy 
                    ? 'لا تعرف الكلمة. حاول اكتشافها من خلال الأسئلة.'
                    : `الكلمة هي: ${gameState.word}`
                  }
                </p>
                {allPlayersFlipped && (
                  <div className="text-green-600 font-medium">
                    ✅ جميع اللاعبين انتهوا من كشف البطاقات
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Questions Phase */}
        {gameState.phase === 'questions' && (
          <div className="space-y-6">
            {/* Timer */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
                {timer ? formatTime(timer) : '5:00'}
              </div>
              <p className="text-gray-600">الوقت المتبقي</p>
            </div>

            {/* Game Instructions */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
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
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => setGameState(prev => prev ? { ...prev, phase: 'voting' } : null)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    🗳️ التصويت الآن
                  </button>
                  <button
                    onClick={() => setGameState(prev => prev ? { ...prev, phase: 'results' } : null)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
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
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🗳️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              مرحلة التصويت
            </h2>
            <p className="text-gray-600 mb-6">
              صوت لمن تعتقد أنه الجاسوس
            </p>
            <button
              onClick={() => setGameState(prev => prev ? { ...prev, phase: 'results' } : null)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
            >
              🏆 عرض النتائج
            </button>
          </div>
        )}

        {/* Results Phase */}
        {gameState.phase === 'results' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
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
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
              >
                🏠 الرئيسية
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
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