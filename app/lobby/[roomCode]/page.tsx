'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getSocket } from '../../lib/socketClient';
import QRCode from 'qrcode';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isYou?: boolean;
}

interface Category {
  id: string;
  name: string;
  words: string[];
}

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [socket, setSocket] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('1');
  const [linkCopied, setLinkCopied] = useState(false);

  const roomCode = params.roomCode as string;
  const nickname = searchParams.get('nickname');
  const isHostParam = searchParams.get('isHost') === 'true';

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
    newSocket.on('join-success', (data: any) => {
      console.log('JOIN_SUCCESS data=', data);
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
        console.log('SOCKET_EMIT event=get-room-state roomCode=', roomCode);
        socket.emit('get-room-state', { roomCode });
      } else if (nickname) {
        console.log('SOCKET_EMIT event=join-room roomCode=', roomCode, 'nickname=', nickname);
        socket.emit('join-room', { roomCode, playerName: decodeURIComponent(nickname) });
      }
    }
  }, [socket, roomCode, isHostParam, nickname]);

  useEffect(() => {
    if (roomCode) {
      // Generate QR code
      const qrData = `${window.location.origin}/join/${roomCode}`;
      QRCode.toDataURL(qrData, { width: 200, margin: 2 }, (err, url) => {
        if (err) {
          console.error('QR Code generation error:', err);
        } else {
          setQrCodeDataUrl(url);
        }
      });
    }
  }, [roomCode]);

  const copyLink = async () => {
    const link = `${window.location.origin}/join/${roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const startGame = () => {
    if (players.length < 3) {
      alert('تحتاج 3 لاعبين على الأقل لبدء اللعبة');
      return;
    }
    
    setIsStarting(true);
    console.log('SOCKET_EMIT event=start-game roomCode=', roomCode);
    socket.emit('start-game', { 
      roomCode, 
      category: selectedCategory,
      playersCount: players.length 
    });
  };

  if (!nickname && !isHostParam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">لم يتم العثور على معلومات اللاعب</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎮 غرفة اللعبة</h1>
          <div className="bg-white rounded-2xl shadow-lg p-6 inline-block">
            <p className="text-2xl font-mono font-bold text-blue-600 mb-2">كود الغرفة</p>
            <p className="text-4xl font-mono font-bold text-gray-800">{roomCode}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - QR Code and Link */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📱 انضم بالمسح</h2>
              {qrCodeDataUrl ? (
                <div className="flex justify-center">
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              <p className="text-sm text-gray-600 mt-4">امسح الكود للانضمام للعبة</p>
            </div>

            {/* Copy Link */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🔗 رابط المشاركة</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/join/${roomCode}`}
                  readOnly
                  className="flex-1 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                />
                <button
                  onClick={copyLink}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    linkCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {linkCopied ? '✅ تم النسخ!' : '📋 نسخ'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Players and Settings */}
          <div className="space-y-6">
            {/* Players List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                👥 اللاعبون ({players.length}/9)
              </h2>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center p-3 rounded-lg ${
                      player.isHost ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {player.name} {player.isYou && '(أنت)'}
                      </p>
                      {player.isHost && (
                        <p className="text-sm text-yellow-600">👑 المضيف</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: 9 - players.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="flex items-center p-3 rounded-lg bg-gray-100">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-bold mr-3">
                      {players.length + index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-500">مقعد فارغ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Selection (Host Only) */}
            {isHostParam && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 اختر الفئة</h2>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Game Button */}
            {isHostParam ? (
              <button
                onClick={startGame}
                disabled={isStarting || players.length < 3}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
                  isStarting || players.length < 3
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isStarting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    جاري البدء...
                  </div>
                ) : (
                  `🚀 بدء اللعبة (${players.length}/3)`
                )}
              </button>
            ) : (
              <div className="bg-blue-50 rounded-2xl p-6 text-center">
                <p className="text-blue-700 font-medium">
                  انتظر حتى يبدأ المضيف اللعبة...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}