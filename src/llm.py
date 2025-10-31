from __future__ import annotations

import socket
from typing import Optional
from urllib.parse import urlparse

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama  # type: ignore

from .config import llm_cfg


def _check_ollama_available(base_url: str = "http://localhost:11434") -> bool:
    """Проверяет доступность Ollama сервера."""
    try:
        parsed = urlparse(base_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 11434
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def get_chat_llm() -> BaseChatModel:
    """Возвращает настроенную модель Ollama."""
    base_url = llm_cfg.ollama_base_url
    if not _check_ollama_available(base_url):
        raise ConnectionError(
            f"Ollama сервер недоступен на {base_url}.\n"
            "Решения:\n"
            "1. Убедитесь, что Ollama запущен\n"
            "2. Проверьте настройку OLLAMA_BASE_URL в .env файле (по умолчанию http://localhost:11434)\n"
            "3. Убедитесь, что модель загружена: ollama pull <model_name>"
        )
    return ChatOllama(
        model=llm_cfg.ollama_model,
        base_url=base_url,
        temperature=0.2
    )


def generate_with_context(prompt: str, system: Optional[str] = None) -> str:
    llm = get_chat_llm()
    messages = []
    if system:
        messages.append(SystemMessage(content=system))
    messages.append(HumanMessage(content=prompt))
    out = llm.invoke(messages)
    return out.content or ""

