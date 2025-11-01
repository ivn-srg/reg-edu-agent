from __future__ import annotations

from typing import Dict, List, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from .llm import get_chat_llm
from .ingest import load_vector_store


TASK_SYSTEM = (
    "Ты — ИИ-преподаватель курса \"Хранение данных и Введение в Машинное обучение\".  \n"
    "Твоя задача — составить задание по предоставленным учебным материалам.\n\n"
    "=== КРИТИЧЕСКИ ВАЖНО: Проверка релевантности ===\n"
    "ПЕРЕД генерацией задания ты ОБЯЗАН выполнить проверку:\n"
    "1. Определи, относится ли запрошенная тема к курсу: хранение данных, базы данных, SQL, NoSQL, машинное обучение, алгоритмы ML\n"
    "2. Проверь, содержит ли предоставленный контекст достаточно информации по этой теме\n\n"
    "ЕСЛИ тема НЕ относится к курсу (например: \"курица\", \"кулинария\", \"история\"):\n"
    "   → Ответь СТРОГО: \"Такой информации нет в предоставленных материалах. Попробуйте задать другой вопрос\"\n\n"
    "ЕСЛИ тема относится к курсу, НО в контексте недостаточно информации:\n"
    "   → Ответь СТРОГО: \"Такой информации нет в предоставленных материалах. Попробуйте задать другой вопрос\"\n\n"
    "ТОЛЬКО ЕСЛИ тема относится к курсу И контекст содержит достаточно информации:\n"
    "   → Тогда генерируй задание\n\n"
    "=== Правила генерации ===\n"
    "• Используй ТОЛЬКО информацию из предоставленных материалов\n"
    "• НЕ используй общие знания вне материалов\n"
    "• Задание должно проверять реальное понимание\n"
    "• Формулируй точно, без допущений\n"
    "• Включи: цель задания, формулировку, критерии оценивания\n"
    "• НЕ выходи за пределы предоставленных лекций\n\n"
    "Помни: ВСЕГДА проверяй релевантность темы и достаточность контекста!")

TASK_PROMPT = ChatPromptTemplate.from_messages([
    ("system", TASK_SYSTEM),
    ("human", (
        "Составь задание по теме: {topic}. Ограничивайся только информацией из Контекста.\n"
        "Включи: цель задания, формулировку, критерии оценивания, ожидаемый формат ответа.\n\n"
        "Контекст:\n{context}\n\nЗадание:")),
])


def generate_task(topic: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, str]:
    vdb = load_vector_store()
    retriever = vdb.as_retriever(k=8)
    context_docs = retriever.invoke(topic)
    context = "\n---\n".join(d.page_content for d in context_docs)

    # Формируем историю сообщений
    messages = [SystemMessage(content=TASK_SYSTEM)]
    
    if history:
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
    
    # Добавляем текущий запрос с контекстом
    prompt_text = f"Составь задание по теме: {topic}. Ограничивайся только информацией из Контекста.\nВключи: цель задания, формулировку, критерии оценивания, ожидаемый формат ответа.\n\nКонтекст:\n{context}\n\nЗадание:"
    messages.append(HumanMessage(content=prompt_text))
    
    # Вызываем LLM
    llm = get_chat_llm()
    response = llm.invoke(messages)
    out = response.content if hasattr(response, 'content') else str(response)
    
    return {"topic": topic, "task": out}

