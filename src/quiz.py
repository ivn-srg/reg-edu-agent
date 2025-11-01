from __future__ import annotations

from typing import List, Dict, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from .llm import get_chat_llm
from .ingest import load_vector_store


QUIZ_SYSTEM = (
    "Ты — ИИ-преподаватель курса \"Хранение данных и Введение в Машинное обучение\".  \n"
    "Твоя задача — составить тест по предоставленным учебным материалам.\n\n"
    "=== КРИТИЧЕСКИ ВАЖНО: Проверка релевантности ===\n"
    "ПЕРЕД генерацией вопросов ты ОБЯЗАН выполнить проверку:\n"
    "1. Определи, относится ли запрошенная тема к курсу: хранение данных, базы данных, SQL, NoSQL, машинное обучение, алгоритмы ML\n"
    "2. Проверь, содержит ли предоставленный контекст достаточно информации по этой теме\n\n"
    "ЕСЛИ тема НЕ относится к курсу (например: \"курица\", \"кулинария\", \"история\"):\n"
    "   → Ответь СТРОГО: \"Такой информации нет в предоставленных материалах. Попробуйте задать другой вопрос\"\n\n"
    "ЕСЛИ тема относится к курсу, НО в контексте недостаточно информации:\n"
    "   → Ответь СТРОГО: \"Такой информации нет в предоставленных материалах. Попробуйте задать другой вопрос\"\n\n"
    "ТОЛЬКО ЕСЛИ тема относится к курсу И контекст содержит достаточно информации:\n"
    "   → Тогда генерируй вопросы\n\n"
    "=== Правила генерации ===\n"
    "• Используй ТОЛЬКО информацию из предоставленных материалов\n"
    "• НЕ используй общие знания вне материалов\n"
    "• Вопросы должны быть чёткие, не двусмысленные\n"
    "• Формулировки — академичные, без разговорных оборотов\n"
    "• Каждый вопрос должен иметь правильный ответ и 3–4 правдоподобных варианта\n"
    "• Можно использовать теоретические и прикладные вопросы\n"
    "• НЕ придумывай факты, отсутствующие в материалах\n\n"
    "Помни: ВСЕГДА проверяй релевантность темы и достаточность контекста!")

QUIZ_PROMPT = ChatPromptTemplate.from_messages([
    ("system", QUIZ_SYSTEM),
    ("human", (
        "Сгенерируй {num} вопросов по теме: {topic}.\n"
        "Ограничивайся информацией в Контексте. Форматируй как пронумерованный список.\n\n"
        "Контекст:\n{context}\n\nВопросы:")),
])


def generate_quiz(topic: str, num: int = 5, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, str]:
    vdb = load_vector_store()
    retriever = vdb.as_retriever(k=6)
    context_docs = retriever.invoke(topic)
    context = "\n---\n".join(d.page_content for d in context_docs)

    # Формируем историю сообщений
    messages = [SystemMessage(content=QUIZ_SYSTEM)]
    
    if history:
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
    
    # Добавляем текущий запрос с контекстом
    prompt_text = f"Сгенерируй {num} вопросов по теме: {topic}.\nОграничивайся информацией в Контексте. Форматируй как пронумерованный список.\n\nКонтекст:\n{context}\n\nВопросы:"
    messages.append(HumanMessage(content=prompt_text))
    
    # Вызываем LLM
    llm = get_chat_llm()
    response = llm.invoke(messages)
    out = response.content if hasattr(response, 'content') else str(response)
    
    return {"topic": topic, "questions": out}

