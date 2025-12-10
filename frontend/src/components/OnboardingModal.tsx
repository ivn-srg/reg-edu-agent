import { motion } from 'framer-motion';
import { X, HelpCircle } from 'lucide-react';
import type { MessageType } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatType: MessageType | null;
}

export default function OnboardingModal({ isOpen, onClose, chatType }: OnboardingModalProps) {
  if (!isOpen || !chatType) return null;

  const getOnboardingContent = (type: MessageType) => {
    switch (type) {
      case 'question':
        return {
          title: '❓ Questions Mode',
          description: 'Ask any questions about the course material',
          instructions: [
            'Simply type your question in the input field',
            'The AI will provide detailed answers based on the course content',
            'You can ask follow-up questions to clarify any topic',
            'Perfect for understanding concepts and getting explanations'
          ]
        };
      case 'quiz':
        return {
          title: '🎯 Quiz Mode',
          description: 'Test your knowledge with quizzes',
          instructions: [
            'Specify only the quiz topic (e.g., "Data Structures", "Machine Learning Basics")',
            'Do not include detailed explanations or questions',
            'The AI will generate quiz questions on that topic',
            'Answer the questions to test your understanding',
            'Great for self-assessment and learning reinforcement'
          ]
        };
      case 'task':
        return {
          title: '📝 Task Mode',
          description: 'Get practical assignments and exercises',
          instructions: [
            'Specify only the task topic (e.g., "Implement a Binary Tree", "SQL Queries")',
            'Do not include detailed descriptions or requirements',
            'The AI will generate a practical task for you to complete',
            'Work through the task to apply what you\'ve learned',
            'Ideal for hands-on practice and skill development'
          ]
        };
      default:
        return {
          title: 'Chat Mode',
          description: 'Start learning',
          instructions: []
        };
    }
  };

  const content = getOnboardingContent(chatType);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {content.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {content.description}
          </p>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">How to use:</h3>
            <ul className="space-y-2">
              {content.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {instruction}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Got it! Let's start
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
