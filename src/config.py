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
    model_name: str = os.getenv("EMBEDDINGS_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    batch_size: int = int(os.getenv("EMBEDDINGS_BATCH_SIZE", "32"))


@dataclass(frozen=True)
class LLMConfig:
    ollama_model: str = os.getenv("OLLAMA_MODEL", "hf.co/yandex/YandexGPT-5-Lite-8B-instruct-GGUF:Q4_K_M")
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


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

