import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Paths:
    root: Path = Path(__file__).resolve().parents[1]
    data_dir: Path = root / "data"
    vector_dir: Path = root / "vector_store"


@dataclass(frozen=True)
class EmbeddingConfig:
    model_name: str = os.getenv("EMBEDDINGS_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    batch_size: int = int(os.getenv("EMBEDDINGS_BATCH_SIZE", "32"))


@dataclass(frozen=True)
class LLMConfig:
    provider: str = os.getenv("LLM_PROVIDER", "ollama")  # "openai" or "ollama"
    # OpenAI-compatible
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_base_url: str | None = os.getenv("OPENAI_BASE_URL")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    # Ollama
    ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")


@dataclass(frozen=True)
class ChunkingConfig:
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1200"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))


paths = Paths()
embed_cfg = EmbeddingConfig()
llm_cfg = LLMConfig()
chunk_cfg = ChunkingConfig()


def ensure_dirs() -> None:
    paths.data_dir.mkdir(parents=True, exist_ok=True)
    paths.vector_dir.mkdir(parents=True, exist_ok=True)

