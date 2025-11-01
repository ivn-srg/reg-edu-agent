# Архитектура системы с историей диалогов

## Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ ConversationHist │  │      Chat        │  │  ChatInput   │  │
│  │   (Sidebar)      │  │   (Messages)     │  │  (Send msg)  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │           │
│           └─────────────────────┴────────────────────┘           │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │   Zustand Store   │                        │
│                    │  (State Manager)  │                        │
│                    └─────────┬─────────┘                        │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │    API Client     │                        │
│                    │  (HTTP Requests)  │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                               │ HTTP/JSON
                               │
┌──────────────────────────────▼─────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Endpoints                          │  │
│  │  /ask  /quiz  /task  /conversations  /messages  ...      │  │
│  └────────┬─────────────────────────────────────────────────┘  │
│           │                                                     │
│  ┌────────▼──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   RAG System      │  │  CRUD Ops    │  │  LLM (Ollama) │  │
│  │  (rag.py, quiz,   │  │  (crud.py)   │  │   (llm.py)    │  │
│  │   tasks.py)       │  └──────┬───────┘  └───────────────┘  │
│  └───────────────────┘         │                               │
│                                 │                               │
│                        ┌────────▼────────┐                     │
│                        │  Database Layer │                     │
│                        │  (database.py)  │                     │
│                        └────────┬────────┘                     │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  │ SQLAlchemy ORM
                                  │
                        ┌─────────▼─────────┐
                        │  SQLite Database  │
                        │ conversations.db  │
                        └───────────────────┘
```

## Поток данных при сохранении сообщения

```
1. User types message
         │
         ▼
2. ChatInput component
         │
         ├─► Check if conversation exists
         │   └─► If not, create new conversation
         │
         ├─► Add message to local state (Zustand)
         │
         ├─► Save user message to DB
         │   └─► POST /messages
         │
         ├─► Send to LLM for response
         │   └─► POST /ask or /quiz or /task
         │
         ├─► Add assistant response to local state
         │
         └─► Save assistant message to DB
             └─► POST /messages
```

## Поток данных при загрузке истории

```
1. User opens sidebar
         │
         ▼
2. ConversationHistory component
         │
         ├─► Fetch user conversations
         │   └─► GET /users/{user_id}/conversations
         │
         └─► Display list of conversations
                   │
                   ▼
3. User clicks on conversation
         │
         ├─► Fetch conversation with messages
         │   └─► GET /conversations/{id}
         │
         └─► Load messages into Zustand store
                   │
                   ▼
4. Chat component displays messages
```

## Структура базы данных

```
┌─────────────────────────────────────┐
│         conversations               │
├─────────────────────────────────────┤
│ id (PK)                             │
│ user_id                             │
│ title                               │
│ conversation_type                   │
│ created_at                          │
│ updated_at                          │
└─────────────┬───────────────────────┘
              │ 1
              │
              │ N
┌─────────────▼───────────────────────┐
│           messages                  │
├─────────────────────────────────────┤
│ id (PK)                             │
│ conversation_id (FK)                │
│ role                                │
│ content                             │
│ timestamp                           │
└─────────────────────────────────────┘
```

## Компоненты системы

### Frontend Components

```
App.tsx
  ├─► ConversationHistory.tsx (Sidebar)
  │     ├─► Displays list of conversations
  │     ├─► Handles conversation selection
  │     └─► Manages conversation deletion
  │
  ├─► Header.tsx (Top bar)
  │
  ├─► Chat.tsx (Message display)
  │     └─► Message.tsx (Individual messages)
  │
  └─► ChatInput.tsx (Input field)
        ├─► Creates conversations
        ├─► Sends messages
        └─► Saves to database
```

### Backend Modules

```
server.py (FastAPI app)
  ├─► /ask, /quiz, /task (RAG endpoints)
  │     └─► rag.py, quiz.py, tasks.py
  │           └─► llm.py (Ollama integration)
  │
  └─► /conversations, /messages (History endpoints)
        └─► crud.py (Database operations)
              └─► database.py (SQLAlchemy models)
                    └─► conversations.db (SQLite)
