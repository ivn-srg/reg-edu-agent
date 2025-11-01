from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session

from .config import paths


# Создаем базу данных в корневой директории проекта
DATABASE_URL = f"sqlite:///{paths.root}/conversations.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Conversation(Base):
    """Модель для хранения диалогов."""
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)  # Идентификатор пользователя
    title = Column(String, nullable=False)  # Заголовок диалога
    conversation_type = Column(String, nullable=False)  # question, quiz, task
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связь с сообщениями
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """Модель для хранения сообщений в диалоге."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # user или assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Связь с диалогом
    conversation = relationship("Conversation", back_populates="messages")


def init_db() -> None:
    """Инициализация базы данных."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Получение сессии базы данных."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
