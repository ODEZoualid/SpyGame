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
    });

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('GAME_LOADING_TIMEOUT - No game-started event received');
      setIsLoading(false);
    }, 10000); // 10 second timeout

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
            <p className="text-sm text-gray-500">
              الجاسوس: اللاعب {gameState.spyIndex + 1}
            </p>
            <p className="text-sm text-gray-500">
              الكلمة: {gameState.word}
            </p>
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
