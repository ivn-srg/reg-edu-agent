import { useState, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { apiClient, type MessageHistory } from '../api/client';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const { 
    addMessage, 
    currentType, 
    currentConversationId, 
    saveMessageToDb,
    onConversationCreated, 
    setCurrentConversationId,
    setLoading,
    isLoading,
    messages,
    userId,
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

  // Update the handleSend function in ChatInput.tsx
const handleSend = async () => {
  if (!input.trim() || isLoading || !currentType) return;

  const userMessage = input.trim();
  setInput('');

  try {
    setLoading(true);
    
    // Get conversation ID or create a new conversation
    let conversationId = currentConversationId;
    if (!conversationId) {
      const title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
      console.log('Creating new conversation:', { userId, title, type: currentType });
      const newConversation = await apiClient.createConversation({
        user_id: userId,
        title: title,
        conversation_type: currentType,
      });
      conversationId = newConversation.id;
      console.log('Conversation created:', conversationId);
      setCurrentConversationId(conversationId);
      
      if (onConversationCreated) {
        onConversationCreated();
      }
    }

    // Add user message to local store
    const userMsg = {
      role: 'user' as const,
      content: userMessage,
      type: currentType,
    };
    addMessage(userMsg);

    // Save user message to database
    console.log('Saving user message to conversation:', conversationId);
    await apiClient.addMessage(conversationId, {
      role: 'user',
      content: userMessage,
    });
    console.log('User message saved');

    // Get response based on message type
    const history = getHistory();
    let response;

    switch (currentType) {
      case 'question':
        response = await apiClient.ask({
          question: userMessage,
          history: history,
        });
        break;
      case 'quiz':
        response = await apiClient.quiz({
          topic: userMessage,
          history: history,
        });
        break;
      case 'task':
        response = await apiClient.task({
          topic: userMessage,
          history: history,
        });
        break;
      default:
        throw new Error(`Unknown message type: ${currentType}`);
    }

    // Process assistant's response
    if (response) {
      let content = '';
      if ('answer' in response) {
        content = response.answer;
      } else if ('questions' in response) {
        content = response.questions;
      } else if ('task' in response) {
        content = response.task;
      }

      const assistantMessage = {
        role: 'assistant' as const,
        content,
        type: currentType,
      };

      // Add to local store
      addMessage(assistantMessage);

      // Save to database
      await apiClient.addMessage(conversationId, {
        role: 'assistant',
        content: content,
      });

    } else {
      console.error('No response received from server');
      throw new Error('No response received from server');
    }

  } catch (error) {
    console.error('Error in handleSend:', error);
    // Optionally show error to user
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

