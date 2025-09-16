'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '@/app/hooks/useGameState';

interface CreateGameScreenProps {
  onStartGame: (players: number, categoryId: string) => void;
  onBack: () => void;
}

export default function CreateGameScreen({ onStartGame, onBack }: CreateGameScreenProps) {
  const { categories } = useGameState();
  const [players, setPlayers] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');

  const handleStart = () => {
    if (selectedCategory) {
      onStartGame(players, selectedCategory);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md mx-auto"
      >
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
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
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفئة
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.words.length} كلمة)
                </option>
              ))}
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={!selectedCategory || players < 3}
            className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            بدا اللعبة
          </motion.button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">إعداد اللعبة</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {players} لاعب سيشارك</li>
            <li>• لاعب واحد سيتم اختياره عشوائياً كجاسوس</li>
            <li>• الباقي سيرى نفس الكلمة</li>
            <li>• كل لاعب يحصل على 3 أسئلة قبل التصويت</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
