'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socketClient';
import QRCode from 'qrcode';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface Category {
  id: string;
  name: string;
  words: string[];
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
  const [linkCopied, setLinkCopied] = useState(false);

  const categories: Category[] = [
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
      QRCode.toDataURL(qrData, { width: 150, margin: 2 }, (err, url) => {
        if (err) {
          console.error('QR Code generation error:', err);
        } else {
          setQrCode(url);
        }
      });
    }
  }, [roomCode]);

  const createRoom = () => {
    if (!nickname.trim()) {
      alert('يرجى إدخال اسمك');
      return;
    }
    
    setIsCreating(true);
    console.log('SOCKET_EMIT event=create-room nickname=', nickname);
    socket.emit('create-room', { playerName: nickname });
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

  const copyJoinLink = async () => {
    const link = `${window.location.origin}/join/${roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (!roomCode) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">🎮 إنشاء غرفة</h1>
              <p className="text-gray-600">أدخل اسمك واختر الفئة لبدء اللعبة</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسمك
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
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

              <button
                onClick={createRoom}
                disabled={isCreating}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  isCreating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isCreating ? 'جاري الإنشاء...' : 'إنشاء الغرفة'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🎮 غرفة اللعبة</h1>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-lg font-mono font-bold text-blue-600">{roomCode}</p>
          </div>
        </div>

        {/* QR Code and Link */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📱 انضم بالمسح</h2>
            {qrCode ? (
              <div className="flex justify-center mb-4">
                <img src={qrCode} alt="QR Code" className="w-32 h-32" />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/join/${roomCode}`}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-lg font-mono text-xs"
              />
              <button
                onClick={copyJoinLink}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  linkCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {linkCopied ? '✅' : '📋'}
              </button>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            👥 اللاعبون ({players.length}/9)
          </h2>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center p-3 rounded-lg ${
                  player.isHost ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {player.name} {player.isHost && '(أنت)'}
                  </p>
                  {player.isHost && (
                    <p className="text-xs text-yellow-600">👑 المضيف</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: 9 - players.length }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center p-3 rounded-lg bg-gray-100">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm mr-3">
                  {players.length + index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">مقعد فارغ</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={startGame}
          disabled={players.length < 3}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
            players.length < 3
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
          }`}
        >
          🚀 بدء اللعبة ({players.length}/3)
        </button>
      </div>
    </div>
  );
}