'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getSocket } from '../../lib/socketClient';
import Image from 'next/image';
import QRCode from 'qrcode';

interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  hasVoted: boolean;
  cardFlipped: boolean;
  isYou?: boolean;
}

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    const code = params.roomCode as string;
    const playerIdParam = searchParams.get('playerId');
    const isHostParam = searchParams.get('isHost') === 'true';
    
    setRoomCode(code);
    setPlayerId(playerIdParam || '');
    setIsHost(isHostParam);

    // Initialize socket connection
    console.log('SOCKET_USE site=LobbyPage time=', new Date().toISOString());
    const newSocket = getSocket();
    setSocket(newSocket);

    // Join the room to receive real-time updates
    // This ensures the host and all players are properly in the room
    const nickname = searchParams.get('nickname');
    if (nickname) {
      console.log('SOCKET_EMIT event=join-room roomCode=', code, 'nickname=', decodeURIComponent(nickname), 'timestamp=', new Date().toISOString());
      newSocket.emit('join-room', { roomCode: code, nickname: decodeURIComponent(nickname) });
    } else {
      console.log('SOCKET_EMIT event=get-room-state roomCode=', code, 'timestamp=', new Date().toISOString());
      newSocket.emit('get-room-state', { roomCode: code });
    }

    // Socket event listeners
    newSocket.on('join-success', (data) => {
      console.log('SOCKET_EVENT_RECV event=join-success data=', data, 'timestamp=', new Date().toISOString());
      setPlayerId(data.playerId);
      // Always update isHost from server response
      setIsHost(data.isHost);
      console.log('Host status from server:', data.isHost);
    });

    newSocket.on('players-updated', (updatedPlayers) => {
      console.log('SOCKET_EVENT_RECV event=players-updated players=', updatedPlayers.length, 'timestamp=', new Date().toISOString());
      console.log('Current playerId:', playerIdParam);
      
      // Mark which player is "you" based on playerId
      const playersWithYou = updatedPlayers.map((player: any) => ({
        ...player,
        isYou: player.id === playerIdParam
      }));
      
      console.log('Players with you marker:', playersWithYou);
      setPlayers(playersWithYou);
    });

    newSocket.on('game-started', (gameState) => {
      console.log('SOCKET_EVENT_RECV event=game-started gameState=', gameState, 'timestamp=', new Date().toISOString());
      const nickname = searchParams.get('nickname') || 'Player';
      router.push(`/game/${code}?nickname=${encodeURIComponent(nickname)}`);
    });

    newSocket.on('error', (data) => {
      console.error('SOCKET_EVENT_RECV event=error data=', data, 'timestamp=', new Date().toISOString());
      alert(`خطأ: ${data.message}`);
    });

    newSocket.on('join-error', (data) => {
      console.error('SOCKET_EVENT_RECV event=join-error data=', data, 'timestamp=', new Date().toISOString());
      router.push('/join');
    });

    return () => {
      // Don't close the singleton socket, just remove listeners
      newSocket.off('join-success');
      newSocket.off('players-updated');
      newSocket.off('game-started');
      newSocket.off('error');
      newSocket.off('join-error');
    };
  }, [params.roomCode, searchParams, router]);

  // Generate QR code when room code is available
  useEffect(() => {
    if (roomCode) {
      const joinUrl = `https://spy-game-darija.vercel.app/join/${roomCode}`;
      QRCode.toDataURL(joinUrl, { width: 200 }, (err, url) => {
        if (!err) {
          setQrCodeUrl(url);
        }
      });
    }
  }, [roomCode]);

  const startGame = () => {
    if (socket && roomCode) {
      console.log('SOCKET_EMIT event=start-game roomCode=', roomCode, 'category=الأكل', 'players=', players.length, 'timestamp=', new Date().toISOString());
      socket.emit('start-game', { 
        roomCode, 
        category: 'الأكل', // Default category, could be made configurable
        players: players.length 
      });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={leaveRoom}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← العودة
          </button>
          <h1 className="text-2xl font-bold text-gray-900">اللوبي</h1>
          <div className="w-8"></div>
        </div>

        {/* Room Code Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
          <h2 className="text-lg font-bold text-gray-700 mb-2">رمز الغرفة</h2>
          <div className="text-4xl font-bold text-blue-600 mb-4">
            {roomCode}
          </div>
          
          {/* QR Code */}
          {qrCodeUrl && (
            <div className="mb-4">
              <Image
                src={qrCodeUrl}
                alt="QR Code"
                width={150}
                height={150}
                className="mx-auto"
              />
            </div>
          )}
          
          {/* Share Link */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 mb-2">رابط الانضمام:</p>
            <div className="flex items-center">
              <input
                type="text"
                value={`https://spy-game-darija.vercel.app/join/${roomCode}`}
                readOnly
                className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 mr-2"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://spy-game-darija.vercel.app/join/${roomCode}`);
                  alert('تم نسخ الرابط!');
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                نسخ
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            شارك هذا الرمز أو الرابط مع اللاعبين الآخرين
          </p>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4">
            اللاعبون ({players.length}/9)
          </h3>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.isYou 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                    player.isHost ? 'bg-purple-600' : 'bg-blue-600'
                  }`}>
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-700">
                    {player.nickname}
                    {player.isHost && (
                      <span className="text-purple-600 text-sm mr-2">(المضيف)</span>
                    )}
                    {player.isYou && (
                      <span className="text-blue-600 text-sm mr-2">(أنت)</span>
                    )}
                  </span>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 p-2 text-xs text-gray-600 mb-4">
          Debug: isHost={isHost.toString()}, playerId={playerId}, players={players.length}
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="space-y-4">
            <button
              onClick={startGame}
              disabled={players.length < 3}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              {players.length < 3 ? `تحتاج ${3 - players.length} لاعبين إضافيين` : 'بدء اللعبة'}
            </button>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm text-center">
                كالمضيف، يمكنك بدء اللعبة عندما ينضم 3 لاعبين على الأقل
              </p>
            </div>
          </div>
        )}

        {/* Player Waiting Message */}
        {!isHost && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm text-center">
              انتظر حتى يبدأ المضيف اللعبة...
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">تعليمات اللعبة:</h3>
          <ol className="text-sm text-gray-700 space-y-1">
            <li>1. كل لاعب سيرى بطاقة خاصة به</li>
            <li>2. الجاسوس لا يعرف الكلمة</li>
            <li>3. باقي اللاعبين يعرفون الكلمة</li>
            <li>4. اسألوا أسئلة لتعرفوا من هو الجاسوس</li>
            <li>5. صوتوا على من تعتقدون أنه الجاسوس</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
