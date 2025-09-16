'use client';

import { motion } from 'framer-motion';
import { GameState } from '@/app/types/game';

interface ResultsScreenProps {
  gameState: GameState;
  onBackToHome: () => void;
}

export default function ResultsScreen({ gameState, onBackToHome }: ResultsScreenProps) {
  const spyIndex = gameState.room.spyIndex;
  const votes = gameState.room.votes;
  const word = gameState.room.word;

  // Count votes for each player
  const voteCounts = new Array(gameState.room.players).fill(0);
  votes.forEach(vote => {
    if (vote >= 0) voteCounts[vote]++;
  });

  const maxVotes = Math.max(...voteCounts);
  const mostVotedPlayers = voteCounts
    .map((count, index) => ({ count, player: index }))
    .filter(item => item.count === maxVotes)
    .map(item => item.player);

  const spyWasFound = mostVotedPlayers.includes(spyIndex);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            🏆 نتائج اللعبة
          </motion.h1>
        </div>

        {/* Spy Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card mb-6"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              الجاسوس كان اللاعب {spyIndex + 1}!
            </h2>
            <p className="text-gray-600 mb-4">
              الكلمة كانت: <span className="font-bold text-primary-600">{word}</span>
            </p>
          </div>
        </motion.div>

        {/* Voting Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">نتائج التصويت</h3>
          <div className="space-y-2">
            {voteCounts.map((count, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === spyIndex
                    ? 'bg-red-50 border-2 border-red-200'
                    : mostVotedPlayers.includes(index)
                    ? 'bg-yellow-50 border-2 border-yellow-200'
                    : 'bg-gray-50'
                }`}
              >
                  <span className="font-medium">
                    اللاعب {index + 1}
                    {index === spyIndex && ' (الجاسوس)'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} صوت
                  </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Outcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={`card mb-8 ${
            spyWasFound ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">
              {spyWasFound ? '🎉' : '😈'}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {spyWasFound ? 'الجاسوس اتقبض عليه!' : 'الجاسوس هرب!'}
            </h3>
            <p className="text-sm text-gray-600">
              {spyWasFound
                ? 'المجموعة نجحت في التعرف على الجاسوس!'
                : 'الجاسوس نجح في تجنب الكشف و ربح اللعبة!'}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBackToHome}
            className="btn-primary w-full text-lg py-4"
          >
            لعب تاني
          </motion.button>
        </motion.div>

        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>الفئة: {gameState.room.category}</p>
          <p>اللاعبين: {gameState.room.players}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
