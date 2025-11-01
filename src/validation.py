from __future__ import annotations

from typing import List, Set
import re
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from functools import lru_cache

from .config import get_embeddings

# Кешируем embeddings модель для переиспользования
_embeddings_cache = None

def _get_cached_embeddings():
    """Получает закешированную embeddings модель."""
    global _embeddings_cache
    if _embeddings_cache is None:
        _embeddings_cache = get_embeddings()
    return _embeddings_cache


def semantic_gating(query: str, documents: List, threshold: float = 0.3) -> List:
    """
    Semantic gating: фильтрует документы по семантической близости к запросу.
    Более быстрая альтернатива EmbeddingsFilter с кешированием.
    
    Args:
        query: Запрос пользователя
        documents: Список документов для фильтрации
        threshold: Порог similarity (по умолчанию 0.3)
    
    Returns:
        Отфильтрованный список документов
    """
    if not documents:
        return []
    
    embeddings_model = _get_cached_embeddings()
    
    # Получаем embedding запроса
    query_embedding = embeddings_model.embed_query(query)
    
    # Получаем embeddings документов (батчем для эффективности)
    doc_texts = [doc.page_content for doc in documents]
    doc_embeddings = embeddings_model.embed_documents(doc_texts)
    
    # Вычисляем cosine similarity
    similarities = cosine_similarity(
        [query_embedding],
        doc_embeddings
    )[0]
    
    # Фильтруем документы по порогу
    filtered_docs = [
        doc for doc, sim in zip(documents, similarities)
        if sim >= threshold
    ]
    
    return filtered_docs


# Кешируем стоп-слова как константу для переиспользования
_STOP_WORDS = frozenset({
    'и', 'в', 'на', 'с', 'по', 'для', 'как', 'что', 'это', 'или', 'а', 'но',
    'к', 'о', 'от', 'до', 'из', 'за', 'при', 'не', 'же', 'бы', 'то', 'так',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been',
    'ты', 'вы', 'он', 'она', 'они', 'мы', 'я', 'его', 'её', 'их', 'наш',
    'твой', 'ваш', 'этот', 'тот', 'такой', 'который', 'какой', 'чей',
})


def extract_key_terms(text: str, min_length: int = 3) -> Set[str]:
    """
    Извлекает ключевые термины из текста.
    
    Args:
        text: Текст для анализа
        min_length: Минимальная длина термина
    
    Returns:
        Множество ключевых терминов в нижнем регистре
    """
    # Удаляем пунктуацию и разбиваем на слова
    words = re.findall(r'\b\w+\b', text.lower())
    
    # Фильтруем слова (используем предкомпилированный frozenset для скорости)
    key_terms = {
        word for word in words
        if len(word) >= min_length and word not in _STOP_WORDS
    }
    
    return key_terms


def self_check_answer(answer: str, context: str, min_overlap_ratio: float = 0.3) -> tuple[bool, float]:
    """
    Self-check: проверяет, использует ли ответ термины из контекста.
    
    Args:
        answer: Сгенерированный ответ
        context: Предоставленный контекст
        min_overlap_ratio: Минимальное отношение пересечения терминов
    
    Returns:
        Tuple (is_valid, overlap_ratio)
    """
    # Извлекаем ключевые термины
    answer_terms = extract_key_terms(answer)
    context_terms = extract_key_terms(context)
    
    if not answer_terms:
        # Если в ответе нет терминов, считаем невалидным
        return False, 0.0
    
    if not context_terms:
        # Если в контексте нет терминов, пропускаем проверку
        return True, 1.0
    
    # Вычисляем пересечение
    overlap = answer_terms.intersection(context_terms)
    overlap_ratio = len(overlap) / len(answer_terms)
    
    # Проверяем, достаточно ли пересечение
    is_valid = overlap_ratio >= min_overlap_ratio
    
    return is_valid, overlap_ratio


def validate_answer_relevance(answer: str, context: str, threshold: float = 0.4) -> tuple[bool, float]:
    """
    Дополнительная проверка релевантности ответа через embeddings.
    
    Args:
        answer: Сгенерированный ответ
        context: Предоставленный контекст
        threshold: Порог similarity
    
    Returns:
        Tuple (is_valid, similarity_score)
    """
    embeddings_model = _get_cached_embeddings()
    
    # Получаем embeddings батчем для эффективности
    embeddings = embeddings_model.embed_documents([answer, context])
    answer_embedding = embeddings[0]
    context_embedding = embeddings[1]
    
    # Вычисляем similarity
    similarity = cosine_similarity(
        [answer_embedding],
        [context_embedding]
    )[0][0]
    
    is_valid = similarity >= threshold
    
    return is_valid, float(similarity)


def comprehensive_validation(answer: str, context: str, query: str) -> dict:
    """
    Комплексная валидация ответа.
    
    Args:
        answer: Сгенерированный ответ
        context: Предоставленный контекст
        query: Исходный запрос
    
    Returns:
        Dict с результатами валидации
    """
    # Self-check по терминам
    term_valid, term_overlap = self_check_answer(answer, context, min_overlap_ratio=0.2)
    
    # Проверка релевантности через embeddings
    emb_valid, emb_similarity = validate_answer_relevance(answer, context, threshold=0.3)
    
    # Проверка, что ответ не является отказом
    rejection_phrases = [
        "такой информации нет",
        "информация отсутствует",
        "нет в материалах",
        "попробуйте задать другой вопрос"
    ]
    is_rejection = any(phrase in answer.lower() for phrase in rejection_phrases)
    
    # Итоговая валидация
    is_valid = (term_valid or emb_valid) and not is_rejection
    
    return {
        "is_valid": is_valid,
        "term_overlap": term_overlap,
        "embedding_similarity": emb_similarity,
        "is_rejection": is_rejection,
        "details": {
            "term_check_passed": term_valid,
            "embedding_check_passed": emb_valid
        }
    }
