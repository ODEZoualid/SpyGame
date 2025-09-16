'use client';

import { motion } from 'framer-motion';

export default function HowToPlayScreen({ onBack }: { onBack: () => void }) {
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
          <h1 className="text-2xl font-bold text-gray-900">كيفاش نلعب</h1>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 الهدف</h2>
            <p className="text-gray-700">
              جد الجاسوس في مجموعتك! كل واحد غير الجاسوس كيشوف نفس الكلمة. 
              الجاسوس كيشوف &quot;نتا الجاسوس!&quot; و لازم يعرف شنو الكلمة باش ما يتبانش.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎮 سيرورة اللعبة</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                <span>بدا لعبة و اختار عدد اللاعبين و الفئة</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                <span>لاعب واحد كيتختار عشوائياً كجاسوس، الباقي كيشوف نفس الكلمة</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
                <span>كل لاعب كيحصل على 3 أسئلة مع مؤقت باش يناقش الكلمة</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">4</span>
                <span>بعد ما كل اللاعبين يخلصوا، صوت على من تظن أنه الجاسوس</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">5</span>
                <span>شوف النتائج و اعرف من كان الجاسوس!</span>
              </li>
            </ol>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 نصائح للاعبين</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <span className="text-primary-600 mr-3">🎭</span>
                <div>
                  <strong>إذ كنت الجاسوس:</strong> اسأل أسئلة عامة و حاول تعرف الكلمة. 
                  ما تكونش واضح بزاف إنك ما تعرفش!
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-primary-600 mr-3">👥</span>
                <div>
                  <strong>إذ ما كنتش الجاسوس:</strong> اسأل أسئلة محددة على الكلمة. 
                  راقب اللاعبين اللي كيبدوا حائرين أو كيسألوا أسئلة غامضة.
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-primary-600 mr-3">⏰</span>
                <div>
                  <strong>استعمل المؤقت بحكمة:</strong> كل لاعب عندو وقت محدود لـ 3 أسئلة. 
                  خليهم يكونوا مهمين!
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-primary-50 border-primary-200"
          >
            <h2 className="text-xl font-semibold text-primary-900 mb-4">📱 مشاركة الجهاز</h2>
            <p className="text-primary-800">
              هاد اللعبة مصممة باش تلعب على جهاز واحد مشترك. اللاعبين كيدوروا الجهاز 
              خلال دورهم. تأكد إن كل واحد يقدر يشوف الشاشة وقت دورو!
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
