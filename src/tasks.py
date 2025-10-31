from __future__ import annotations

from typing import Dict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from .llm import get_chat_llm
from .ingest import load_vector_store


TASK_SYSTEM = (
    "Ты генерируешь учебные задания строго по предоставленному контексту. "
    "Формулируй чёткое задание, критерии оценивания и что студент должен сдать."
)

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

