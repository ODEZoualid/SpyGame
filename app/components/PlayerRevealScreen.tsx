'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '@/app/types/game';
import CircularTimer from './CircularTimer';

interface PlayerRevealScreenProps {
  gameState: GameState;
  onNextQuestion: () => void;
  onBackToHome: () => void;
}

export default function PlayerRevealScreen({ 
  gameState, 
  onNextQuestion, 
  onBackToHome 
}: PlayerRevealScreenProps) {
  const [showCard, setShowCard] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const [isSpy, setIsSpy] = useState(false);

  const currentPlayer = gameState.room.currentPlayer;
  const spyIndex = gameState.room.spyIndex;
  const currentQuestion = gameState.room.currentQuestion;
  const isSpyPlayer = currentPlayer === spyIndex;

  useEffect(() => {
    setIsSpy(isSpyPlayer);
    setShowCard(false);
    setTimerComplete(false);
    
    // Show card after a short delay
    const timer = setTimeout(() => {
      setShowCard(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPlayer, isSpyPlayer]);

  const handleTimerComplete = () => {
    setTimerComplete(true);
  };

  const handleNext = () => {
    onNextQuestion();
  };

  const handleBack = () => {
    onBackToHome();
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">
              اللاعب {currentPlayer + 1}
            </h1>
            <p className="text-sm text-gray-600">
              السؤال {currentQuestion} من 3
            </p>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-8">
          <CircularTimer
            duration={20}
            onComplete={handleTimerComplete}
            size={140}
            strokeWidth={10}
          />
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: showCard ? 1 : 0, 
            scale: showCard ? 1 : 0.8 
          }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="card min-h-[200px] flex items-center justify-center">
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: showCard ? 360 : 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              {isSpy ? (
                <div>
                  <div className="text-6xl mb-4">🎭</div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">
                    نتا الجاسوس!
                  </h2>
                  <p className="text-gray-600">
                    حاول تعرف شنو الكلمة باش ما تتبانش!
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-bold text-primary-600 mb-2">
                    {gameState.room.word}
                  </h2>
                  <p className="text-gray-600">
                    اسأل أسئلة باش تجد الجاسوس!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Instructions */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            {isSpy 
              ? "اسأل أسئلة عامة باش تعرف الكلمة بدون ما تتبان!"
              : "اسأل أسئلة محددة على الكلمة باش تجد الجاسوس!"
            }
          </p>
          {timerComplete && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-primary-600 font-medium"
            >
              الوقت خلاص! جاهز للسؤال الجاي؟
            </motion.p>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={!timerComplete}
          className={`w-full py-4 rounded-lg font-medium text-lg transition-all duration-200 ${
            timerComplete
              ? 'btn-primary'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {currentQuestion < 3 ? 'السؤال الجاي' : 'دور للاعب الجاي'}
        </motion.button>

        {/* Progress Indicator */}
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: gameState.room.players }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i === currentPlayer
                  ? 'bg-primary-500'
                  : i < currentPlayer
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
