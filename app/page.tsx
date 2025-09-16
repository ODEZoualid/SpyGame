'use client';

import { useState } from 'react';

interface GameState {
  players: number;
  currentPlayer: number;
  category: string;
  word: string;
  spyIndex: number;
  currentQuestion: number;
  phase: 'spy-assignment' | 'word-reveal' | 'questions' | 'voting';
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [players, setPlayers] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState('الأكل');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSpyAssignment, setShowSpyAssignment] = useState(false);
  const [showWord, setShowWord] = useState(false);

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

  const startGame = () => {
    const category = categories.find(c => c.name === selectedCategory);
    if (!category) return;
    
    const spyIndex = Math.floor(Math.random() * players);
    const word = category.words[Math.floor(Math.random() * category.words.length)];
    
    setGameState({
      players,
      currentPlayer: 0,
      category: selectedCategory,
      word,
      spyIndex,
      currentQuestion: 1,
      phase: 'spy-assignment'
    });
    setShowSpyAssignment(true);
    setShowWord(false);
    setCurrentScreen('game');
  };

  const nextQuestion = () => {
    setGameState(prev => {
      if (!prev) return prev;
      if (prev.currentQuestion < 3) {
        return { ...prev, currentQuestion: prev.currentQuestion + 1 };
      } else if (prev.currentPlayer < prev.players - 1) {
        return { 
          ...prev, 
          currentPlayer: prev.currentPlayer + 1, 
          currentQuestion: 1 
        };
      } else {
        return { ...prev, phase: 'voting' };
      }
    });
  };

  const resetGame = () => {
    setGameState(null);
    setShowSpyAssignment(false);
    setShowWord(false);
    setCurrentScreen('home');
  };

  const showWordToOthers = () => {
    setShowSpyAssignment(false);
    setShowWord(true);
    setGameState(prev => prev ? { ...prev, phase: 'word-reveal' } : prev);
  };

  const startQuestions = () => {
    setShowWord(false);
    setGameState(prev => prev ? { ...prev, phase: 'questions' } : prev);
  };

  if (currentScreen === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => setCurrentScreen('home')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">بدا لعبة</h1>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عدد اللاعبين
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={players}
                onChange={(e) => setPlayers(parseInt(e.target.value) || 3)}
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
              onClick={startGame}
              disabled={players < 3}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              بدا اللعبة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'game' && gameState) {
    // Phase 1: Randomly assign spy (everyone sees this)
    if (gameState.phase === 'spy-assignment' && showSpyAssignment) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                اختيار الجاسوس
              </h1>
              <p className="text-gray-600 mb-8">
                سيتم اختيار الجاسوس عشوائياً الآن
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[200px] flex items-center justify-center mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🎲</div>
                <h2 className="text-3xl font-bold text-purple-600 mb-4">
                  الجاسوس هو اللاعب {gameState.spyIndex + 1}
                </h2>
                <p className="text-gray-600 mb-4">
                  اللاعب {gameState.spyIndex + 1} هو الجاسوس!
                </p>
                <p className="text-sm text-gray-500">
                  الجاسوس ما يعرفش الكلمة و لازم يعرفها من الأسئلة
                </p>
              </div>
            </div>

            <button
              onClick={showWordToOthers}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              فهمت - شوف الكلمة
            </button>
          </div>
        </div>
      );
    }

    // Phase 2: Show word to everyone except spy
    if (gameState.phase === 'word-reveal' && showWord) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                الكلمة للجميع (عدا الجاسوس)
              </h1>
              <p className="text-gray-600 mb-8">
                كل اللاعبين عدا الجاسوس (اللاعب {gameState.spyIndex + 1}) يجب أن يروا الكلمة
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[200px] flex items-center justify-center mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-3xl font-bold text-blue-600 mb-4">
                  {gameState.word}
                </h2>
                <p className="text-gray-600">
                  هاد هي الكلمة اللي لازم تسألوا عليها
                </p>
                <p className="text-sm text-red-500 mt-2">
                  الجاسوس (اللاعب {gameState.spyIndex + 1}) ما يلزمش يشوف هاد الشاشة!
                </p>
              </div>
            </div>

            <button
              onClick={startQuestions}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              الكل شاف الكلمة - بدا الأسئلة
            </button>
          </div>
        </div>
      );
    }

    // Phase 3: Questions phase (no word/spy shown)
    if (gameState.phase === 'questions') {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold text-gray-900">
                اللاعب {gameState.currentPlayer + 1}
              </h1>
              <p className="text-sm text-gray-600">
                السؤال {gameState.currentQuestion} من 3
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[200px] flex items-center justify-center mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">❓</div>
                <h2 className="text-2xl font-bold text-gray-700 mb-4">
                  دورك تسأل
                </h2>
                <p className="text-gray-600">
                  اسأل سؤال على الكلمة
                </p>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">
                اسأل سؤال على الكلمة. الجاسوس (اللاعب {gameState.spyIndex + 1}) ما يعرفش الكلمة و لازم يعرفها!
              </p>
            </div>

            <button
              onClick={nextQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
            >
              {gameState.currentQuestion < 3 ? 'السؤال الجاي' : 'دور للاعب الجاي'}
            </button>

            <div className="mt-6 flex justify-center space-x-2">
              {Array.from({ length: gameState.players }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i === gameState.currentPlayer
                      ? 'bg-blue-500'
                      : i < gameState.currentPlayer
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          التحدي
        </h1>
        <h2 className="text-xl text-gray-600 mb-8">
          لعبة الجاسوس
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={() => setCurrentScreen('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm w-full text-lg py-4"
          >
            🎮 بدا لعبة
          </button>
          
          <button
            onClick={() => alert('الفئات - قريباً!')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 w-full text-lg py-4"
          >
            📂 الفئات
          </button>
          
          <button
            onClick={() => alert('كيفاش نلعب - قريباً!')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 w-full text-lg py-4"
          >
            ❓ كيفاش نلعب
          </button>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>دور الهاتف و جد الجاسوس!</p>
        </div>
      </div>
    </div>
  );
}
