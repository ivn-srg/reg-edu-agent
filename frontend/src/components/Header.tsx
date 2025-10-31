import { BookOpen } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import TypeSelector from './TypeSelector';

export default function Header() {
  const { currentType, clearMessages } = useChatStore();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 dark:text-white font-display">
                EduRAG
              </h1>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                Хранение данных и Введение в машинное обучение
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none">
              <TypeSelector />
            </div>
            {currentType && (
              <button
                onClick={clearMessages}
                className="px-3 md:px-4 py-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 dark:text-gray-400 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
              >
                Очистить
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

