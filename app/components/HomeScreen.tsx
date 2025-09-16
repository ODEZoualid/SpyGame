'use client';

import { motion } from 'framer-motion';

interface HomeScreenProps {
  onNavigate: (screen: 'create' | 'categories' | 'how-to-play') => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        <motion.h1 
          className="text-4xl font-bold text-primary-600 mb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          التحدي
        </motion.h1>
        <motion.h2 
          className="text-xl text-gray-600 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          لعبة الجاسوس
        </motion.h2>
        
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('create')}
            className="btn-primary w-full text-lg py-4"
          >
            🎮 بدا لعبة
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('categories')}
            className="btn-secondary w-full text-lg py-4"
          >
            📂 الفئات
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('how-to-play')}
            className="btn-secondary w-full text-lg py-4"
          >
            ❓ كيفاش نلعب
          </motion.button>
        </motion.div>
        
        <motion.div 
          className="mt-12 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>دور الهاتف و جد الجاسوس!</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
