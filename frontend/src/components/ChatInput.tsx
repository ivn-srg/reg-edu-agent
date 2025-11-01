import { useState, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { apiClient, type MessageHistory } from '../api/client';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const { 
    addMessage, 
    setLoading, 
    isLoading, 
    currentType, 
    messages,
    currentConversationId,
    createNewConversation,
    saveMessageToDb,
  } = useChatStore();

  const getHistory = (): MessageHistory[] => {
    // Получаем историю сообщений только текущего типа запроса
    return messages
      .filter((msg) => msg.type === currentType)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentType) return;

    const userMessage = input.trim();
    setInput('');

    // Создаем новый диалог, если его еще нет
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation(currentType);
      if (!conversationId) {
        console.error('Failed to create conversation');
        return;
      }
    }

    // Получаем историю сообщений текущего типа ДО добавления нового сообщения
    const history = getHistory();

    // Добавляем сообщение пользователя
    addMessage({
      role: 'user',
      content: userMessage,
      type: currentType,
    });

    // Сохраняем сообщение пользователя в БД
    await saveMessageToDb('user', userMessage);

    setLoading(true);

    try {
      let response;
      
      let assistantMessage = '';
      
      switch (currentType) {
        case 'question':
          response = await apiClient.ask({ question: userMessage, history });
          assistantMessage = response.answer;
          addMessage({
            role: 'assistant',
            content: assistantMessage,
            type: currentType,
          });
          break;
        
        case 'quiz':
          response = await apiClient.quiz({ topic: userMessage, num: 5, history });
          assistantMessage = `Квиз по теме "${response.topic}":\n\n${response.questions}`;
          addMessage({
            role: 'assistant',
            content: assistantMessage,
            type: currentType,
          });
          break;
        
        case 'task':
          response = await apiClient.task({ topic: userMessage, history });
          assistantMessage = `Задание по теме "${response.topic}":\n\n${response.task}`;
          addMessage({
            role: 'assistant',
            content: assistantMessage,
            type: currentType,
          });
          break;
      }
      
      // Сохраняем ответ ассистента в БД
      if (assistantMessage) {
        await saveMessageToDb('assistant', assistantMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте еще раз.',
        type: currentType,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 md:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-2 md:gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              currentType
                ? `Задайте ${currentType === 'question' ? 'вопрос' : currentType === 'quiz' ? 'тему для квиза' : 'тему для задания'} агенту...`
                : 'Выберите тип запроса выше...'
            }
            disabled={isLoading || !currentType}
            className="flex-1 resize-none rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 dark:text-white px-3 md:px-4 py-2 md:py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
            rows={1}
            style={{
              minHeight: '48px',
              maxHeight: '144px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              const newHeight = Math.min(target.scrollHeight, 144);
              target.style.height = `${newHeight}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !currentType}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex-shrink-0"
            aria-label="Отправить сообщение"
          >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

