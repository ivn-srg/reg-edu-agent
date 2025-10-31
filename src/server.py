from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .config import ensure_dirs
from .ingest import build_vector_store
from .rag import RAGQA
from .quiz import generate_quiz
from .tasks import generate_task


app = FastAPI(title="RAG-EDU Agent", version="1.0")
ensure_dirs()


class AskRequest(BaseModel):
    question: str
    k: int | None = None


class AskResponse(BaseModel):
    question: str
    answer: str


class QuizRequest(BaseModel):
    topic: str
    num: int = 5


class QuizResponse(BaseModel):
    topic: str
    questions: str


class TaskRequest(BaseModel):
    topic: str


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
    out = qa.ask(req.question)
    return AskResponse(**out)


@app.post("/quiz", response_model=QuizResponse)
def quiz(req: QuizRequest):
    out = generate_quiz(req.topic, req.num)
    return QuizResponse(**out)


@app.post("/task", response_model=TaskResponse)
def task(req: TaskRequest):
    out = generate_task(req.topic)
    return TaskResponse(**out)

