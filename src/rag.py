from __future__ import annotations

from typing import List, Dict

from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from .ingest import load_vector_store
from .llm import get_chat_llm


SYSTEM_PROMPT = (
    "Ты — образовательный ассистент для курса 'Хранение данных и Введение в Машинное обучение'. "
    "Отвечай ТОЛЬКО на основе предоставленного контекста. Если ответа нет в контексте, честно скажи, что информации нет. "
    "Пиши чётко и по делу, со ссылками на выдержки контекста (по возможности кратко).")


QA_TEMPLATE = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "Вопрос: {question}\n\nКонтекст:\n{context}\n\nТвой ответ:"),
])


def _format_docs(docs) -> str:
    parts = []
    for d in docs:
        parts.append(d.page_content)
    return "\n---\n".join(parts)


class RAGQA:
    def __init__(self, llm: BaseChatModel | None = None, k: int = 5) -> None:
        self.vdb = load_vector_store()
        self.retriever = self.vdb.as_retriever(k=k)
        self.llm = llm or get_chat_llm()

        self.chain = (
            {"context": self.retriever | _format_docs, "question": RunnablePassthrough()}  # type: ignore
            | QA_TEMPLATE
            | self.llm
            | StrOutputParser()
        )

    def ask(self, question: str) -> Dict[str, str]:
        answer = self.chain.invoke(question)
        return {"question": question, "answer": answer}

