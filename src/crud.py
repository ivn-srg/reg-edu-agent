from __future__ import annotations

from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from .database import Conversation, Message


def create_conversation(
    db: Session,
    user_id: str,
    title: str,
    conversation_type: str
) -> Conversation:
    """Создание нового диалога."""
    conversation = Conversation(
        user_id=user_id,
        title=title,
        conversation_type=conversation_type
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def get_conversation(db: Session, conversation_id: int) -> Optional[Conversation]:
    """Получение диалога по ID."""
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()


def get_user_conversations(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    conversation_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> List[Conversation]:
    """Получение всех диалогов пользователя с фильтрацией и поиском."""
    query = db.query(Conversation).filter(Conversation.user_id == user_id)
    
    # Поиск по заголовку
    if search:
        query = query.filter(Conversation.title.ilike(f"%{search}%"))
    
    # Фильтр по типу
    if conversation_type:
        query = query.filter(Conversation.conversation_type == conversation_type)
    
    # Фильтр по дате
    if date_from:
        query = query.filter(Conversation.created_at >= date_from)
    if date_to:
        query = query.filter(Conversation.created_at <= date_to)
    
    return (
        query
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_user_conversations(
    db: Session,
    user_id: str,
    search: Optional[str] = None,
    conversation_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> int:
    """Подсчет количества диалогов пользователя с учетом фильтров."""
    query = db.query(func.count(Conversation.id)).filter(Conversation.user_id == user_id)
    
    if search:
        query = query.filter(Conversation.title.ilike(f"%{search}%"))
    if conversation_type:
        query = query.filter(Conversation.conversation_type == conversation_type)
    if date_from:
        query = query.filter(Conversation.created_at >= date_from)
    if date_to:
        query = query.filter(Conversation.created_at <= date_to)
    
    return query.scalar()


def delete_conversation(db: Session, conversation_id: int) -> bool:
    """Удаление диалога."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        db.delete(conversation)
        db.commit()
        return True
    return False


def add_message(
    db: Session,
    conversation_id: int,
    role: str,
    content: str
) -> Message:
    """Добавление сообщения в диалог."""
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content
    )
    db.add(message)
    
    # Обновляем время последнего изменения диалога
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    return message


def get_conversation_messages(
    db: Session,
    conversation_id: int
) -> List[Message]:
    """Получение всех сообщений диалога."""
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.timestamp.asc())
        .all()
    )


def update_conversation_title(
    db: Session,
    conversation_id: int,
    title: str
) -> Optional[Conversation]:
    """Обновление заголовка диалога."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.title = title
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)
    return conversation
