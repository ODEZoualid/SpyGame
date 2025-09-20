'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socketClient';

export default function JoinPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<any>(null);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const newSocket = getSocket();
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('join-success', (data: any) => {
      console.log('JOIN_SUCCESS data=', data);
      setIsJoining(false);
      router.push(`/lobby/${roomCode}?nickname=${encodeURIComponent(nickname)}&isHost=false`);
    });

    newSocket.on('join-error', (error: any) => {
      console.error('JOIN_ERROR error=', error);
      alert(`خطأ: ${error.message}`);
      setIsJoining(false);
    });

    return () => {
      newSocket.off('join-success');
      newSocket.off('join-error');
    };
  }, [roomCode, nickname, router]);

  const joinRoom = () => {
    if (!roomCode.trim() || !nickname.trim()) {
      alert('ادخل كود الغرفة واسمك');
      return;
    }
    
    setIsJoining(true);
    console.log('SOCKET_EMIT event=join-room roomCode=', roomCode.trim(), 'nickname=', nickname.trim());
    socket.emit('join-room', { 
      roomCode: roomCode.trim(), 
      playerName: nickname.trim() 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🎮 انضم للعبة</h1>
            <p className="text-gray-600">ادخل كود الغرفة واسمك للانضمام</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كود الغرفة
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl font-mono"
                maxLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسمك
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ادخل اسمك"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                maxLength={20}
              />
            </div>

            <button
              onClick={joinRoom}
              disabled={isJoining || !roomCode.trim() || !nickname.trim()}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                isJoining || !roomCode.trim() || !nickname.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isJoining ? 'جاري الانضمام...' : 'انضم للعبة'}
            </button>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}