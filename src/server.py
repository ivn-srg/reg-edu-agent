from __future__ import annotations

from typing import List
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .config import ensure_dirs
from .ingest import build_vector_store
from .rag import RAGQA
from .quiz import generate_quiz
from .tasks import generate_task
from .database import init_db, get_db
from . import crud


app = FastAPI(title="RAG-EDU Agent", version="1.0")
ensure_dirs()
init_db()  # Инициализация базы данных

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


# Модели для работы с историей диалогов
class ConversationCreate(BaseModel):
    user_id: str
    title: str
    conversation_type: str  # question, quiz, task


class MessageCreate(BaseModel):
    conversation_id: int
    role: str
    content: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    user_id: str
    title: str
    conversation_type: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

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


# Эндпоинты для работы с историей диалогов
@app.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db)
):
    """Создание нового диалога."""
    db_conversation = crud.create_conversation(
        db=db,
        user_id=conversation.user_id,
        title=conversation.title,
        conversation_type=conversation.conversation_type
    )
    return db_conversation


@app.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Получение диалога по ID."""
    conversation = crud.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.get("/users/{user_id}/conversations")
def get_user_conversations(
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    conversation_type: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: Session = Depends(get_db)
):
    """Получение всех диалогов пользователя с фильтрацией и поиском."""
    from datetime import datetime
    
    # Преобразуем строки дат в datetime
    date_from_dt = datetime.fromisoformat(date_from) if date_from else None
    date_to_dt = datetime.fromisoformat(date_to) if date_to else None
    
    conversations = crud.get_user_conversations(
        db, user_id, skip, limit, search, conversation_type, date_from_dt, date_to_dt
    )
    total = crud.count_user_conversations(
        db, user_id, search, conversation_type, date_from_dt, date_to_dt
    )
    
    # Формируем ответ с количеством сообщений
    result = []
    for conv in conversations:
        result.append({
            "id": conv.id,
            "user_id": conv.user_id,
            "title": conv.title,
            "conversation_type": conv.conversation_type,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "message_count": len(conv.messages)
        })
    
    return {
        "conversations": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@app.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Удаление диалога."""
    success = crud.delete_conversation(db, conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "ok"}


@app.post("/messages", response_model=MessageResponse)
def add_message(
    message: MessageCreate,
    db: Session = Depends(get_db)
):
    """Добавление сообщения в диалог."""
    # Проверяем существование диалога
    conversation = crud.get_conversation(db, message.conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db_message = crud.add_message(
        db=db,
        conversation_id=message.conversation_id,
        role=message.role,
        content=message.content
    )
    return db_message


@app.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Получение всех сообщений диалога."""
    messages = crud.get_conversation_messages(db, conversation_id)
    return messages


@app.put("/conversations/{conversation_id}/title")
def update_conversation_title(
    conversation_id: int,
    title: str,
    db: Session = Depends(get_db)
):
    """Обновление заголовка диалога."""
    conversation = crud.update_conversation_title(db, conversation_id, title)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "ok", "title": conversation.title}


@app.get("/conversations/{conversation_id}/export")
def export_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Экспорт диалога в JSON формате."""
    conversation = crud.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = crud.get_conversation_messages(db, conversation_id)
    
    export_data = {
        "conversation": {
            "id": conversation.id,
            "title": conversation.title,
            "type": conversation.conversation_type,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat()
        },
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]
    }
    
    return export_data

