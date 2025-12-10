import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

export default function Chat() {
  const { messages, isLoading, currentConversationId } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages, isLoading]);

  // Timer for generation time display
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="h-full flex flex-col">
      {/* Chat name header */}
      {currentConversationId && safeMessages.length > 0 && (
        <div className="px-4 md:px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
              {safeMessages[0]?.content?.substring(0, 50) || 'Диалог'}
            </h2>
          </div>
        </div>
      )}
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {safeMessages.length === 0 && !currentConversationId && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-600 dark:text-gray-400"
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
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Select a chat or create a new one
              </h2>
            </div>
          )}
          {safeMessages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isLoading && <TypingIndicator elapsedTime={elapsedTime} />}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

