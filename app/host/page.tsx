'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socketClient';
import Image from 'next/image';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export default function HostPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [isCreating, setIsCreating] = useState(false);

  const categories = [
    { id: '1', name: 'الأكل', words: ['الكسكس', 'الطاجين', 'الحريرة', 'البيتزا', 'البرغر', 'السلطة', 'المعكرونة', 'السمك', 'اللحم'] },
    { id: '2', name: 'الحيوانات', words: ['الفيل', 'الدلفين', 'البطريق', 'الأسد', 'النمر', 'الزرافة', 'القرود', 'الطيور', 'الأسماك'] },
    { id: '3', name: 'المدن', words: ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة', 'مكناس', 'وجدة', 'تطوان'] },
    { id: '4', name: 'الرياضة', words: ['كرة القدم', 'كرة السلة', 'التنس', 'السباحة', 'الجري', 'ركوب الدراجة', 'الملاكمة', 'الكرة الطائرة', 'الجمباز'] },
    { id: '5', name: 'الموسيقى', words: ['الغيتار', 'البيانو', 'الطبلة', 'الميكروفون', 'الحفلة', 'الأغنية', 'الرقص', 'الفرقة', 'الحفل'] },
    { id: '6', name: 'التكنولوجيا', words: ['الهاتف', 'الكمبيوتر', 'الإنترنت', 'التطبيق', 'البرمجة', 'الذكاء الاصطناعي', 'الروبوت', 'الطابعة', 'الكاميرا'] }
  ];

  useEffect(() => {
    const newSocket = getSocket();
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('SOCKET_CONNECTED in host page');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('SOCKET_DISCONNECTED in host page:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('SOCKET_CONNECT_ERROR in host page:', error);
      alert(`خطأ في الاتصال: ${error.message}`);
      setIsCreating(false);
    });

    newSocket.on('room-created', (data: any) => {
      console.log('ROOM_CREATED data=', data);
      setRoomCode(data.roomCode);
      setIsCreating(false);
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
      setIsCreating(false);
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('room-created');
      newSocket.off('players-updated');
      newSocket.off('game-started');
      newSocket.off('error');
    };
  }, [roomCode, router]);

  useEffect(() => {
    if (roomCode) {
      // Generate QR code
      const qrData = `${window.location.origin}/join/${roomCode}`;
      setQrCode(qrData);
    }
  }, [roomCode]);

  const createRoom = () => {
    if (!nickname.trim()) {
      alert('ادخل اسمك أولاً');
      return;
    }
    
    setIsCreating(true);
    console.log('SOCKET_EMIT event=create-room nickname=', nickname.trim());
    socket.emit('create-room', { playerName: nickname.trim() });
  };

  const startGame = () => {
    if (players.length < 3) {
      alert('تحتاج 3 لاعبين على الأقل لبدء اللعبة');
      return;
    }
    
    console.log('SOCKET_EMIT event=start-game roomCode=', roomCode, 'category=', selectedCategory);
    socket.emit('start-game', { 
      roomCode, 
      category: selectedCategory,
      playersCount: players.length 
    });
  };

  const copyJoinLink = () => {
    const joinUrl = `${window.location.origin}/join/${roomCode}`;
    navigator.clipboard.writeText(joinUrl);
    alert('تم نسخ الرابط!');
  };

  if (roomCode) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">غرفة اللعبة</h1>
            <p className="text-gray-600">كود الغرفة: <span className="font-bold text-blue-600">{roomCode}</span></p>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
            <h3 className="text-lg font-bold text-gray-700 mb-4">انضم بالكود</h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="text-6xl">📱</div>
              <p className="text-sm text-gray-600 mt-2">QR Code</p>
            </div>
            <button
              onClick={copyJoinLink}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              نسخ رابط الانضمام
            </button>
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-800">
                    {player.name} {player.isHost && '(المضيف)'}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Game Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">إعدادات اللعبة</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Game Button */}
          <button
            onClick={startGame}
            disabled={players.length < 3}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg"
          >
            {players.length < 3 ? `تحتاج ${3 - players.length} لاعبين إضافيين` : 'بدا اللعبة'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">إنشاء غرفة</h1>
          <p className="text-gray-600">ادخل اسمك لإنشاء غرفة جديدة</p>
        </div>

        <div className="space-y-6">
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
            onClick={createRoom}
            disabled={isCreating || !nickname.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg"
          >
            {isCreating ? 'جاري الإنشاء...' : 'إنشاء غرفة'}
          </button>
        </div>
      </div>
    </div>
  );
}
