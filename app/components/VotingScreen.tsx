'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '@/app/types/game';

interface VotingScreenProps {
  gameState: GameState;
  onVote: (voter: number, target: number) => void;
  onFinishVoting: () => void;
  onBackToHome: () => void;
}

export default function VotingScreen({ 
  gameState, 
  onVote, 
  onFinishVoting, 
  onBackToHome 
}: VotingScreenProps) {
  const [currentVoter, setCurrentVoter] = useState(0);
  const [votes, setVotes] = useState<number[]>(new Array(gameState.room.players).fill(-1));
  const [showResults, setShowResults] = useState(false);

  const handleVote = (target: number) => {
    const newVotes = [...votes];
    newVotes[currentVoter] = target;
    setVotes(newVotes);
    onVote(currentVoter, target);

    if (currentVoter < gameState.room.players - 1) {
      setCurrentVoter(currentVoter + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleFinish = () => {
    onFinishVoting();
  };

  const handleBack = () => {
    onBackToHome();
  };

  if (showResults) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">التصويت خلاص!</h1>
          <p className="text-gray-600">هادا من صوت عليه كل واحد:</p>
          </div>

          <div className="space-y-4 mb-8">
            {votes.map((vote, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    اللاعب {index + 1}
                  </span>
                  <span className="text-primary-600">
                    صوت على اللاعب {vote + 1}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinish}
            className="btn-primary w-full text-lg py-4"
          >
            شوف النتائج النهائية
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">مرحلة التصويت</h1>
          <div className="w-10"></div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            اللاعب {currentVoter + 1}
          </h2>
          <p className="text-gray-600">
            من تظن أنه الجاسوس؟
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {Array.from({ length: gameState.room.players }, (_, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVote(i)}
              disabled={i === currentVoter}
              className={`w-full py-4 rounded-lg font-medium text-lg transition-all duration-200 ${
                i === currentVoter
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-300 text-gray-900'
              }`}
            >
              اللاعب {i + 1}
              {i === currentVoter && ' (نتا)'}
            </motion.button>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            {currentVoter + 1} من {gameState.room.players} لاعب صوت
          </p>
        </div>
      </motion.div>
    </div>
  );
}
