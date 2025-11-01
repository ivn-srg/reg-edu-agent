import { useEffect, useState } from 'react';
import { MessageSquare, Trash2, Plus, Search, Filter, Download, Edit2, Check, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { apiClient, type ConversationListItem } from '../api/client';

export default function ConversationHistory() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const limit = 20;
  
  const { 
    userId, 
    currentConversationId, 
    loadConversation, 
    clearMessages,
    setCurrentType,
    setOnConversationCreated,
  } = useChatStore();

  useEffect(() => {
    loadConversations();
    
    // Устанавливаем callback для обновления списка при создании диалога
    setOnConversationCreated(() => {
      loadConversations();
    });
    
    return () => {
      setOnConversationCreated(null);
    };
  }, [userId, searchQuery, filterType, page]);

  const loadConversations = async () => {
    try {
      const data = await apiClient.getUserConversations(userId, {
        skip: page * limit,
        limit,
        search: searchQuery || undefined,
        conversation_type: filterType || undefined,
      });
      setConversations(data.conversations);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleSelectConversation = async (conversationId: number) => {
    await loadConversation(conversationId);
    setIsOpen(false);
  };

  const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Вы уверены, что хотите удалить этот диалог?')) {
      return;
    }

    try {
      await apiClient.deleteConversation(conversationId);
      await loadConversations();
      
      if (conversationId === currentConversationId) {
        clearMessages();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleExportConversation = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const data = await apiClient.exportConversation(conversationId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_${conversationId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export conversation:', error);
    }
  };

  const handleStartEdit = (conv: ConversationListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!editTitle.trim()) return;
    
    try {
      await apiClient.updateConversationTitle(conversationId, editTitle.trim());
      await loadConversations();
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleNewConversation = () => {
    clearMessages();
    setCurrentType(null);
    setIsOpen(false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setPage(0);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'question': return 'Вопрос';
      case 'quiz': return 'Квиз';
      case 'task': return 'Задание';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 text-white p-2 rounded-lg shadow-lg"
        aria-label="Toggle conversation history"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Новый диалог
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              Фильтры
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="space-y-2">
                <select
                  value={filterType}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все типы</option>
                  <option value="question">Вопросы</option>
                  <option value="quiz">Квизы</option>
                  <option value="task">Задания</option>
                </select>
              </div>
            )}
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery || filterType ? 'Ничего не найдено' : 'Нет сохраненных диалогов'}
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    conv.id === currentConversationId
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {getTypeLabel(conv.conversation_type)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(conv.updated_at)}
                        </span>
                      </div>
                      
                      {editingId === conv.id ? (
                        <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveEdit(conv.id, e)}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                          {conv.title}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {conv.message_count} сообщений
                      </p>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleStartEdit(conv, e)}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                        aria-label="Редактировать"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={(e) => handleExportConversation(conv.id, e)}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                        aria-label="Экспорт"
                      >
                        <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                <span className="text-gray-600 dark:text-gray-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
