'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { config } from '../../config';

interface GameState {
  phase: 'card-flipping' | 'questions' | 'voting' | 'results';
  currentPlayer: number;
  spyIndex: number;
  word: string;
  category: string;
  timeRemaining: number;
  questionOrder: number[];
  currentQuestionIndex: number;
  votes: { [key: string]: string };
  cardsFlipped: number;
  currentCardFlipper: number;
  players: number;
  spyWon?: boolean;
}

interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  hasVoted: boolean;
  cardFlipped: boolean;
}

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isCardShowing, setIsCardShowing] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    const code = params.roomCode as string;
    setRoomCode(code);

    // Initialize socket connection
    const newSocket = io(config.SERVER_URL);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('game-started', (gameData) => {
      setGameState(gameData);
    });

    newSocket.on('players-updated', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('card-flipped', (data) => {
      setGameState(prev => prev ? {
        ...prev,
        cardsFlipped: data.cardsFlipped
      } : null);
    });

    newSocket.on('phase-changed', (data) => {
      setGameState(prev => prev ? {
        ...prev,
        phase: data.phase
      } : null);
    });

    newSocket.on('vote-recorded', (data) => {
      // Handle vote recording
    });

    newSocket.on('voting-complete', (data) => {
      setGameState(prev => prev ? {
        ...prev,
        phase: 'results',
        ...data.results
      } : null);
    });

    newSocket.on('join-error', (data) => {
      console.error('Join error:', data.message);
      router.push('/join');
    });

    return () => {
      newSocket.close();
    };
  }, [params.roomCode, router]);

  const flipCard = () => {
    if (socket && roomCode) {
      setIsCardShowing(true);
      socket.emit('flip-card', { roomCode });
      
      // Hide card after 2 seconds
      setTimeout(() => {
        setIsCardShowing(false);
      }, 2000);
    }
  };

  const voteForPlayer = (votedPlayerId: string) => {
    if (socket && roomCode) {
      socket.emit('vote', { roomCode, votedPlayerId });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل اللعبة...</p>
        </div>
      </div>
    );
  }

  // Card flipping phase
  if (gameState.phase === 'card-flipping') {
    const isSpy = gameState.currentCardFlipper === gameState.spyIndex;
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {isCardShowing ? `دور اللاعب ${gameState.currentCardFlipper + 1}` : 'قلب البطاقة'}
            </h1>
            <p className="text-gray-600 mb-4">
              {isCardShowing ? 'شوف بطاقتك و اقلبها للاعب الجاي' : `اللاعب ${gameState.currentCardFlipper + 1} يقلب البطاقة`}
            </p>
            <p className="text-sm text-gray-500">
              {gameState.cardsFlipped} من {gameState.players} شافوا البطاقة
            </p>
            {isCardShowing && (
              <p className="text-sm text-orange-500 mt-2">
                اقلب البطاقة و اعطيها للاعب الجاي بعد ثانيتين
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[300px] flex items-center justify-center mb-8">
            <div className="text-center">
              {isCardShowing ? (
                isSpy ? (
                  <>
                    <div className="text-8xl mb-6">🕵️</div>
                    <h2 className="text-3xl font-bold text-red-600 mb-4">
                      انتا الجاسوس!
                    </h2>
                    <p className="text-gray-600 mb-4">
                      ما تعرفش الكلمة و لازم تعرفها من الأسئلة
                    </p>
                    <p className="text-sm text-gray-500">
                      لا تخبر أحداً أنك الجاسوس!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-8xl mb-6">🔍</div>
                    <h2 className="text-3xl font-bold text-blue-600 mb-4">
                      {gameState.word}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      هاد هي الكلمة اللي لازم تسألوا عليها
                    </p>
                    <p className="text-sm text-gray-500">
                      الجاسوس ما يعرفش هاد الكلمة!
                    </p>
                  </>
                )
              ) : (
                <>
                  <div className="text-8xl mb-6">🎴</div>
                  <h2 className="text-2xl font-bold text-gray-700 mb-4">
                    اضغط لقلب البطاقة
                  </h2>
                  <p className="text-gray-600">
                    فقط اللاعب {gameState.currentCardFlipper + 1} يرى ما في البطاقة
                  </p>
                </>
              )}
            </div>
          </div>

          {!isCardShowing && (
            <button
              onClick={flipCard}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              قلب البطاقة
            </button>
          )}

          {isCardShowing && (
            <div className="bg-gray-100 text-gray-600 font-medium py-3 px-6 rounded-lg w-full text-lg py-4 text-center">
              اقلب البطاقة و اعطيها للاعب الجاي...
            </div>
          )}

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600 mb-3">
              تقدم اللعب
            </p>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: gameState.players }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i === gameState.currentCardFlipper && !isCardShowing
                      ? 'bg-purple-500'
                      : i < gameState.cardsFlipped
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Questions phase
  if (gameState.phase === 'questions') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-900">
              مرحلة الأسئلة
            </h1>
            <div className="text-4xl font-bold text-red-600 mb-2">
              {formatTime(gameState.timeRemaining)}
            </div>
            <p className="text-sm text-gray-600">
              الوقت المتبقي
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[200px] flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="text-6xl mb-4">❓</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                اسألوا الأسئلة
              </h2>
              <p className="text-gray-600 mb-4">
                اسألوا أسئلة على الكلمة لتعرفوا من هو الجاسوس
              </p>
              <p className="text-sm text-gray-500">
                الجاسوس ما يعرفش الكلمة و لازم يعرفها!
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-2">
            {Array.from({ length: gameState.players }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i === gameState.currentPlayer
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Voting phase
  if (gameState.phase === 'voting') {
    const hasVoted = gameState.votes[playerId] !== undefined;
    const allPlayersVoted = players.every(p => p.hasVoted);
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              التصويت
            </h1>
            <p className="text-gray-600">
              صوت على من تعتقد أنه الجاسوس
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {Object.keys(gameState.votes).length} من {gameState.players} صوتوا
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">
              من تعتقد أنه الجاسوس؟
            </h2>
            
            {hasVoted ? (
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-gray-600 mb-4">
                  تم تسجيل صوتك
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {players.map((player, i) => (
                  <button
                    key={player.id}
                    onClick={() => voteForPlayer(player.id)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    {player.nickname}
                  </button>
                ))}
              </div>
            )}
          </div>

          {allPlayersVoted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm text-center">
                جميع اللاعبين صوتوا! جاري عرض النتائج...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results phase
  if (gameState.phase === 'results') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              النتائج
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {gameState.spyWon ? '🎉' : '🕵️'}
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                {gameState.spyWon ? 'الجاسوس فاز!' : 'الجاسوس انكشف!'}
              </h2>
              <p className="text-gray-600 mb-4">
                الجاسوس كان: {players[gameState.spyIndex]?.nickname}
              </p>
              <p className="text-gray-600 mb-4">
                الكلمة كانت: <span className="font-bold text-blue-600">{gameState.word}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
          >
            لعبة جديدة
          </button>
        </div>
      </div>
    );
  }

  return null;
}
