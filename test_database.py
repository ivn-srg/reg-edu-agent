#!/usr/bin/env python3
"""
Тестовый скрипт для проверки работы системы сохранения истории диалогов.
"""

from src.database import init_db, SessionLocal
from src import crud

def test_conversation_system():
    """Тестирование системы диалогов."""
    print("🔧 Инициализация базы данных...")
    init_db()
    print("✅ База данных инициализирована\n")
    
    db = SessionLocal()
    
    try:
        # Создаем тестовый диалог
        print("📝 Создание тестового диалога...")
        conversation = crud.create_conversation(
            db=db,
            user_id="test_user_123",
            title="Тестовый диалог",
            conversation_type="question"
        )
        print(f"✅ Диалог создан с ID: {conversation.id}\n")
        
        # Добавляем сообщения
        print("💬 Добавление сообщений...")
        msg1 = crud.add_message(
            db=db,
            conversation_id=conversation.id,
            role="user",
            content="Что такое машинное обучение?"
        )
        print(f"✅ Сообщение пользователя добавлено (ID: {msg1.id})")
        
        msg2 = crud.add_message(
            db=db,
            conversation_id=conversation.id,
            role="assistant",
            content="Машинное обучение - это раздел искусственного интеллекта..."
        )
        print(f"✅ Сообщение ассистента добавлено (ID: {msg2.id})\n")
        
        # Получаем диалог с сообщениями
        print("🔍 Получение диалога из базы данных...")
        loaded_conversation = crud.get_conversation(db, conversation.id)
        print(f"✅ Диалог загружен: '{loaded_conversation.title}'")
        print(f"   Тип: {loaded_conversation.conversation_type}")
        print(f"   Количество сообщений: {len(loaded_conversation.messages)}\n")
        
        # Получаем все диалоги пользователя
        print("📋 Получение всех диалогов пользователя...")
        user_conversations = crud.get_user_conversations(db, "test_user_123")
        print(f"✅ Найдено диалогов: {len(user_conversations)}\n")
        
        # Выводим сообщения
        print("💬 Сообщения в диалоге:")
        messages = crud.get_conversation_messages(db, conversation.id)
        for msg in messages:
            role_emoji = "👤" if msg.role == "user" else "🤖"
            print(f"   {role_emoji} {msg.role}: {msg.content[:50]}...")
        
        print("\n✅ Все тесты пройдены успешно!")
        print(f"\n📊 База данных создана: conversations.db")
        print(f"   - Диалогов: {len(user_conversations)}")
        print(f"   - Сообщений: {len(messages)}")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_conversation_system()
