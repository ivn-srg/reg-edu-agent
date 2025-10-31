from __future__ import annotations

from pathlib import Path
from typing import Iterable, List

from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document
from sentence_transformers import SentenceTransformer

from .config import paths, embed_cfg, chunk_cfg, ensure_dirs
from .vectordb import VectorDB


def _iter_source_files(data_dir: Path) -> Iterable[Path]:
    for ext in ("*.pdf", "*.docx"):
        yield from data_dir.glob(ext)


def load_documents(data_dir: Path | None = None) -> List[Document]:
    data_dir = data_dir or paths.data_dir
    docs: List[Document] = []
    for file_path in _iter_source_files(data_dir):
        if file_path.suffix.lower() == ".pdf":
            loader = PyPDFLoader(str(file_path))
        elif file_path.suffix.lower() == ".docx":
            loader = Docx2txtLoader(str(file_path))
        else:
            continue
        docs.extend(loader.load())
    return docs


def split_documents(documents: List[Document]) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_cfg.chunk_size,
        chunk_overlap=chunk_cfg.chunk_overlap,
        separators=["\n\n", "\n", ". ", ", ", " "]
    )
    return splitter.split_documents(documents)


def get_embeddings_model():
    # SentenceTransformer runs fully local once the model is downloaded
    return SentenceTransformer(embed_cfg.model_name)


def build_vector_store(force_rebuild: bool = True) -> VectorDB:
    ensure_dirs()
    raw_docs = load_documents(paths.data_dir)
    if not raw_docs:
        raise RuntimeError(f"No documents found in {paths.data_dir}. Add .pdf or .docx files.")
    chunks = split_documents(raw_docs)

    model = get_embeddings_model()

    class STEmbeddings:
        def embed_documents(self, texts: List[str]) -> List[List[float]]:
            return model.encode(texts, batch_size=embed_cfg.batch_size, show_progress_bar=True).tolist()

        def embed_query(self, text: str) -> List[float]:
            return model.encode([text], batch_size=1).tolist()[0]

    vdb = VectorDB.from_documents(chunks, STEmbeddings(), paths.vector_dir)
    vdb.save()
    return vdb


def load_vector_store() -> VectorDB:
    model = get_embeddings_model()

    class STEmbeddings:
        def embed_documents(self, texts: List[str]) -> List[List[float]]:
            return model.encode(texts, batch_size=embed_cfg.batch_size, show_progress_bar=False).tolist()

        def embed_query(self, text: str) -> List[float]:
            return model.encode([text], batch_size=1).tolist()[0]

    return VectorDB.load(paths.vector_dir, STEmbeddings())


if __name__ == "__main__":
    build_vector_store()
    print("Vector store built at:", paths.vector_dir)

