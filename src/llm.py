from __future__ import annotations

import socket
from typing import Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.chat_models import ChatOpenAI
try:
    # Prefer the maintained package
    from langchain_ollama import ChatOllama  # type: ignore
except Exception:  # fallback for environments without langchain-ollama
    from langchain_community.chat_models.ollama import ChatOllama  # type: ignore

from .config import llm_cfg


def _check_ollama_available(host: str = "localhost", port: int = 11434) -> bool:
    """Проверяет доступность Ollama сервера."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def get_chat_llm() -> BaseChatModel:
    provider = llm_cfg.provider.lower()
    if provider == "openai":
        return ChatOpenAI(
            model=llm_cfg.openai_model,
            api_key=llm_cfg.openai_api_key,
            base_url=llm_cfg.openai_base_url,
            temperature=0.2,
        )
    elif provider == "ollama":
        if not _check_ollama_available():
            raise ConnectionError(
                "Ollama сервер недоступен на localhost:11434.\n"
                "Решения:\n"
                "1. Запустите Ollama: установите с https://ollama.ai и выполните 'ollama serve'\n"
                "2. Или переключитесь на OpenAI: установите переменную окружения LLM_PROVIDER=openai "
                "и укажите OPENAI_API_KEY в .env файле"
            )
        return ChatOllama(model=llm_cfg.ollama_model, temperature=0.2)
    else:
        raise ValueError("Unsupported LLM_PROVIDER. Use 'openai' or 'ollama'.")


def generate_with_context(prompt: str, system: Optional[str] = None) -> str:
    llm = get_chat_llm()
    messages = []
    if system:
        messages.append(SystemMessage(content=system))
    messages.append(HumanMessage(content=prompt))
    out = llm.invoke(messages)
    return out.content or ""

