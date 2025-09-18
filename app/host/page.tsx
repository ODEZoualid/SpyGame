'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Image from 'next/image';
import { config } from '../config';

interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  hasVoted: boolean;
  cardFlipped: boolean;
}

export default function HostPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('الأكل');
  const [gameStarted, setGameStarted] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const categories = [
    { id: '1', name: 'الأكل', words: ['الكسكس', 'الطاجين', 'الحريرة', 'البيتزا', 'البرغر', 'السلطة', 'الملوخية', 'الكباب', 'الفتة', 'المحشي', 'الرز', 'اللحم'] },
    { id: '2', name: 'الحيوانات', words: ['الفيل', 'الدلفين', 'البطريق', 'الأسد', 'النمر', 'الزرافة', 'الغزال', 'القرود', 'الطاووس', 'الفراشة', 'السلحفاة', 'الكنغر'] },
    { id: '3', name: 'المدن', words: ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة', 'مكناس', 'وجدة', 'تطوان', 'الخميسات', 'بني ملال', 'تازة'] },
    { id: '4', name: 'الألوان', words: ['الأحمر', 'الأزرق', 'الأخضر', 'الأصفر', 'الوردي', 'البرتقالي', 'البنفسجي', 'الأسود', 'الأبيض', 'الرمادي', 'الذهبي', 'الفضي'] },
    { id: '5', name: 'البلدان', words: ['المغرب', 'مصر', 'فرنسا', 'إسبانيا', 'أمريكا', 'إنجلترا', 'ألمانيا', 'إيطاليا', 'اليابان', 'الصين', 'البرازيل', 'كندا'] },
    { id: '6', name: 'الرياضة', words: ['كرة القدم', 'كرة السلة', 'التنس', 'السباحة', 'الجري', 'ركوب الدراجة', 'الملاكمة', 'الكاراتيه', 'الجمباز', 'كرة اليد', 'البيسبول', 'الهوكي'] },
    { id: '7', name: 'المهن', words: ['الطبيب', 'المعلم', 'المهندس', 'الشرطي', 'النجار', 'الخباز', 'النجار', 'المحامي', 'المحاسب', 'الممرض', 'الطيار', 'الطباخ'] },
    { id: '8', name: 'الأدوات', words: ['المطرقة', 'المفك', 'المقص', 'المفتاح', 'الكماشة', 'المنشار', 'البراغي', 'المسامير', 'الخيط', 'الإبرة', 'الغراء', 'الورق'] },
    { id: '9', name: 'المواصلات', words: ['السيارة', 'الطائرة', 'القطار', 'الحافلة', 'الدراجة', 'الدراجة النارية', 'الطائرة الشراعية', 'الغواصة', 'القطار السريع', 'الترام', 'المترو', 'الطائرة الورقية'] },
    { id: '10', name: 'الفواكه', words: ['التفاح', 'الموز', 'البرتقال', 'العنب', 'الفراولة', 'الأناناس', 'المانجو', 'الخوخ', 'الكمثرى', 'الكرز', 'الليمون', 'الرمان'] },
    { id: '11', name: 'الخضروات', words: ['الطماطم', 'الخيار', 'الجزر', 'البطاطس', 'البصل', 'الثوم', 'الملفوف', 'الخس', 'السبانخ', 'الفلفل', 'القرنبيط', 'الباذنجان'] },
    { id: '12', name: 'الملابس', words: ['القميص', 'البنطلون', 'الفستان', 'الحذاء', 'القبعة', 'القفازات', 'الجاكيت', 'السترة', 'السراويل', 'البلوزة', 'الكنزة', 'الحزام'] }
  ];

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(config.SERVER_URL);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('room-created', (data) => {
      setRoomCode(data.roomCode);
      setPlayers([{ id: data.playerId, nickname, isHost: true, hasVoted: false, cardFlipped: false }]);
    });

    newSocket.on('players-updated', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('game-started', () => {
      setGameStarted(true);
      router.push(`/game/${roomCode}`);
    });

    return () => {
      newSocket.close();
    };
  }, [nickname, roomCode, router]);

  useEffect(() => {
    // Generate QR code when room code is available
    if (roomCode) {
      import('qrcode').then((QRCode) => {
        const joinUrl = `${window.location.origin}/join/${roomCode}`;
        QRCode.toDataURL(joinUrl, { width: 200 }, (err, url) => {
          if (!err) setQrCode(url);
        });
      });
    }
  }, [roomCode]);

  const createRoom = () => {
    if (!nickname.trim()) return;
    if (socket) {
      socket.emit('create-room', { nickname: nickname.trim() });
    }
  };

  const startGame = () => {
    if (socket && roomCode) {
      socket.emit('start-game', { 
        roomCode, 
        category: selectedCategory,
        players: players.length 
      });
    }
  };

  const copyJoinLink = () => {
    const joinUrl = `${window.location.origin}/join/${roomCode}`;
    navigator.clipboard.writeText(joinUrl);
    // You could add a toast notification here
  };

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري بدء اللعبة...</p>
        </div>
      </div>
    );
  }

  if (!roomCode) {
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
            <h1 className="text-2xl font-bold text-gray-900">إنشاء غرفة</h1>
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
                placeholder="أدخل اسمك"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name} ({category.words.length} كلمة)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={createRoom}
              disabled={!nickname.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              إنشاء غرفة
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">غرفة اللعبة</h1>
        </div>

        {/* Room Code */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">رمز الغرفة</h2>
          <div className="text-6xl font-bold text-blue-600 text-center mb-4">
            {roomCode}
          </div>
          <p className="text-center text-gray-600 mb-4">
            شارك هذا الرمز مع اللاعبين الآخرين
          </p>
          <button
            onClick={copyJoinLink}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 w-full"
          >
            نسخ رابط الانضمام
          </button>
        </div>

        {/* QR Code */}
        {qrCode && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
            <h3 className="text-lg font-bold text-gray-700 mb-4">QR Code للانضمام السريع</h3>
            <Image src={qrCode} alt="QR Code" width={200} height={200} className="mx-auto mb-4" />
            <p className="text-sm text-gray-600">
              يمكن للاعبين مسح هذا الكود للانضمام مباشرة
            </p>
          </div>
        )}

        {/* Players List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4">
            اللاعبون ({players.length}/9)
          </h3>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-700">
                    {player.nickname}
                    {player.isHost && (
                      <span className="text-blue-600 text-sm mr-2">(المضيف)</span>
                    )}
                  </span>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={startGame}
          disabled={players.length < 3}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
        >
          {players.length < 3 ? `تحتاج ${3 - players.length} لاعبين إضافيين` : 'بدء اللعبة'}
        </button>
      </div>
    </div>
  );
}
