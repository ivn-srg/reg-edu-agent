from __future__ import annotations

from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from .config import ensure_dirs
from .ingest import build_vector_store
from .rag import RAGQA
from .quiz import generate_quiz
from .tasks import generate_task
from .database import init_db, get_db
from .crud import (
    create_conversation,
    get_conversation,
    get_user_conversations,
    count_user_conversations,
    delete_conversation,
    add_message,
    get_conversation_messages,
    update_conversation_title,
)
from sqlalchemy.orm import Session


app = FastAPI(title="RAG-EDU Agent", version="1.0")
ensure_dirs()
init_db()  # Инициализируем базу данных

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageHistory(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AskRequest(BaseModel):
    question: str
    k: int | None = None
    history: list[MessageHistory] | None = None


class AskResponse(BaseModel):
    question: str
    answer: str


class QuizRequest(BaseModel):
    topic: str
    num: int = 5
    history: list[MessageHistory] | None = None


class QuizResponse(BaseModel):
    topic: str
    questions: str


class TaskRequest(BaseModel):
    topic: str
    history: list[MessageHistory] | None = None


class TaskResponse(BaseModel):
    topic: str
    task: str


# Модели для conversations
class ConversationCreate(BaseModel):
    user_id: str
    title: str
    conversation_type: str  # question, quiz, task


class ConversationResponse(BaseModel):
    id: int
    user_id: str
    title: str
    conversation_type: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    id: int
    user_id: str
    title: str
    conversation_type: str
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        from_attributes = True


class ConversationsListResponse(BaseModel):
    conversations: list[ConversationListItem]
    total: int


class MessageCreate(BaseModel):
    role: str
    content: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ConversationExport(BaseModel):
    conversation: ConversationResponse
    messages: list[MessageResponse]


@app.post("/ingest")
def ingest() -> dict:
    try:
        build_vector_store()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    qa = RAGQA(k=req.k or 5)
    history = [{"role": h.role, "content": h.content} for h in (req.history or [])]
    out = qa.ask(req.question, history=history)
    return AskResponse(**out)


@app.post("/quiz", response_model=QuizResponse)
def quiz(req: QuizRequest):
    history = [{"role": h.role, "content": h.content} for h in (req.history or [])]
    out = generate_quiz(req.topic, req.num, history=history)
    return QuizResponse(**out)


@app.post("/task", response_model=TaskResponse)
def task(req: TaskRequest):
    history = [{"role": h.role, "content": h.content} for h in (req.history or [])]
    out = generate_task(req.topic, history=history)
    return TaskResponse(**out)


# Эндпоинты для conversations
@app.post("/conversations", response_model=ConversationResponse)
def create_conversation_endpoint(conv: ConversationCreate, db: Session = Depends(get_db)):
    """Создание нового диалога."""
    conversation = create_conversation(
        db=db,
        user_id=conv.user_id,
        title=conv.title,
        conversation_type=conv.conversation_type
    )
    # Подсчитываем количество сообщений
    message_count = len(conversation.messages)
    response = ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        conversation_type=conversation.conversation_type,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=message_count
    )
    return response


@app.get("/users/{user_id}/conversations", response_model=ConversationsListResponse)
def get_user_conversations_endpoint(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    conversation_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Получение списка диалогов пользователя."""
    conversations = get_user_conversations(
        db=db,
        user_id=user_id,
        skip=skip,
        limit=limit,
        search=search,
        conversation_type=conversation_type
    )
    
    total = count_user_conversations(
        db=db,
        user_id=user_id,
        search=search,
        conversation_type=conversation_type
    )
    
    # Формируем список с количеством сообщений
    conversation_list = []
    for conv in conversations:
        message_count = len(conv.messages)
        conversation_list.append(ConversationListItem(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title,
            conversation_type=conv.conversation_type,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=message_count
        ))
    
    return ConversationsListResponse(conversations=conversation_list, total=total)


@app.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation_endpoint(conversation_id: int, db: Session = Depends(get_db)):
    """Получение диалога по ID."""
    conversation = get_conversation(db=db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    message_count = len(conversation.messages)
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        conversation_type=conversation.conversation_type,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=message_count
    )


@app.delete("/conversations/{conversation_id}")
def delete_conversation_endpoint(conversation_id: int, db: Session = Depends(get_db)):
    """Удаление диалога."""
    success = delete_conversation(db=db, conversation_id=conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "ok"}


@app.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
def add_message_endpoint(
    conversation_id: int,
    message: MessageCreate,
    db: Session = Depends(get_db)
):
    """Добавление сообщения в диалог."""
    # Проверяем существование диалога
    conversation = get_conversation(db=db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    msg = add_message(
        db=db,
        conversation_id=conversation_id,
        role=message.role,
        content=message.content
    )
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        role=msg.role,
        content=msg.content,
        timestamp=msg.timestamp
    )


@app.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
def get_conversation_messages_endpoint(conversation_id: int, db: Session = Depends(get_db)):
    """Получение всех сообщений диалога."""
    messages = get_conversation_messages(db=db, conversation_id=conversation_id)
    return [
        MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            role=msg.role,
            content=msg.content,
            timestamp=msg.timestamp
        )
        for msg in messages
    ]


class ConversationTitleUpdate(BaseModel):
    title: str


@app.put("/conversations/{conversation_id}/title", response_model=ConversationResponse)
def update_conversation_title_endpoint(
    conversation_id: int,
    update: ConversationTitleUpdate,
    db: Session = Depends(get_db)
):
    """Обновление заголовка диалога."""
    conversation = update_conversation_title(
        db=db,
        conversation_id=conversation_id,
        title=update.title
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    message_count = len(conversation.messages)
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        conversation_type=conversation.conversation_type,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=message_count
    )


@app.get("/conversations/{conversation_id}/export", response_model=ConversationExport)
def export_conversation_endpoint(conversation_id: int, db: Session = Depends(get_db)):
    """Экспорт диалога."""
    conversation = get_conversation(db=db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = get_conversation_messages(db=db, conversation_id=conversation_id)
    
    return ConversationExport(
        conversation=ConversationResponse(
            id=conversation.id,
            user_id=conversation.user_id,
            title=conversation.title,
            conversation_type=conversation.conversation_type,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=len(messages)
        ),
        messages=[
            MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp
            )
            for msg in messages
        ]
    )

