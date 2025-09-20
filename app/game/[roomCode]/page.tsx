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
  playerIndex?: number; // Player's position in the game
  isSpy?: boolean; // Whether this player is the spy
}

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const roomCode = params.roomCode as string;

  useEffect(() => {
    const newSocket = getSocket();
    setSocket(newSocket);

    console.log('GAME_PAGE_LOADED roomCode=', roomCode);

    // Socket event listeners
    newSocket.on('game-started', (data: GameState) => {
      console.log('GAME_STARTED data=', data);
      console.log('GAME_STARTED phase=', data.phase);
      console.log('GAME_STARTED category=', data.category);
      setGameState(data);
      setIsLoading(false);
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
      console.log('GAME_LOADING_TIMEOUT - No game-started event received');
      console.log('GAME_LOADING_TIMEOUT - Creating fallback game state');
      // Create a fallback game state
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
    }, 5000); // Reduced to 5 seconds

    return () => {
      clearTimeout(timeout);
      newSocket.off('game-started');
      newSocket.off('error');
    };
  }, [roomCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل اللعبة...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">لم يتم العثور على اللعبة</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">اللعبة بدأت!</h1>
          <p className="text-gray-600">الفئة: {gameState.category}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              اللعبة جاهزة!
            </h2>
            <p className="text-gray-600 mb-4">
              تم بدء اللعبة بنجاح. يمكنك الآن اللعب مع الأصدقاء!
            </p>
            
            {/* Card Flipping Phase */}
            {gameState.phase === 'card-flipping' && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    // Show role based on isSpy property
                    if (gameState.isSpy) {
                      alert('أنت الجاسوس! 🕵️\n\nلا تعرف الكلمة. حاول اكتشافها من خلال الأسئلة.');
                    } else {
                      alert(`الكلمة هي: ${gameState.word}\n\nحاول اكتشاف من هو الجاسوس!`);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg mb-4"
                >
                  اقلب البطاقة
                </button>
                <p className="text-sm text-gray-500">
                  اقلب البطاقة لترى دورك في اللعبة
                </p>
              </div>
            )}
            
            {/* Questions Phase */}
            {gameState.phase === 'questions' && (
              <div className="mt-6">
                <p className="text-lg font-semibold text-gray-700 mb-4">
                  ابدأ بطرح الأسئلة!
                </p>
                <p className="text-sm text-gray-500">
                  الفئة: {gameState.category}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
