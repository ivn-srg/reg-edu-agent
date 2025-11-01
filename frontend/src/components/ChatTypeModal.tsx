import { useState } from 'react';
import { X, MessageCircle, HelpCircle, ClipboardList } from 'lucide-react';
import type { MessageType } from '../types';

interface ChatTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: MessageType) => void;
}

const chatTypes = [
  {
    type: 'question' as MessageType,
    icon: MessageCircle,
    title: 'Вопросы',
    description: 'Задавайте вопросы по материалам курса',
    onboarding: [
      'Формулируйте вопросы четко и конкретно',
      'Бот отвечает только на основе загруженных материалов',
      'Можно задавать уточняющие вопросы в рамках диалога',
      'Если информации нет в материалах, бот сообщит об этом'
    ],
    color: 'blue'
  },
  {
    type: 'quiz' as MessageType,
    icon: HelpCircle,
    title: 'Квиз',
    description: 'Генерация тестовых вопросов по теме',
    onboarding: [
      'Укажите тему для генерации вопросов',
      'Бот создаст 5 вопросов с вариантами ответов',
      'Вопросы основаны только на материалах курса',
      'Можно запросить квиз по другой теме в том же диалоге'
    ],
    color: 'green'
  },
  {
    type: 'task' as MessageType,
    icon: ClipboardList,
    title: 'Задание',
    description: 'Создание практических заданий',
    onboarding: [
      'Укажите тему для генерации задания',
      'Бот создаст задание с критериями оценивания',
      'Задание включает цель, формулировку и формат ответа',
      'Все задания основаны на материалах курса'
    ],
    color: 'purple'
  }
];

export default function ChatTypeModal({ isOpen, onClose, onSelect }: ChatTypeModalProps) {
  const [selectedType, setSelectedType] = useState<MessageType | null>(null);

  if (!isOpen) return null;

  const handleSelect = (type: MessageType) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType);
      setSelectedType(null);
      onClose();
    }
  };

  const selectedInfo = chatTypes.find(t => t.type === selectedType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Выберите тип диалога
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedType ? (
            <div className="grid gap-4">
              {chatTypes.map((chatType) => {
                const Icon = chatType.icon;
                const colorClasses = {
                  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
                  green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
                  purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600'
                };

                return (
                  <button
                    key={chatType.type}
                    onClick={() => handleSelect(chatType.type)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${colorClasses[chatType.color as keyof typeof colorClasses]}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${chatType.color === 'blue' ? 'bg-blue-600' : chatType.color === 'green' ? 'bg-green-600' : 'bg-purple-600'} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                          {chatType.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {chatType.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              {/* Selected type info */}
              <div className="mb-6">
                {selectedInfo && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const Icon = selectedInfo.icon;
                        return (
                          <div className={`w-12 h-12 rounded-lg ${selectedInfo.color === 'blue' ? 'bg-blue-600' : selectedInfo.color === 'green' ? 'bg-green-600' : 'bg-purple-600'} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        );
                      })()}
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                          {selectedInfo.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedInfo.description}
                        </p>
                      </div>
                    </div>

                    {/* Onboarding */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                        Как работать:
                      </h4>
                      <ul className="space-y-2">
                        {selectedInfo.onboarding.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedType(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Начать диалог
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
