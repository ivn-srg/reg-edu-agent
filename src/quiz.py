from __future__ import annotations

from typing import List, Dict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from .llm import get_chat_llm
from .ingest import load_vector_store


QUIZ_SYSTEM = (
    "Ты генерируешь вопросы для самопроверки студента ТОЛЬКО по контексту. "
    "Дай четкие, краткие вопросы. Если контекст недостаточен — скажи, что недостаточно информации.")

QUIZ_PROMPT = ChatPromptTemplate.from_messages([
    ("system", QUIZ_SYSTEM),
    ("human", (
        "Сгенерируй {num} вопросов по теме: {topic}.\n"
        "Ограничивайся информацией в Контексте. Форматируй как пронумерованный список.\n\n"
        "Контекст:\n{context}\n\nВопросы:")),
])


def generate_quiz(topic: str, num: int = 5) -> Dict[str, str]:
    vdb = load_vector_store()
    retriever = vdb.as_retriever(k=6)
    context_docs = retriever.get_relevant_documents(topic)
    context = "\n---\n".join(d.page_content for d in context_docs)

    chain = QUIZ_PROMPT | get_chat_llm() | StrOutputParser()
    out = chain.invoke({"topic": topic, "num": num, "context": context})
    return {"topic": topic, "questions": out}

