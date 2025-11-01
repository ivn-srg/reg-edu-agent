import { BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 dark:text-white font-display">
              EduRAG
            </h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Хранение данных и Введение в машинное обучение
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

