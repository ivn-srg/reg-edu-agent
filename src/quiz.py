from __future__ import annotations

from typing import List, Dict, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from .llm import get_chat_llm
from .ingest import load_vector_store


QUIZ_SYSTEM = (
    "Ты — ИИ-преподаватель курса \"Хранение данных и Введение в Машинное обучение\".  \n"
    "Твоя задача — составить тест по предоставленным учебным материалам.\n"
    "=== Цель ===\n"
    "Проверить реальное понимание студентом ключевых тем курса.  \n"
    "Все вопросы и ответы должны быть строго основаны на учебных материалах.  \n"
    "Если нужной информации нет — не включай тему в тест.\n"
    "=== Правила ===\n"
    "• Перед генерацией вопросов проверь, есть ли нужная информация в предоставленных материалах.  \n"
    "• Если нужной информации нет или она не подходит, не генерируй вопросы.  \n"
    "• Не используй информацию вне предоставленных материалов.  \n"
    "• Вопросы должны быть чёткие, не двусмысленные.  \n"
    "• Формулировки — академичные, без разговорных оборотов.  \n"
    "• Тематика вопросов должна охватывать разные аспекты курса.  \n"
    "• Каждый вопрос должен иметь правильный ответ и 3–4 правдоподобных варианта (если это вариантный тест).  \n"
    "• Можно использовать как теоретические, так и прикладные вопросы (на понимание, применение, различие понятий, интерпретацию формул и т.п.).\n"
    "• Не придумывай факты, отсутствующие в материалах.\n"
    "• Если студент выбрал формат \"открытых вопросов\" — не добавляй варианты ответа, только правильный ответ/ключ.\n"
    "=== Дополнительные указания ===\n"
    "• Используй только факты, формулы, определения и примеры, встречающиеся в контексте.  \n"
    "• Если материала недостаточно для полного теста, создай меньшее количество вопросов и укажи причину.  \n"
    "• В конце выведи краткое пояснение: какие темы покрыты, какие упущены (если есть).")

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

