from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import ensure_dirs
from .ingest import build_vector_store
from .rag import RAGQA
from .quiz import generate_quiz
from .tasks import generate_task


app = FastAPI(title="RAG-EDU Agent", version="1.0")
ensure_dirs()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageHistory(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class AskRequest(BaseModel):
    question: str
    k: int | None = None
    history: list[MessageHistory] | None = None


class AskResponse(BaseModel):
    question: str
    answer: str


class QuizRequest(BaseModel):
    topic: str
    num: int = 5
    history: list[MessageHistory] | None = None


class QuizResponse(BaseModel):
    topic: str
    questions: str


class TaskRequest(BaseModel):
    topic: str
    history: list[MessageHistory] | None = None


class TaskResponse(BaseModel):
    topic: str
    task: str


@app.post("/ingest")
def ingest() -> dict:
    try:
        build_vector_store()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    qa = RAGQA(k=req.k or 5)
    history = [{"role": h.role, "content": h.content} for h in (req.history or [])]
    out = qa.ask(req.question, history=history)
    return AskResponse(**out)


@app.post("/quiz", response_model=QuizResponse)
def quiz(req: QuizRequest):
    history = [{"role": h.role, "content": h.content} for h in (req.history or [])]
    out = generate_quiz(req.topic, req.num, history=history)
    return QuizResponse(**out)


@app.post("/task", response_model=TaskResponse)
def task(req: TaskRequest):
    history = [{"role": h.role, "content": h.content} for h in (req.history or [])]
    out = generate_task(req.topic, history=history)
    return TaskResponse(**out)

