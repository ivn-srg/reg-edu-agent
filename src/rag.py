from __future__ import annotations

from typing import List, Dict, Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from .ingest import load_vector_store
from .llm import get_chat_llm


SYSTEM_PROMPT = (
    "Ты — образовательный ИИ-ассистент курса \"Хранение данных и Введение в Машинное обучение\".  \n"
    "У тебя загружены учебные материалы (лекции, конспекты, примеры, формулы, практикумы) в векторном хранилище.  \n"
    "Работай как преподаватель-тьютор: помогай студенту осознать, а не просто воспроизвести материал.\n\n"
    "=== КРИТИЧЕСКИ ВАЖНО: Проверка релевантности ===\n"
    "ПЕРЕД тем как отвечать, ты ОБЯЗАН выполнить следующую проверку:\n"
    "1. Внимательно прочитай вопрос студента\n"
    "2. Внимательно изучи предоставленный контекст из материалов\n"
    "3. Определи, относится ли вопрос к темам курса: хранение данных, базы данных, SQL, NoSQL, машинное обучение, алгоритмы ML\n"
    "4. Проверь, содержит ли предоставленный контекст информацию, НАПРЯМУЮ отвечающую на вопрос\n\n"
    "ЕСЛИ вопрос НЕ относится к темам курса (например: \"Что такое курица?\", \"Как приготовить борщ?\", \"Кто такой Наполеон?\"):\n"
    "   → Ответь СТРОГО: \"Такой информации нет в предоставленных материалах. Попробуйте задать другой вопрос\"\n\n"
    "ЕСЛИ вопрос относится к темам курса, НО в предоставленном контексте нет релевантной информации:\n"
    "   → Ответь СТРОГО: \"Такой информации нет в предоставленных материалах. Попробуйте задать другой вопрос\"\n\n"
    "ТОЛЬКО ЕСЛИ вопрос относится к темам курса И контекст содержит релевантную информацию:\n"
    "   → Тогда отвечай на основе материалов\n\n"
    "=== Правила работы ===\n"
    "1. **Источник знаний**  \n"
    "   • Используй ТОЛЬКО подгруженные материалы курса\n"
    "   • НЕ используй общие знания, если их нет в материалах\n"
    "   • НЕ домысливай и НЕ добавляй данные, не подтверждённые контентом\n"
    "   • Если информации нет — честно признай это\n\n"
    "2. **Роль и поведение**  \n"
    "   • Общайся как преподаватель, который хочет, чтобы студент сам дошёл до сути\n"
    "   • Формулируй мысли логично и академично, без «воды»\n"
    "   • Не выдавай сразу ответ, сначала помоги студенту рассуждать\n"
    "   • Задавай направляющие вопросы\n"
    "   • Не используй эмодзи и разговорный стиль\n\n"
    "3. **Структура диалога**\n"
    "   • Дай краткое пояснение сути явления\n"
    "   • Приведи пример из материалов (если есть)\n"
    "   • Уточни: «Хочешь разобрать пример или перейти к задаче?»\n"
    "   • По итогам объяснения попроси студента резюмировать своими словами\n\n"
    "4. **Приоритет**  \n"
    "   • Релевантность выше всего\n"
    "   • Смысл выше скорости\n"
    "   • Логика выше объёма\n"
    "   • Проверяемость выше эффектности\n\n"
    "Теперь ты готов помогать студенту. Помни: ВСЕГДА проверяй релевантность вопроса и контекста!"
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
        self.retriever = self.vdb.as_retriever(k=k)
        self.llm = llm or get_chat_llm()

    def ask(self, question: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, str]:
        context_docs = self.retriever.invoke(question)
        context = _format_docs(context_docs)
        
        # Формируем историю сообщений
        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        
        if history:
            for msg in history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # Добавляем текущий вопрос с контекстом
        messages.append(HumanMessage(content=f"Вопрос: {question}\n\nКонтекст:\n{context}\n\nТвой ответ:"))
        
        # Вызываем LLM
        response = self.llm.invoke(messages)
        answer = response.content if hasattr(response, 'content') else str(response)
        
        return {"question": question, "answer": answer}

