'use client';

import { useState, useEffect } from 'react';
import { GameState, Category } from '@/app/types/game';

const defaultCategories: Category[] = [
  {
    id: '1',
    name: 'الأكل',
    words: ['الكسكس', 'الطاجين', 'الحريرة', 'البيتزا', 'البرغر', 'السلطة']
  },
  {
    id: '2',
    name: 'الحيوانات',
    words: ['الفيل', 'الدلفين', 'البطريق', 'الأسد', 'النمر', 'الزرافة']
  },
  {
    id: '3',
    name: 'المدن',
    words: ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة']
  },
  {
    id: '4',
    name: 'الألوان',
    words: ['الأحمر', 'الأزرق', 'الأخضر', 'الأصفر', 'الوردي', 'البرتقالي']
  }
];

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);

  // Load categories from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('spy-game-categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('spy-game-categories', JSON.stringify(categories));
  }, [categories]);

  const createGame = (players: number, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || category.words.length === 0) return;

    const spyIndex = Math.floor(Math.random() * players);
    const word = category.words[Math.floor(Math.random() * category.words.length)];

    const newGameState: GameState = {
      room: {
        players,
        currentPlayer: 0,
        category: category.name,
        word,
        spyIndex,
        currentQuestion: 1,
        phase: 'reveal',
        votes: []
      }
    };

    setGameState(newGameState);
  };

  const nextQuestion = () => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      
      const newState = { ...prev };
      if (newState.room.currentQuestion < 3) {
        newState.room.currentQuestion++;
      } else {
        // Move to next player
        if (newState.room.currentPlayer < newState.room.players - 1) {
          newState.room.currentPlayer++;
          newState.room.currentQuestion = 1;
        } else {
          // All players done, move to voting
          newState.room.phase = 'voting';
        }
      }
      return newState;
    });
  };

  const submitVote = (voter: number, target: number) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      
      const newState = { ...prev };
      newState.room.votes[voter] = target;
      return newState;
    });
  };

  const finishVoting = () => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return prev;
      
      const newState = { ...prev };
      newState.room.phase = 'results';
      return newState;
    });
  };

  const resetGame = () => {
    setGameState(null);
  };

  const addCategory = (name: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      words: []
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const addWord = (categoryId: string, word: string) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, words: [...cat.words, word] }
          : cat
      )
    );
  };

  const removeWord = (categoryId: string, wordIndex: number) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, words: cat.words.filter((_, index) => index !== wordIndex) }
          : cat
      )
    );
  };

  const removeCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  return {
    gameState,
    categories,
    createGame,
    nextQuestion,
    submitVote,
    finishVoting,
    resetGame,
    addCategory,
    addWord,
    removeWord,
    removeCategory
  };
}
