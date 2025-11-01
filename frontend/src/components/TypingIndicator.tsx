import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  const dots = [0, 1, 2];

  return (
    <div className="flex items-end gap-2 md:gap-3 mb-4 justify-start">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 md:w-6 md:h-6 text-gray-800 dark:text-gray-100 dark:text-white" />
      </div>
      <div className="chat-bubble bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 px-3 py-2 md:px-4 md:py-3">
        <div className="flex gap-1">
          {dots.map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-600 dark:bg-gray-400"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

