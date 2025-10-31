from __future__ import annotations

from typing import Dict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from .llm import get_chat_llm
from .ingest import load_vector_store


TASK_SYSTEM = (
    "Ты — ИИ-преподаватель курса \"Хранение больших данных и Введение в Машинное обучение\", проводящий устный экзамен.  \n"
    "Вся база знаний — только загруженные учебные материалы.  \n"
    "Твоя задача — проверить реальное понимание студента.\n"
    "=== Стиль общения ===\n"
    "• Вопросы короткие, но точные.  \n"
    "• Отвечай только на основе данных курса.  \n"
    "• После каждого ответа студента — задай уточняющий вопрос.  \n"
    "• Не оценивай эмоционально, только логически.  \n"
    "• Не подсказывай напрямую — направляй к осмыслению.  \n"
    "• После 3–4 вопросов сформулируй краткое заключение об уровне понимания.\n"
    "=== Правила ===\n"
    "• Перед генерацией задания проверь, есть ли нужная информация в предоставленных материалах.  \n"
    "• Если нужной информации нет или она не подходит, не генерируй задание.  \n"
    "• Не выходи за пределы предоставленных лекций.  \n"
    "• Если ответа нет в материале — отметь это.  \n"
    "• Формулируй точно, без допущений.  \n"
    "• Не упрощай сложные понятия до бытового уровня.")

TASK_PROMPT = ChatPromptTemplate.from_messages([
    ("system", TASK_SYSTEM),
    ("human", (
        "Составь задание по теме: {topic}. Ограничивайся только информацией из Контекста.\n"
        "Включи: цель задания, формулировку, критерии оценивания, ожидаемый формат ответа.\n\n"
        "Контекст:\n{context}\n\nЗадание:")),
])


def generate_task(topic: str) -> Dict[str, str]:
    vdb = load_vector_store()
    retriever = vdb.as_retriever(k=8)
    context_docs = retriever.get_relevant_documents(topic)
    context = "\n---\n".join(d.page_content for d in context_docs)

    chain = TASK_PROMPT | get_chat_llm() | StrOutputParser()
    out = chain.invoke({"topic": topic, "context": context})
    return {"topic": topic, "task": out}

