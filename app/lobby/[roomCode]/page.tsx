'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getSocket } from '../../lib/socketClient';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [socket, setSocket] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const roomCode = params.roomCode as string;
  const nickname = searchParams.get('nickname') || '';
  const isHostParam = searchParams.get('isHost') === 'true';

  useEffect(() => {
    const newSocket = getSocket();
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('join-success', (data: any) => {
      console.log('JOIN_SUCCESS data=', data);
      setPlayerId(data.playerId);
      setIsHost(data.isHost);
    });

    newSocket.on('players-updated', (playersList: Player[]) => {
      console.log('PLAYERS_UPDATED players=', playersList);
      setPlayers(playersList);
    });

    newSocket.on('game-started', (data: any) => {
      console.log('GAME_STARTED data=', data);
      router.push(`/game/${roomCode}`);
    });

    newSocket.on('error', (error: any) => {
      console.error('SOCKET_ERROR error=', error);
      alert(`خطأ: ${error.message}`);
      setIsStarting(false);
    });

    newSocket.on('join-error', (error: any) => {
      console.error('JOIN_ERROR error=', error);
      alert(`خطأ: ${error.message}`);
      router.push('/join');
    });

    return () => {
      newSocket.off('join-success');
      newSocket.off('players-updated');
      newSocket.off('game-started');
      newSocket.off('error');
      newSocket.off('join-error');
    };
  }, [roomCode, router]);

  useEffect(() => {
    if (socket && roomCode) {
      // For hosts, get room state
      // For players, join the room
      if (isHostParam) {
        console.log('SOCKET_EMIT event=get-room-state roomCode=', roomCode, 'isHost=true');
        socket.emit('get-room-state', { roomCode });
        setIsHost(true);
      } else if (nickname) {
        console.log('SOCKET_EMIT event=join-room roomCode=', roomCode, 'nickname=', nickname);
        socket.emit('join-room', { roomCode, playerName: nickname });
      } else {
        // No nickname, redirect to join page
        router.push('/join');
      }
    }
  }, [socket, roomCode, isHostParam, nickname, router]);

  const startGame = () => {
    if (players.length < 3) {
      alert('تحتاج 3 لاعبين على الأقل لبدء اللعبة');
      return;
    }
    
    setIsStarting(true);
    console.log('SOCKET_EMIT event=start-game roomCode=', roomCode);
    socket.emit('start-game', { 
      roomCode, 
      category: 'الأكل', // Default category
      playersCount: players.length 
    });
  };

  if (!nickname && !isHostParam) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">غرفة اللعبة</h1>
          <p className="text-gray-600">كود الغرفة: <span className="font-bold text-blue-600">{roomCode}</span></p>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4">
            اللاعبين ({players.length})
          </h3>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === playerId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
              >
                <span className="text-gray-800">
                  {player.name} {player.isHost && '(المضيف)'} {player.id === playerId && '(أنت)'}
                </span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                أنت المضيف. يمكنك بدء اللعبة عندما ينضم 3 لاعبين على الأقل.
              </p>
            </div>

            <button
              onClick={startGame}
              disabled={isStarting || players.length < 3}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg"
            >
              {isStarting ? 'جاري البدء...' : 
               players.length < 3 ? `تحتاج ${3 - players.length} لاعبين إضافيين` : 
               'بدا اللعبة'}
            </button>
          </div>
        )}

        {/* Player Waiting */}
        {!isHost && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="animate-pulse">
              <p className="text-blue-800">
                انتظر حتى يبدأ المضيف اللعبة...
              </p>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
