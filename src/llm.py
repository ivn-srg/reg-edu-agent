from __future__ import annotations

from typing import Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.chat_models import ChatOpenAI
from langchain_community.chat_models.ollama import ChatOllama

from .config import llm_cfg


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

