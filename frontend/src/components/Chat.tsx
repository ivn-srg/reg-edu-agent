import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import { apiClient, type MessageHistory } from '../api/client';

export default function Chat() {
  const { 
    messages, 
    isLoading, 
    currentType, 
    addMessage, 
    setLoading, 
    saveMessageToDb, 
    onConversationCreated,
    currentConversationId,
    createNewConversation,
  } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleResend = async (content: string) => {
    if (!currentType || isLoading) return;

    // Создаем новый диалог, если его еще нет
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation(currentType, content);
      if (!conversationId) {
        console.error('Failed to create conversation');
        return;
      }
    }

    // Получаем историю
    const history: MessageHistory[] = messages
      .filter((msg) => msg.type === currentType)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Добавляем сообщение пользователя
    addMessage({
      role: 'user',
      content,
      type: currentType,
    });

    // Сохраняем в БД
    await saveMessageToDb('user', content);

    setLoading(true);
    const startTime = Date.now();

    try {
      let response;
      let assistantMessage = '';
      
      switch (currentType) {
        case 'question':
          response = await apiClient.ask({ question: content, history });
          assistantMessage = response.answer;
          break;
        
        case 'quiz':
          response = await apiClient.quiz({ topic: content, num: 5, history });
          assistantMessage = `Квиз по теме "${response.topic}":\n\n${response.questions}`;
          break;
        
        case 'task':
          response = await apiClient.task({ topic: content, history });
          assistantMessage = `Задание по теме "${response.topic}":\n\n${response.task}`;
          break;
      }
      
      const generationTime = (Date.now() - startTime) / 1000;
      
      addMessage({
        role: 'assistant',
        content: assistantMessage,
        type: currentType,
        generationTime,
      });
      
      if (assistantMessage) {
        await saveMessageToDb('assistant', assistantMessage);
      }
      
      // Обновляем список диалогов
      if (onConversationCreated) {
        onConversationCreated();
      }
    } catch (error) {
      console.error('Error resending message:', error);
      addMessage({
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте еще раз.',
        type: currentType,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 md:px-6 py-6">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 && (
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
              Начните общение с EduRAG
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Нажмите "Новый диалог" для начала работы
            </p>
          </div>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} onResend={handleResend} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

