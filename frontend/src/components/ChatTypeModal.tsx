import { X } from 'lucide-react';
import type { MessageType } from '../types';

interface ChatTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: MessageType) => void;
}

export default function ChatTypeModal({ isOpen, onClose, onSelect }: ChatTypeModalProps) {
  if (!isOpen) return null;

  const types: { value: MessageType; label: string; description: string }[] = [
    { value: 'question', label: 'Вопрос', description: 'Задайте вопрос агенту' },
    { value: 'quiz', label: 'Квиз', description: 'Сгенерируйте тест по теме' },
    { value: 'task', label: 'Задание', description: 'Получите задание для практики' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Выберите тип диалога
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          {types.map((type) => (
            <button
              key={type.value}
              onClick={() => onSelect(type.value)}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-700"
            >
              <div className="font-semibold text-gray-800 dark:text-white mb-1">
                {type.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {type.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

