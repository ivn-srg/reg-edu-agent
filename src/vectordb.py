from __future__ import annotations

from pathlib import Path
from typing import Iterable

from langchain_community.vectorstores import FAISS
from langchain.schema import Document


class VectorDB:
    def __init__(self, path: Path, faiss_store: FAISS | None = None) -> None:
        self.path = Path(path)
        self.faiss = faiss_store

    @classmethod
    def from_documents(cls, docs: Iterable[Document], embeddings, path: Path) -> "VectorDB":
        store = FAISS.from_documents(list(docs), embeddings)
        return cls(path=path, faiss_store=store)

    def save(self) -> None:
        if self.faiss is None:
            raise ValueError("FAISS store is not initialized")
        self.path.mkdir(parents=True, exist_ok=True)
        self.faiss.save_local(str(self.path))

    @classmethod
    def load(cls, path: Path, embeddings) -> "VectorDB":
        store = FAISS.load_local(str(path), embeddings, allow_dangerous_deserialization=True)
        return cls(path=path, faiss_store=store)

    def as_retriever(self, k: int = 5):
        if self.faiss is None:
            raise ValueError("FAISS store is not initialized")
        return self.faiss.as_retriever(search_type="similarity", search_kwargs={"k": k})

