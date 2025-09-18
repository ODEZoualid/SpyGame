'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { config } from '../config';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Get room code from URL if available
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setRoomCode(codeFromUrl);
    }

    // Initialize socket connection
    const newSocket = io(config.SERVER_URL);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('join-success', (data) => {
      setIsJoining(false);
      router.push(`/lobby/${roomCode}?playerId=${data.playerId}&isHost=${data.isHost}`);
    });

    newSocket.on('join-error', (data) => {
      setError(data.message);
      setIsJoining(false);
    });

    return () => {
      newSocket.close();
    };
  }, [roomCode, router, searchParams]);

  const joinRoom = () => {
    if (!roomCode.trim() || !nickname.trim()) return;
    
    setError('');
    setIsJoining(true);
    
    if (socket) {
      socket.emit('join-room', { 
        roomCode: roomCode.trim(), 
        nickname: nickname.trim() 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← العودة
          </button>
          <h1 className="text-2xl font-bold text-gray-900">انضم للعبة</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رمز الغرفة
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="أدخل رمز الغرفة (6 أرقام)"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-center text-2xl font-bold tracking-widest"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              اطلب من المضيف رمز الغرفة
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسمك
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="أدخل اسمك"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={joinRoom}
            disabled={!roomCode.trim() || !nickname.trim() || isJoining}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
          >
            {isJoining ? 'جاري الانضمام...' : 'انضم للعبة'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">أو</p>
            <button
              onClick={() => router.push('/host')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              إنشاء غرفة جديدة
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 mb-2">كيفية الانضمام:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. اطلب من المضيف رمز الغرفة</li>
            <li>2. أدخل رمز الغرفة واسمك</li>
            <li>3. اضغط &quot;انضم للعبة&quot;</li>
            <li>4. انتظر في اللوبي حتى يبدأ المضيف اللعبة</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
