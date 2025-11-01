# История диалогов (Conversation History)

## Обзор

Система сохранения истории диалогов позволяет пользователям сохранять и восстанавливать свои переписки с ботом. Все диалоги автоматически сохраняются в базу данных SQLite.

## Архитектура

### Backend

#### База данных (SQLite)
- **Файл**: `conversations.db` в корневой директории проекта
- **Таблицы**:
  - `conversations` - хранит информацию о диалогах
  - `messages` - хранит сообщения в диалогах

#### Модели данных (`src/database.py`)
- `Conversation` - модель диалога с полями:
  - `id` - уникальный идентификатор
  - `user_id` - идентификатор пользователя
  - `title` - заголовок диалога
  - `conversation_type` - тип диалога (question/quiz/task)
  - `created_at` - дата создания
  - `updated_at` - дата последнего обновления
  
- `Message` - модель сообщения с полями:
  - `id` - уникальный идентификатор
  - `conversation_id` - ссылка на диалог
  - `role` - роль (user/assistant)
  - `content` - содержимое сообщения
  - `timestamp` - время создания

#### CRUD операции (`src/crud.py`)
- `create_conversation()` - создание нового диалога
- `get_conversation()` - получение диалога по ID
- `get_user_conversations()` - получение всех диалогов пользователя
- `delete_conversation()` - удаление диалога
- `add_message()` - добавление сообщения в диалог
- `get_conversation_messages()` - получение всех сообщений диалога
- `update_conversation_title()` - обновление заголовка диалога

#### API эндпоинты (`src/server.py`)
- `POST /conversations` - создание нового диалога
- `GET /conversations/{conversation_id}` - получение диалога
- `GET /users/{user_id}/conversations` - список диалогов пользователя
- `DELETE /conversations/{conversation_id}` - удаление диалога
- `POST /messages` - добавление сообщения
- `GET /conversations/{conversation_id}/messages` - получение сообщений
- `PUT /conversations/{conversation_id}/title` - обновление заголовка

### Frontend

#### API клиент (`frontend/src/api/client.ts`)
Добавлены методы для работы с историей:
- `createConversation()`
- `getConversation()`
- `getUserConversations()`
- `deleteConversation()`
- `addMessage()`
- `getConversationMessages()`
- `updateConversationTitle()`

#### Store (`frontend/src/store/chatStore.ts`)
Добавлены новые состояния и методы:
- `currentConversationId` - ID текущего диалога
- `userId` - уникальный ID пользователя (генерируется автоматически)
- `createNewConversation()` - создание нового диалога
- `saveMessageToDb()` - сохранение сообщения в БД
- `loadConversation()` - загрузка диалога из БД

#### Компоненты

**ConversationHistory** (`frontend/src/components/ConversationHistory.tsx`)
- Боковая панель с историей диалогов
- Список всех сохраненных диалогов
- Возможность выбрать диалог для продолжения
- Удаление диалогов
- Создание нового диалога
- Адаптивный дизайн (мобильная версия с выдвижной панелью)

**ChatInput** (`frontend/src/components/ChatInput.tsx`)
- Автоматическое создание диалога при первом сообщении
- Сохранение каждого сообщения в БД

## Использование

### Для пользователей

1. **Начало нового диалога**:
   - Выберите тип запроса (Вопрос/Квиз/Задание)
   - Отправьте первое сообщение
   - Диалог автоматически создастся и сохранится

2. **Просмотр истории**:
   - Откройте боковую панель (на мобильных - кнопка в левом верхнем углу)
   - Просмотрите список всех диалогов
   - Нажмите на диалог для его загрузки

3. **Удаление диалога**:
   - Наведите на диалог в списке
   - Нажмите на иконку корзины
   - Подтвердите удаление

4. **Создание нового диалога**:
   - Нажмите кнопку "Новый диалог" в верхней части боковой панели

### Для разработчиков

#### Установка зависимостей

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

#### Инициализация базы данных

База данных создается автоматически при первом запуске сервера:

```bash
cd src
python -m uvicorn server:app --reload
```

#### Структура базы данных

```sql
-- Таблица диалогов
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    conversation_type VARCHAR NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сообщений
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

## Технологии

- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, Zustand (с persist middleware), TypeScript
- **UI**: TailwindCSS, Lucide Icons

## Особенности реализации

1. **Автоматическая генерация User ID**: Каждому пользователю присваивается уникальный ID, который сохраняется в localStorage

2. **Персистентность состояния**: Используется Zustand persist middleware для сохранения userId и currentConversationId между сессиями

3. **Каскадное удаление**: При удалении диалога автоматически удаляются все связанные сообщения

4. **Адаптивный дизайн**: Боковая панель истории адаптируется под мобильные устройства

5. **Оптимистичные обновления**: UI обновляется сразу, без ожидания ответа от сервера

## Возможные улучшения

1. Добавить поиск по диалогам
2. Реализовать редактирование заголовков диалогов
3. Добавить фильтрацию по типу диалога
4. Реализовать экспорт отдельных диалогов
5. Добавить пагинацию для большого количества диалогов
6. Реализовать аутентификацию пользователей
7. Добавить возможность делиться диалогами
