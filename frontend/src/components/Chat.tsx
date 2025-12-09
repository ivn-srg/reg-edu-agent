import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

export default function Chat() {
  const { messages, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto px-4 md:px-6 py-6">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-600 dark:text-gray-400 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 dark:text-white mb-2">
              Начните общение с EduRAG
            </h2>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
              Выберите тип запроса и задайте вопрос агенту
            </p>
          </div>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

