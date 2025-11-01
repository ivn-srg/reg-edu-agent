from __future__ import annotations

from typing import List, Dict, Optional
import time

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
    "5. **Форматирование ответа**  \n"
    "   • ОБЯЗАТЕЛЬНО используй Markdown для структурирования ответа\n"
    "   • Используй заголовки (##, ###) для разделения разделов\n"
    "   • Используй списки (-, *) для перечислений\n"
    "   • Используй **жирный** для важных терминов\n"
    "   • Используй `код` для технических терминов и команд\n"
    "   • Используй блоки кода ```язык``` для примеров кода\n"
    "   • Используй > для цитат и важных замечаний\n"
    "   • Используй таблицы | для сравнений\n\n"
    "Теперь ты готов помогать студенту. Помни: ВСЕГДА проверяй релевантность вопроса и контекста!"
)


QA_TEMPLATE = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="history"),
    ("human", "Вопрос: {question}\n\nКонтекст:\n{context}\n\nТвой ответ:"),
])


def _format_docs(docs) -> str:
    """Быстрое форматирование документов с использованием list comprehension."""
    return "\n---\n".join(d.page_content for d in docs)


class RAGQA:
    def __init__(self, llm: BaseChatModel | None = None, k: int = 5, similarity_threshold: float = 0.3) -> None:
        self.vdb = load_vector_store()
        # Используем простой retriever для скорости
        self.retriever = self.vdb.as_retriever(k=k * 2)  # Берем больше для последующей фильтрации
        self.llm = llm or get_chat_llm()
        self.similarity_threshold = similarity_threshold
        self.k = k

    def ask(self, question: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, str]:
        start_time = time.time()
        
        # Шаг 1: Быстрый retrieval (без compression)
        raw_docs = self.retriever.invoke(question)
        
        # Шаг 2: Semantic gating - фильтруем документы
        filtered_docs = semantic_gating(question, raw_docs, threshold=self.similarity_threshold)
        
        # Ограничиваем до k документов
        context_docs = filtered_docs[:self.k]
        
        # Проверяем, есть ли релевантные документы
        if not context_docs or len(context_docs) == 0:
            return {
                "question": question,
                "answer": "Такой информации нет в предоставленных материалах. Попробуйте задать другой вопрос"
            }
        
        context = _format_docs(context_docs)
        
        # Формируем историю сообщений (оптимизировано)
        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        
        # Ограничиваем историю последними 4 сообщениями для скорости
        if history:
            recent_history = history[-4:] if len(history) > 4 else history
            for msg in recent_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # Добавляем текущий вопрос с контекстом
        messages.append(HumanMessage(content=f"Вопрос: {question}\n\nКонтекст:\n{context}\n\nТвой ответ:"))
        
        # Вызываем LLM
        response = self.llm.invoke(messages)
        answer = response.content if hasattr(response, 'content') else str(response)
        
        # Шаг 3: Self-check валидация ответа
        validation = comprehensive_validation(answer, context, question)
        
        # Если ответ не прошел валидацию, возвращаем отказ
        if not validation["is_valid"]:
            answer = "Такой информации нет в предоставленных материалах. Попробуйте задать другой вопрос"
        
        elapsed_time = time.time() - start_time
        
        return {
            "question": question,
            "answer": answer,
            "_metadata": {
                "processing_time": elapsed_time,
                "docs_retrieved": len(raw_docs),
                "docs_filtered": len(context_docs),
                "validation": validation
            }
        }

