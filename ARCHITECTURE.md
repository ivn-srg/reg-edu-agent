# Архитектура системы с историей диалогов

## Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │ ConversationHist │  │      Chat        │  │  ChatInput   │   │
│  │   (Sidebar)      │  │   (Messages)     │  │  (Send msg)  │   │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘   │
│           │                     │                   │           │
│           └─────────────────────┴───────────────────┘           │
│                              │                                  │
│                    ┌─────────▼─────────┐                        │
│                    │   Zustand Store   │                        │
│                    │  (State Manager)  │                        │
│                    └─────────┬─────────┘                        │
│                              │                                  │
│                    ┌─────────▼─────────┐                        │
│                    │    API Client     │                        │
│                    │  (HTTP Requests)  │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               │ HTTP/JSON
                               │
┌──────────────────────────────▼─────────────────────────────────┐
│                      BACKEND (FastAPI)                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Endpoints                         │  │
│  │  /ask  /quiz  /task  /conversations  /messages  ...      │  │
│  └────────┬─────────────────────────────────────────────────┘  │
│           │                                                    │
│  ┌────────▼──────────┐  ┌──────────────┐  ┌───────────────┐    │
│  │   RAG System      │  │  CRUD Ops    │  │  LLM (Ollama) │    │
│  │  (rag.py, quiz,   │  │  (crud.py)   │  │   (llm.py)    │    │
│  │   tasks.py)       │  └───────┬──────┘  └───────────────┘    │
│  └───────────────────┘          │                              │
│                                 │                              │
│                        ┌────────▼────────┐                     │
│                        │  Database Layer │                     │
│                        │  (database.py)  │                     │
│                        └────────┬────────┘                     │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                                  │ SQLAlchemy ORM
                                  │
                        ┌─────────▼─────────┐
                        │  SQLite Database  │
                        │ conversations.db  │
                        └───────────────────┘
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