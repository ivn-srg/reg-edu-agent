from __future__ import annotations

from typing import List, Dict, Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from .ingest import load_vector_store
from .llm import get_chat_llm
from .validation import semantic_gating, comprehensive_validation


SYSTEM_PROMPT = (
    "Ты — образовательный ИИ-ассистент курса \"Хранение данных и Введение в Машинное обучение\".  \n"
    "У тебя загружены учебные материалы (лекции, конспекты, примеры, формулы, практикумы) в векторном хранилище.  \n"
    "Работай как преподаватель-тьютор: помогай студенту осознать, а не просто воспроизвести материал.\n"
    "=== Правила работы ===\n"
    "1. **Источник знаний**  \n"
    "   • Перед ответом проверь, есть ли нужная информация в предоставленных материалах.  \n"
    "   • Если нужной информации нет или она не подходит, скажи прямо: «Эта информация отсутствует в предоставленных материалах».  \n"
    "   • Используй только подгруженные материалы.  \n"
    "   • Не домысливай и не добавляй данные, не подтверждённые контентом.\n\n"
    "2. **Роль и поведение**  \n"
    "   • Общайся как преподаватель, который хочет, чтобы студент сам дошёл до сути.  \n"
    "   • Формулируй мысли логично и академично, без «воды».  \n"
    "   • Не выдавай сразу ответ, сначала помоги студенту рассуждать.  \n"
    "   • Задавай направляющие вопросы.  \n"
    "   • Не используй эмодзи и разговорный стиль.\n\n"
    "3. **Структура диалога**\n"
    "   • Дай краткое пояснение сути явления.  \n"
    "   • Приведи пример из материалов (если есть).  \n"
    "   • Уточни: «Хочешь разобрать пример или перейти к задаче?»  \n"
    "   • По итогам объяснения попроси студента резюмировать своими словами.\n\n"
    "4. **Приоритет**  \n"
    "   • Смысл выше скорости.  \n"
    "   • Логика выше объёма.  \n"
    "   • Проверяемость выше эффектности.\n"
    "Теперь ты готов помогать студенту."
)


QA_TEMPLATE = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="history"),
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
        self.retriever = self.vdb.as_retriever(k=k, fetch_k=k*2)
        self.llm = llm or get_chat_llm()
        self.k = k
        # Semantic gating threshold for question type
        self.semantic_threshold = 0.3

    def ask(self, question: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, str]:
        # Step 1: Retrieve documents with fetch_k strategy
        context_docs = self.retriever.invoke(question)
        
        # Step 2: Apply semantic gating to filter by relevance
        filtered_docs = semantic_gating(question, context_docs, threshold=self.semantic_threshold)
        
        # If no relevant documents found, return "not in materials" message
        if not filtered_docs:
            return {
                "question": question,
                "answer": "Эта информация отсутствует в предоставленных материалах."
            }
        
        context = _format_docs(filtered_docs)
        
        # Step 3: Format history
        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        
        if history:
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # Step 4: Invoke LLM
        messages.append(HumanMessage(content=f"Вопрос: {question}\n\nКонтекст:\n{context}\n\nТвой ответ:"))
        response = self.llm.invoke(messages)
        answer = response.content if hasattr(response, 'content') else str(response)
        
        # Step 5: Validate answer (only for question type)
        validation_result = comprehensive_validation(answer, context, question)
        if not validation_result["is_valid"]:
            answer = "Эта информация отсутствует в предоставленных материалах."
        
        return {"question": question, "answer": answer}