```

## State Management (Zustand)

```
ChatState
  ├─► messages: Message[]
  ├─► currentType: MessageType | null
  ├─► isLoading: boolean
  ├─► currentConversationId: number | null
  ├─► userId: string
  │
  ├─► addMessage()
  ├─► setCurrentType()
  ├─► setLoading()
  ├─► clearMessages()
  ├─► exportDialog()
  ├─► setCurrentConversationId()
  ├─► createNewConversation()
  ├─► saveMessageToDb()
  └─► loadConversation()
```

## API Endpoints

### RAG Endpoints (Existing)
```
POST /ingest          - Rebuild vector store
POST /ask             - Question answering
POST /quiz            - Generate quiz
POST /task            - Generate task
```

### History Endpoints (New)
```
POST   /conversations                    - Create conversation
GET    /conversations/{id}               - Get conversation
GET    /users/{user_id}/conversations    - List user conversations
DELETE /conversations/{id}               - Delete conversation
POST   /messages                         - Add message
GET    /conversations/{id}/messages      - Get messages
PUT    /conversations/{id}/title         - Update title
```

## Data Flow Example: Complete Interaction

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Selects "Question" type
     ▼
┌─────────────────┐
│  TypeSelector   │
└────┬────────────┘
     │ 2. Sets currentType in store
     ▼
┌─────────────────┐
│  ChatInput      │
└────┬────────────┘
     │ 3. User types "Что такое ML?"
     │ 4. Checks if conversation exists
     │ 5. Creates new conversation (if needed)
     │    POST /conversations
     ▼
┌─────────────────┐
│  Backend API    │
└────┬────────────┘
     │ 6. Saves conversation to DB
     ▼
┌─────────────────┐
│  SQLite DB      │
└────┬────────────┘
     │ 7. Returns conversation ID
     ▼
┌─────────────────┐
│  ChatInput      │
└────┬────────────┘
     │ 8. Saves user message
     │    POST /messages
     │ 9. Sends to RAG system
     │    POST /ask
     ▼
┌─────────────────┐
│  RAG System     │
└────┬────────────┘
     │ 10. Retrieves context from vector store
     │ 11. Generates response with LLM
     ▼
┌─────────────────┐
│  ChatInput      │
└────┬────────────┘
     │ 12. Saves assistant message
     │     POST /messages
     │ 13. Updates UI
     ▼
┌─────────────────┐
│  Chat Display   │
└─────────────────┘
```

## Security Considerations

1. **User Isolation**: Each user has unique ID stored in localStorage
2. **Data Validation**: Pydantic models validate all API inputs
3. **SQL Injection**: SQLAlchemy ORM prevents SQL injection
4. **CORS**: Configured for specific origins only

## Performance Optimizations

1. **Lazy Loading**: Conversations loaded on demand
2. **Pagination**: Support for limiting conversation lists
3. **Indexed Queries**: Database indexes on user_id and conversation_id
4. **Caching**: Zustand persist middleware caches user state

## Scalability Notes

Current implementation uses SQLite for simplicity. For production:

1. **Database**: Migrate to PostgreSQL or MySQL
2. **Authentication**: Add proper user authentication
3. **Caching**: Add Redis for session management
4. **Load Balancing**: Deploy multiple backend instances
5. **CDN**: Serve frontend assets via CDN

## Technology Stack Summary

```
Frontend:
  - React 19
  - TypeScript
  - Zustand (state)
  - TailwindCSS (styling)
  - Vite (bundler)

Backend:
  - FastAPI
  - SQLAlchemy
  - SQLite
  - Pydantic
  - Uvicorn

AI/ML:
  - Ollama (LLM)
  - FAISS (vector store)
  - Sentence Transformers (embeddings)
  - LangChain (RAG framework)
```
