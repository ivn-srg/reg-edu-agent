from __future__ import annotations

import argparse
import sys

from .ingest import build_vector_store
from .rag import RAGQA
from .quiz import generate_quiz
from .tasks import generate_task


def cmd_ingest(_: argparse.Namespace) -> int:
    build_vector_store()
    print("Index built.")
    return 0


def cmd_ask(ns: argparse.Namespace) -> int:
    qa = RAGQA(k=ns.k)
    out = qa.ask(ns.question)
    print(out["answer"])
    return 0


def cmd_quiz(ns: argparse.Namespace) -> int:
    out = generate_quiz(ns.topic, ns.num)
    print(out["questions"])
    return 0


def cmd_task(ns: argparse.Namespace) -> int:
    out = generate_task(ns.topic)
    print(out["task"])
    return 0


def main(argv: list[str] | None = None) -> int:
    argv = argv or sys.argv[1:]
    parser = argparse.ArgumentParser(prog="rag-edu-agent")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_ing = sub.add_parser("ingest", help="Build vector index from data/")
    p_ing.set_defaults(func=cmd_ingest)

    p_ask = sub.add_parser("ask", help="Ask a question constrained to materials")
    p_ask.add_argument("question", type=str)
    p_ask.add_argument("--k", type=int, default=5)
    p_ask.set_defaults(func=cmd_ask)

    p_quiz = sub.add_parser("quiz", help="Generate quiz questions by topic")
    p_quiz.add_argument("--topic", required=True)
    p_quiz.add_argument("--num", type=int, default=5)
    p_quiz.set_defaults(func=cmd_quiz)

    p_task = sub.add_parser("task", help="Generate an assignment by topic")
    p_task.add_argument("--topic", required=True)
    p_task.set_defaults(func=cmd_task)

    ns = parser.parse_args(argv)
    return ns.func(ns)


if __name__ == "__main__":
    raise SystemExit(main())

