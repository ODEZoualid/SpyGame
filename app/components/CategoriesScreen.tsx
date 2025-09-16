'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '@/app/hooks/useGameState';

export default function CategoriesScreen({ onBack }: { onBack: () => void }) {
  const { categories, addCategory, addWord, removeWord, removeCategory } = useGameState();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newWord, setNewWord] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleAddWord = () => {
    if (newWord.trim() && selectedCategory) {
      addWord(selectedCategory, newWord.trim());
      setNewWord('');
    }
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">الفئات</h1>
        </div>

        {/* Add New Category */}
        <div className="card mb-6">
          <h3 className="font-medium text-gray-900 mb-4">ضيف فئة جديدة</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="اسم الفئة"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={handleAddCategory}
              className="btn-primary px-4"
            >
              ضيف
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  {category.name} ({category.words.length} كلمة)
                </h3>
                <button
                  onClick={() => removeCategory(category.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  احذف
                </button>
              </div>

              {/* Add Word to Category */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="ضيف كلمة جديدة"
                  value={selectedCategory === category.id ? newWord : ''}
                  onChange={(e) => {
                    setSelectedCategory(category.id);
                    setNewWord(e.target.value);
                  }}
                  className="input-field flex-1"
                />
                <button
                  onClick={() => {
                    setSelectedCategory(category.id);
                    handleAddWord();
                  }}
                  className="btn-secondary px-4"
                >
                  ضيف كلمة
                </button>
              </div>

              {/* Words List */}
              <div className="flex flex-wrap gap-2">
                {category.words.map((word, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {word}
                    <button
                      onClick={() => removeWord(category.id, index)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>ما كاينش فئات دابا. ضيف أول فئة فوق!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
